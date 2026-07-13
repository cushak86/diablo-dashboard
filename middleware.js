import { NextResponse } from "next/server";
import { getRedis, todayKST } from "./lib/redis";

// 정적 파일·api·_next·og 이미지 제외 (실제 페이지 방문만 집계)
export const config = {
  matcher: ["/((?!api|_next|admin|opengraph-image|.*\\.).*)"],
};

export async function middleware(req) {
  const res = NextResponse.next();
  // 개발자 제외 쿠키가 있으면 방문 집계 스킵(그 외 동작 유지)
  if (req.cookies.get("dv_exclude")) return res;
  const redis = getRedis();
  if (!redis) return res;

  const day = todayKST();
  // 일자별 httpOnly 쿠키로 하루 1회만 카운트
  if (req.cookies.get("dv")?.value === day) return res;

  try {
    await Promise.all([redis.incr(`visits:${day}`), redis.incr("visits:total")]);
    res.cookies.set("dv", day, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  } catch {
    // Upstash 장애 시 방문 표시는 조용히 스킵 (사이트는 계속 동작)
  }
  return res;
}
