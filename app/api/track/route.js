import { NextResponse } from "next/server";
import { getRedis } from "../../../lib/redis";
import { normalizePath } from "../../../lib/pages";

export const dynamic = "force-dynamic";

const MAX_DWELL_MS = 30 * 60 * 1000; // 30분 상한 — 탭 방치·이상치가 평균을 왜곡하지 않도록

// 페이지 체류/조회 수집. 성공/무시 모두 204(beacon은 응답 본문을 읽지 않음).
// 개발자 제외 쿠키·미허용 경로·Redis 장애 시 조용히 무기록.
export async function POST(req) {
  if (req.cookies.get("dv_exclude")) {
    return new NextResponse(null, { status: 204 }); // 개발자 트래픽 제외
  }

  // 크로스오리진 남용 차단(가벼운 카운터 스팸 방지). Origin이 있으면 host 일치 필수.
  // 헤더 부재 시 fail-open — 정상 same-origin beacon 손실 방지.
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.get("host")) {
        return new NextResponse(null, { status: 204 });
      }
    } catch {
      return new NextResponse(null, { status: 204 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const path = normalizePath(body?.path);
  if (!path) return new NextResponse(null, { status: 204 });

  const redis = getRedis();
  if (!redis) return new NextResponse(null, { status: 204 });

  const dwell = Number(body?.dwellMs);
  try {
    const ops = [redis.incr(`page:${path}`)];
    // 유효한 체류시간만 평균 산출에 반영(0·음수·비정상 제외, 상한 클램프)
    if (Number.isFinite(dwell) && dwell > 0) {
      const ms = Math.min(Math.round(dwell), MAX_DWELL_MS);
      ops.push(redis.hincrby(`dwell:${path}`, "sum", ms));
      ops.push(redis.hincrby(`dwell:${path}`, "count", 1));
    }
    await Promise.all(ops);
  } catch {
    // Upstash 장애 시 통계는 조용히 스킵(사이트 동작에 영향 없음)
  }
  return new NextResponse(null, { status: 204 });
}
