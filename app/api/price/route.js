import { NextResponse } from "next/server";
import { createHmac, randomUUID } from "crypto";
import { getRedis, todayKST } from "../../../lib/redis";
import { CATALOG_KEYS } from "../../../lib/price-catalog";
import { UNIT_SET, normalizePrice, sanitizeNote, aggregate } from "../../../lib/price";

const WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 집계 창(14일)
const MAX_REPORTS = 50;   // itemKey당 보관 상한
const DAILY_LIMIT = 20;   // ipHash당 일일 상한
const GLOBAL_LIMIT = 500; // 전역 일일 상한(IP 회전 남용 바운드)
const COOLDOWN_S = 600;   // 동일 ipHash+itemKey 재제보 쿨다운(10분)
const AGG_TTL_S = 300;    // 집계 캐시 TTL
const MAX_BODY = 2048;    // POST body 상한(bytes)

const reportsKey = (k) => `price:reports:${k}`;
const aggKey = (k) => `price:agg:${k}`;
const verKey = (k) => `price:v:${k}`;

// 신뢰 IP: Vercel이 설정하는 x-real-ip 우선 → 없으면 XFF 마지막 값(프록시가 append) → 헤더 없으면 "unknown".
// (XFF 첫 값은 클라이언트가 위조 가능하므로 신뢰하지 않는다.)
function clientIp(req) {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",");
    return parts[parts.length - 1].trim();
  }
  return "unknown";
}
function ipHash(req, secret) {
  return createHmac("sha256", secret).update(clientIp(req)).digest("hex").slice(0, 24);
}
// KST 자정까지 남은 초(레이트리밋 EXPIRE용).
function secToKstMidnight() {
  const now = new Date();
  const kst = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60000);
  const end = new Date(kst);
  end.setHours(24, 0, 0, 0);
  return Math.max(60, Math.ceil((end - kst) / 1000));
}

// ── GET: itemKey 집계 조회(공개). 캐시 hit 즉시 반환, miss 시 재계산 ──
// 버전 마커로 stale 재캐시 경합 방지: 집계 시작 전 v를 읽고, 캐시 저장 직전 재확인해 변했으면 저장 생략.
export async function GET(req) {
  const redis = getRedis();
  const { searchParams } = new URL(req.url);
  const itemKey = searchParams.get("itemKey") || "";
  if (!CATALOG_KEYS.has(itemKey)) {
    return NextResponse.json({ error: "알 수 없는 아이템입니다." }, { status: 400 });
  }
  if (!redis) {
    return NextResponse.json({ itemKey, units: [], total: 0, recent: [], redis: false });
  }
  try {
    const cached = await redis.get(aggKey(itemKey));
    if (cached) return NextResponse.json({ itemKey, redis: true, ...cached });

    const verBefore = await redis.get(verKey(itemKey));
    const now = Date.now();
    const raw = await redis.zrange(reportsKey(itemKey), 0, -1);
    const reports = raw
      .map((m) => {
        try { return typeof m === "string" ? JSON.parse(m) : m; } catch { return null; }
      })
      .filter((r) => r && r.t >= now - WINDOW_MS);

    const agg = aggregate(reports, now);
    // 재캐시 직전 버전 재확인 — 사이에 POST(버전 INCR)가 있었으면 stale 저장 생략(응답은 그대로 반환).
    const verAfter = await redis.get(verKey(itemKey));
    if (String(verBefore) === String(verAfter)) {
      await redis.set(aggKey(itemKey), agg, { ex: AGG_TTL_S });
    }
    return NextResponse.json({ itemKey, redis: true, ...agg });
  } catch {
    return NextResponse.json({ itemKey, units: [], total: 0, recent: [], redis: false });
  }
}

// ── POST: 익명 제보 ──
export async function POST(req) {
  // 1) body 크기 게이트(json 파싱 전).
  if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
    return NextResponse.json({ error: "요청이 너무 큽니다." }, { status: 413 });
  }
  const body = await req.json().catch(() => ({}));

  // 2) 허니팟 — 채워지면 조용히 드랍(가짜 성공).
  if (body.website) return NextResponse.json({ ok: true });

  // 3) 값 검증
  const itemKey = typeof body.itemKey === "string" ? body.itemKey : "";
  if (!CATALOG_KEYS.has(itemKey)) {
    return NextResponse.json({ error: "알 수 없는 아이템입니다." }, { status: 400 });
  }
  if (!UNIT_SET.has(body.unit)) {
    return NextResponse.json({ error: "단위(룬)를 선택해 주세요." }, { status: 400 });
  }
  const price = normalizePrice(body.price);
  if (price === null) {
    return NextResponse.json({ error: "가격은 0 초과 9999 이하 숫자여야 합니다." }, { status: 400 });
  }
  const note = sanitizeNote(body.note);

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "제보 저장소가 아직 설정되지 않았습니다." }, { status: 503 });
  }
  // 4) 해시 시크릿 fail-closed — 없으면 익명 레이트리밋 불가 → 제보 거부(하드코드 폴백 제거).
  const secret = process.env.PRICE_HASH_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    return NextResponse.json({ error: "제보 기능이 설정되지 않았습니다." }, { status: 503 });
  }
  const h = ipHash(req, secret);
  const day = todayKST();

  try {
    // 5) 쿨다운(동일 ipHash+itemKey 10분) — 반복 제보를 여기서 원자 차단해 뒤 카운터 오염 방지.
    const cd = await redis.set(`cd:price:${h}:${itemKey}`, 1, { nx: true, ex: COOLDOWN_S });
    if (cd === null) {
      return NextResponse.json(
        { error: "같은 아이템은 잠시 후(10분) 다시 제보할 수 있습니다." },
        { status: 429 }
      );
    }
    // 6) ipHash 일일 상한 — 원자적: 첫 회(===1)에만 EXPIRE.
    const rlKey = `rl:price:${day}:${h}`;
    const n = await redis.incr(rlKey);
    if (n === 1) await redis.expire(rlKey, secToKstMidnight());
    if (n > DAILY_LIMIT) {
      return NextResponse.json(
        { error: "오늘 제보 한도를 초과했습니다. 내일 다시 시도해 주세요." },
        { status: 429 }
      );
    }
    // 7) 전역 일일 상한 — IP 회전 남용을 상수로 바운드(rl/cd 키 증식도 자연 제한).
    const gKey = `rl:price:global:${day}`;
    const g = await redis.incr(gKey);
    if (g === 1) await redis.expire(gKey, secToKstMidnight());
    if (g > GLOBAL_LIMIT) {
      return NextResponse.json(
        { error: "오늘 전체 제보가 마감되었습니다. 내일 다시 시도해 주세요." },
        { status: 429 }
      );
    }
    // 8) 저장 + 창/상한 정리 + 버전 INCR(캐시 경합 가드) + agg 무효화
    const now = Date.now();
    const report = { id: randomUUID(), price, unit: body.unit, note, t: now };
    await redis.zadd(reportsKey(itemKey), { score: now, member: JSON.stringify(report) });
    await redis.zremrangebyscore(reportsKey(itemKey), 0, now - WINDOW_MS);
    await redis.zremrangebyrank(reportsKey(itemKey), 0, -(MAX_REPORTS + 1));
    await redis.incr(verKey(itemKey));
    await redis.del(aggKey(itemKey));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "제보 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
