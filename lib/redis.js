import { Redis } from "@upstash/redis";

let client = null;

// env 미설정 시 null 반환 → 호출부에서 graceful no-op
export function getRedis() {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}

// KST 기준 오늘 (YYYY-MM-DD) — Vercel(UTC) 서버에서도 한국 날짜로 집계
export function todayKST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    new Date()
  );
}
