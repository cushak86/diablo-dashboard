// 무로그인 동기화 — 개인 상태를 랜덤 코드 하나에 묶어 서버에 둔다. 계정·이메일 없음(익명성 유지).
//
// 왜 필요한가: 상태가 localStorage에만 있으면 Safari(iOS 포함)가 7일 미방문 시 지운다(ITP).
//   그레일 682종은 수개월짜리 수집이라 유실이 치명적이다. 수동 백업은 "누르는 것을 기억해야" 하므로 방어가 못 된다.
//
// 보안 모델: 코드가 곧 접근 권한이다(비밀번호와 동일). 그래서 ①추측 불가능한 길이(128비트)
//   ②IP 레이트리밋 ③크기 상한 ④형식 검증(백업 파서 재사용)을 둔다. 개인정보는 담기지 않는다.
import { NextResponse } from "next/server";
import { getRedis } from "../../../lib/redis";
import { parseImport } from "../../../lib/backup";
import { newCode, isValidCode, normalizeCode } from "../../../lib/sync-code";

const TTL_SEC = 180 * 24 * 60 * 60; // 180일. 쓸 때마다 갱신되므로 쓰는 사람은 영구히 유지된다.
const MAX_BYTES = 256 * 1024;
const WRITE_MAX = 60;      // IP당 윈도우 내 쓰기 횟수
const READ_MAX = 120;
const WINDOW_SEC = 60 * 60;

const clientIp = (req) =>
  req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
  req.headers.get("x-real-ip") ||
  "unknown";


async function overLimit(redis, ip, kind, max) {
  if (!redis) return false;
  const key = `sync:rl:${kind}:${ip}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, WINDOW_SEC);
  else if ((await redis.ttl(key)) < 0) await redis.expire(key, WINDOW_SEC); // TTL 유실 시 영구 잠금 방지
  return n > max;
}

// GET /api/sync?code=... → 저장된 백업 payload
export async function GET(req) {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "동기화 기능이 설정되지 않았습니다." }, { status: 503 });

  const code = normalizeCode(new URL(req.url).searchParams.get("code"));
  if (!isValidCode(code)) return NextResponse.json({ error: "코드 형식이 올바르지 않습니다." }, { status: 400 });

  if (await overLimit(redis, clientIp(req), "get", READ_MAX)) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." }, { status: 429 });
  }

  const raw = await redis.get(`sync:${code}`);
  if (!raw) return NextResponse.json({ error: "코드를 찾을 수 없습니다. 오타이거나 만료됐습니다." }, { status: 404 });

  const payload = typeof raw === "string" ? raw : JSON.stringify(raw);
  return NextResponse.json({ payload, updatedAt: await redis.get(`sync:at:${code}`) });
}

// POST /api/sync  { code?: string, payload: <백업 JSON 문자열> } → { code }
export async function POST(req) {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ error: "동기화 기능이 설정되지 않았습니다." }, { status: 503 });

  if (await overLimit(redis, clientIp(req), "post", WRITE_MAX)) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const payload = typeof body?.payload === "string" ? body.payload : "";
  if (!payload) return NextResponse.json({ error: "보낼 데이터가 없습니다." }, { status: 400 });
  if (Buffer.byteLength(payload, "utf8") > MAX_BYTES) {
    return NextResponse.json({ error: "데이터가 너무 큽니다." }, { status: 413 });
  }

  // 형식 검증은 import와 **같은 파서**를 쓴다 — 서버에 쓰레기를 저장하면 복원이 더 위험해진다.
  const parsed = parseImport(payload);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  let code = normalizeCode(body?.code);
  if (code && !isValidCode(code)) {
    return NextResponse.json({ error: "코드 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (!code) code = newCode();

  const at = new Date().toISOString();
  await redis.set(`sync:${code}`, payload, { ex: TTL_SEC });
  await redis.set(`sync:at:${code}`, at, { ex: TTL_SEC });
  return NextResponse.json({ code, updatedAt: at });
}
