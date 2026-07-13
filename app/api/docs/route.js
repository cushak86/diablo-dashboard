import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedis } from "../../../lib/redis";
import { isAuthed } from "../../../lib/auth";
import { makeId, sanitizeId, sanitizePath, extractSummary, MAX_DOC_BYTES } from "../../../lib/docs";

const MAX_BATCH = 200; // 폴더 업로드 배치 상한(서버리스 왕복·타임아웃 방어). 초과분은 truncated로 응답에 표면화

// GET: 문서 목록(메타). 공개 — 뷰어 진입점 목록에 사용
// 최신 200개로 제한, Redis 장애 시 빈 목록으로 degrade(500 대신).
// path(폴더 구조)는 관리자 트리 전용 — 인증된 요청에만 포함(비인증엔 폴더 경로 미노출).
export async function GET() {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ docs: [] });
  const authed = isAuthed((await cookies()).get("admin_session")?.value);

  try {
    const ids = await redis.zrange("docs:index", 0, 199, { rev: true });
    if (!ids?.length) return NextResponse.json({ docs: [] });

    const raw = await Promise.all(ids.map((id) => redis.get(`doc:${id}`)));
    const docs = raw
      .map((d, i) =>
        d
          ? {
              id: ids[i],
              title: d.title,
              ...(authed ? { path: d.path || "", summary: d.summary || "" } : {}),
              createdAt: d.createdAt,
            }
          : null
      )
      .filter(Boolean);
    return NextResponse.json({ docs });
  } catch {
    return NextResponse.json({ docs: [] });
  }
}

// 문서 1건 저장. 경로는 서버에서 새니타이즈(클라 값 신뢰 금지).
// Redis 키는 makeId(title) 기반 slug — 경로를 키에 사용하지 않음.
async function storeOne(redis, file) {
  const title = (typeof file?.title === "string" ? file.title : "").trim().slice(0, 200) || "제목 없음";
  const content = typeof file?.content === "string" ? file.content : "";
  const path = sanitizePath(file?.path);

  if (!content.trim()) return { error: "내용이 비어 있습니다.", title };
  if (Buffer.byteLength(content, "utf8") > MAX_DOC_BYTES) {
    return { error: "파일이 너무 큽니다 (최대 256KB).", title };
  }

  const id = makeId(title);
  const now = Date.now();
  const summary = extractSummary(content, title); // content에서 요약 자동 추출(순수 텍스트, 상한 절단)
  // NX: 혹시 모를 id 충돌 시 기존 문서 덮어쓰기 방지
  const stored = await redis.set(`doc:${id}`, { title, content, path, summary, createdAt: now }, { nx: true });
  if (stored === null) return { error: "id 충돌", title };
  await redis.zadd("docs:index", { score: now, member: id });
  return { ok: true, id, title, path };
}

// POST: 업로드(관리자 전용). 단일 {title, content} 또는 폴더 {files:[{title, content, path}]}
export async function POST(req) {
  if (!isAuthed((await cookies()).get("admin_session")?.value)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "저장소(Upstash)가 설정되지 않았습니다." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));

  // 폴더(다중파일) 업로드 — 부분 실패 허용, 성공 건만 집계
  if (Array.isArray(body.files)) {
    if (!body.files.length) {
      return NextResponse.json({ error: "업로드할 파일이 없습니다." }, { status: 400 });
    }
    const batch = body.files.slice(0, MAX_BATCH);
    const truncated = body.files.length - batch.length; // 상한 초과로 잘린 개수(응답에 표면화)
    const results = [];
    for (const f of batch) {
      results.push(await storeOne(redis, f));
    }
    const count = results.filter((r) => r.ok).length;
    // 전부 실패면 422로 명시(클라가 성공으로 오인하지 않도록)
    const status = count === 0 ? 422 : 200;
    return NextResponse.json(
      { ok: count > 0, count, total: results.length, truncated, results },
      { status }
    );
  }

  // 단일 파일 업로드 — 기존 응답/상태코드 형태 유지(회귀 금지)
  const r = await storeOne(redis, body);
  if (r.error) {
    const status = r.error.includes("너무 큽니다") ? 413 : r.error === "id 충돌" ? 409 : 400;
    const error = r.error === "id 충돌" ? "잠시 후 다시 시도해 주세요 (id 충돌)." : r.error;
    return NextResponse.json({ error }, { status });
  }
  return NextResponse.json({ ok: true, id: r.id });
}

// DELETE: 문서 삭제(관리자 전용). body {ids:[...]} — 각 id의 doc:<id> 삭제 + docs:index에서 zrem.
// 폴더(작업) 단위 삭제는 클라가 트리에서 하위 id를 모아 bulk로 넘긴다(서버 path 매칭 없음).
export async function DELETE(req) {
  if (!isAuthed((await cookies()).get("admin_session")?.value)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "저장소(Upstash)가 설정되지 않았습니다." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  // 클라 값 신뢰 금지 — 정규화 전에 raw 배열을 먼저 상한(500)으로 잘라 거대 입력 처리 비용(DoS) 차단.
  // 그 다음 sanitizeId(소문자 영숫자·하이픈만)로 정리, 빈 것 제외, 중복 제거.
  const raw = Array.isArray(body.ids) ? body.ids : [];
  const ids = [...new Set(raw.slice(0, 500).map(sanitizeId).filter(Boolean))];
  if (!ids.length) {
    return NextResponse.json({ error: "삭제할 문서 id가 없습니다." }, { status: 400 });
  }

  let deleted = 0;
  for (const id of ids) {
    const n = await redis.del(`doc:${id}`); // 실제 삭제된 키 수(0=이미 없음)
    await redis.zrem("docs:index", id); // 문서 유무와 무관하게 인덱스 정리
    if (n) deleted += 1;
  }
  return NextResponse.json({ ok: true, deleted });
}
