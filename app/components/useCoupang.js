"use client";

import { useEffect, useState } from "react";

/**
 * /api/coupang 상품 목록 — 페이지 수명 동안 **한 번만** 받아 레일·하단 바가 나눠 쓴다.
 *
 * 첫 렌더는 항상 빈 배열이다(서버·클라이언트 일치 → 하이드레이션 안전). 그 동안 화면은
 * 정적 배너(lib/side-ad.js)를 보여주고, 도착하면 같은 자리를 API 상품으로 바꾼다.
 * 레일·하단 바는 position:fixed 라 이 교체가 본문을 밀지 않는다(CLS 0).
 *
 * 실패는 조용하다 — 빈 배열이면 정적 배너가 그대로 남는다. 광고 때문에 콘솔이 붉어지지 않게 한다.
 */
let cache = null; // Promise<products[]>

function load() {
  if (!cache) {
    cache = fetch("/api/coupang")
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((j) => (Array.isArray(j.products) ? j.products : []))
      .catch(() => []);
  }
  return cache;
}

export function useCoupangProducts() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    let alive = true;
    load().then((p) => { if (alive) setProducts(p); });
    return () => { alive = false; };
  }, []);
  return products;
}
