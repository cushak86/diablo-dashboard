// 쿠팡 파트너스 Open API — 순수 함수만. 네트워크·env 는 app/api/coupang/route.js 가 다룬다.
//
// 왜 (2026-08-27 사장님 지시): "쿠팡 API 를 이용해 애드센스처럼 파트너스 광고가 모든 페이지에 노출되게".
//   지금까지의 광고는 lib/side-ad.js 의 손으로 고른 4개(정적)였다. 이 모듈은 API 가 준 상품을
//   같은 자리(사이드 레일·하단 바)에 돌려 보여주기 위한 것이다. API 가 없거나 실패하면
//   **정적 4개가 그대로 폴백**이라 광고가 사라지는 상태는 없다.
//
// 인증 (쿠팡 공식 샘플 hmacGenerator 와 동일):
//   Authorization: CEA algorithm=HmacSHA256, access-key=…, signed-date=yyMMdd'T'HHmmss'Z', signature=hex
//   signature = HMAC-SHA256(secret, signedDate + METHOD + path + query)   ← query 는 '?' 없이, 보낸 그대로(인코딩된)
//   ⚠️ 서명에 넣는 query 와 실제로 보내는 query 가 한 글자라도 다르면 401 이다. 그래서 둘을 한 곳에서 만든다(buildRequest).
//
// 호출량: 쿠팡 Open API 는 시간당 호출 제한이 있다(문서상 10회/시간 안팎). 라우트가 6시간 캐시 + CDN 캐시라
//   하루 수 회 수준이다. 키워드를 늘려도 **한 번에 하나만** 부르는 구조를 유지할 것.

import crypto from "node:crypto";

export const API_HOST = "https://api-gateway.coupang.com";
export const SEARCH_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";

/**
 * 검색 키워드 — 이 사이트 방문자와 실제로 관련 있는 것만(lib/affiliate.js 머리말과 같은 기준:
 * 디아블로2는 클릭이 많은 게임이라 마우스·패드·키보드·손목이 관련 있다).
 * ⛔ 게임 소프트웨어·아이템·계정은 절대 넣지 마라 — 약관 위반이고 여기는 비공식 팬 사이트다.
 */
export const KEYWORDS = ["게이밍 마우스", "게이밍 키보드", "게이밍 마우스패드", "손목 받침대", "게이밍 헤드셋", "모니터 받침대"];

/** test/affiliate.test.mjs 와 같은 목록 — API 가 준 상품명에도 같은 규칙을 건다. */
const FORBIDDEN = ["게임 코드", "게임코드", "아이템", "계정", "골드", "배틀넷", "디아블로"];

/** yyMMdd'T'HHmmss'Z' (UTC) — 쿠팡이 요구하는 서명 시각 형식. */
export function signedDate(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${String(date.getUTCFullYear()).slice(2)}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}T${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`;
}

/** 서명 + 보낼 URL 을 **같은 query 문자열**로 만든다. */
export function buildRequest({ accessKey, secretKey, keyword, limit = 10, subId = "d2r-dashboard", date = new Date() }) {
  const query = `keyword=${encodeURIComponent(keyword)}&limit=${limit}&subId=${encodeURIComponent(subId)}`;
  const sd = signedDate(date);
  const signature = crypto.createHmac("sha256", secretKey).update(`${sd}GET${SEARCH_PATH}${query}`).digest("hex");
  return {
    url: `${API_HOST}${SEARCH_PATH}?${query}`,
    headers: { Authorization: `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${sd}, signature=${signature}` },
  };
}

/**
 * 6시간마다 다음 키워드로 넘어간다 — 하루 4번, 엿새면 한 바퀴. 결정적이라(랜덤 아님) 캐시 키가 안정된다.
 */
export function keywordFor(now = Date.now()) {
  return KEYWORDS[Math.floor(now / (6 * 3600 * 1000)) % KEYWORDS.length];
}

/** API 응답 → 화면이 쓰는 최소 필드. 이름 규칙에 걸리거나 링크·사진이 없는 것은 버린다. */
export function normalize(productData) {
  return (Array.isArray(productData) ? productData : [])
    .filter((p) => p && p.productUrl && p.productImage && p.productName)
    .filter((p) => !FORBIDDEN.some((w) => String(p.productName).includes(w)))
    .map((p) => ({
      id: String(p.productId),
      name: String(p.productName),
      price: Number(p.productPrice) || 0,
      image: String(p.productImage),
      url: String(p.productUrl),
      rocket: Boolean(p.isRocket),
    }));
}

/**
 * 경로마다 다른 n 개를 고른다(lib/side-ad.js 의 pickForPath 와 같은 해시).
 * 페이지를 옮기면 다른 상품이 보이고, 같은 페이지에선 늘 같다(서버·클라이언트 일치).
 */
export function pickN(list, pathname, n) {
  if (!list.length) return [];
  let h = 0;
  const s = String(pathname || "/");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const start = h % list.length;
  const out = [];
  for (let i = 0; i < Math.min(n, list.length); i++) out.push(list[(start + i) % list.length]);
  return out;
}

export function won(n) {
  return `${Number(n).toLocaleString("ko-KR")}원`;
}
