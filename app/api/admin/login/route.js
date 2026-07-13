import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { sessionToken } from "../../../../lib/auth";
import { getRedis } from "../../../../lib/redis";

// 무차별 대입 방어: IP당 실패 횟수 상한(윈도우 내). 성공 시 카운터 리셋.
// Redis 미설정·장애 시엔 조용히 통과(가용성 우선 — 비밀번호가 여전히 최종 방어).
const MAX_FAILS = 10; // 윈도우 내 허용 실패 횟수
const WINDOW_SEC = 15 * 60; // 15분

function clientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// 길이 유출 없는 상수시간 비교
function pwEqual(input, secret) {
  const a = Buffer.from(String(input || ""));
  const b = Buffer.from(String(secret));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    return NextResponse.json({ error: "서버에 ADMIN_PASSWORD가 설정되지 않았습니다." }, { status: 500 });
  }

  const redis = getRedis();
  const ip = clientIp(req);
  const key = `login:fail:${ip}`;

  // 현재 실패 횟수 확인 — 상한 초과면 즉시 429(비밀번호 검사 전에 차단)
  if (redis) {
    try {
      const fails = Number(await redis.get(key)) || 0;
      if (fails >= MAX_FAILS) {
        // 이전 expire 유실로 TTL이 없으면 윈도우를 보정 — 영구 잠금 방지
        const ttl = await redis.ttl(key);
        if (ttl < 0) await redis.expire(key, WINDOW_SEC);
        return NextResponse.json(
          { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
          { status: 429 }
        );
      }
    } catch {
      // 카운터 조회 실패 → 통과(가용성 우선)
    }
  }

  const body = await req.json().catch(() => ({}));
  if (!pwEqual(body.password, pw)) {
    // 실패 카운트 증가(윈도우는 첫 실패에만 설정)
    if (redis) {
      try {
        const n = await redis.incr(key);
        // 첫 실패면 윈도우 설정. 이후엔 expire 유실 시(ttl<0) 보정 — TTL 없는 카운터 잔존 방지
        if (n === 1) {
          await redis.expire(key, WINDOW_SEC);
        } else if ((await redis.ttl(key)) < 0) {
          await redis.expire(key, WINDOW_SEC);
        }
      } catch {
        // 무시
      }
    }
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  // 성공 → 실패 카운터 정리
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      // 무시
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", sessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8, // 8시간
  });
  // 개발자 트래픽 제외용 opt-out 쿠키(장기·httpOnly) — 방문/페이지 통계에서 관리자 기기 제외
  res.cookies.set("dv_exclude", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1년
  });
  return res;
}
