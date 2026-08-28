import { NextResponse } from "next/server";
import { getRedis } from "../../../lib/redis";
import { buildRequest, keywordsFor, normalize } from "../../../lib/coupang";

/**
 * GET /api/coupang → { products: [...], keyword, cached }
 *
 * 쿠팡 파트너스 상품을 **서버에서만** 부른다 — 키가 브라우저로 나가지 않는다.
 * 실패·미설정은 전부 `products: []` 로 답한다(200). 클라이언트는 그러면 정적 배너(lib/side-ad.js)를 그대로 쓴다.
 * 광고 때문에 페이지가 깨지는 일은 없어야 한다 — 이 라우트는 절대 throw 하지 않는다.
 *
 * 캐시 3겹(호출 제한 때문 — lib/coupang.js 머리말):
 *   1) CDN: s-maxage 1시간 + stale-while-revalidate 하루 → 방문자가 많아도 원본 호출은 시간당 리전당 1회 안팎
 *   2) Redis(있으면): 키워드당 6시간
 *   3) 인스턴스 메모리: Redis 가 없을 때의 안전망
 */
export const dynamic = "force-dynamic";

const TTL = 6 * 3600; // 초
const mem = new Map(); // keyword → { at, products }

const ok = (body) =>
  NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });

async function forKeyword(keyword, accessKey, secretKey) {
  const key = `coupang:v1:${keyword}`;
  const m = mem.get(keyword);
  if (m && Date.now() - m.at < TTL * 1000) return { products: m.products, cached: "mem" };

  const redis = getRedis();
  if (redis) {
    const hit = await redis.get(key).catch(() => null);
    if (Array.isArray(hit) && hit.length) {
      mem.set(keyword, { at: Date.now(), products: hit });
      return { products: hit, cached: "redis" };
    }
  }

  const { url, headers } = buildRequest({ accessKey, secretKey, keyword });
  const res = await fetch(url, { headers, cache: "no-store" });
  const json = await res.json();
  if (!res.ok || String(json.rCode) !== "0") throw new Error(`coupang ${res.status} rCode=${json.rCode} ${json.rMessage || ""}`);

  const products = normalize(json.data?.productData);
  if (products.length) {
    mem.set(keyword, { at: Date.now(), products });
    if (redis) await redis.set(key, products, { ex: TTL }).catch(() => {});
  }
  return { products, cached: false };
}

export async function GET() {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  if (!accessKey || !secretKey) return ok({ products: [], keywords: [], cached: false });

  const keywords = keywordsFor();
  const seen = new Set();
  const products = [];
  const cached = [];
  // 키워드 하나가 실패해도 다른 하나는 낸다. 둘 다 실패하면 빈 배열 — 클라이언트는 정적 배너로 폴백한다.
  for (const kw of keywords) {
    try {
      const r = await forKeyword(kw, accessKey, secretKey);
      cached.push(r.cached);
      for (const p of r.products) if (!seen.has(p.id)) { seen.add(p.id); products.push(p); }
    } catch (e) {
      console.error("[coupang]", kw, e?.message || e);
      cached.push("error");
    }
  }
  if (!products.length) return NextResponse.json({ products: [], keywords, cached }, { headers: { "Cache-Control": "public, s-maxage=300" } });
  return ok({ products, keywords, cached });
}
