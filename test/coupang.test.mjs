// 쿠팡 파트너스 API 모듈(lib/coupang.js) — 서명 조립과 정제 규칙을 기계가 지킨다.
//
// 왜: 서명은 "signedDate + METHOD + path + query" 를 한 글자도 틀리지 않게 이어야 한다.
//   query 를 서명엔 인코딩 안 하고 URL 엔 인코딩해서 보내면 401 인데, 화면엔 그냥 "광고가 안 뜬다"로만 보인다
//   (정적 폴백이 있어서 더 그렇다). 그래서 서명에 쓴 query 와 URL 의 query 가 같은지를 본다.

import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRequest, signedDate, normalize, pickN, keywordFor, KEYWORDS, SEARCH_PATH } from "../lib/coupang.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}

console.log("\n[쿠팡 API] 서명");

t("signed-date 가 yyMMdd'T'HHmmss'Z' (UTC)", () => {
  assert.equal(signedDate(new Date(Date.UTC(2026, 7, 27, 2, 26, 40))), "260827T022640Z");
});

t("서명 메시지 = date + GET + path + (URL 에 실제로 보내는 query)", () => {
  const date = new Date(Date.UTC(2026, 7, 27, 2, 26, 40));
  const { url, headers } = buildRequest({ accessKey: "AK", secretKey: "SK", keyword: "게이밍 마우스", limit: 3, date });
  const query = url.split("?")[1];
  assert.ok(query.startsWith("keyword=%EA%B2%8C%EC%9D%B4%EB%B0%8D%20%EB%A7%88%EC%9A%B0%EC%8A%A4&limit=3"), query);
  const expected = crypto.createHmac("sha256", "SK").update(`260827T022640ZGET${SEARCH_PATH}${query}`).digest("hex");
  assert.equal(headers.Authorization, `CEA algorithm=HmacSHA256, access-key=AK, signed-date=260827T022640Z, signature=${expected}`);
});

console.log("\n[쿠팡 API] 정제·선택");

t("링크·사진·이름 없는 상품과 금지어 상품은 버린다", () => {
  const out = normalize([
    { productId: 1, productName: "게이밍 마우스", productPrice: "12000", productImage: "https://x/1.jpg", productUrl: "https://link.coupang.com/a/1", isRocket: true },
    { productId: 2, productName: "디아블로 게임 코드", productPrice: 1, productImage: "https://x/2.jpg", productUrl: "https://link.coupang.com/a/2" },
    { productId: 3, productName: "사진 없음", productPrice: 1, productUrl: "https://link.coupang.com/a/3" },
    null,
  ]);
  assert.deepEqual(out, [{ id: "1", name: "게이밍 마우스", price: 12000, image: "https://x/1.jpg", url: "https://link.coupang.com/a/1", rocket: true }]);
});

t("pickN 은 경로마다 결정적이고 n 개를 겹치지 않게 준다", () => {
  const list = [1, 2, 3, 4, 5, 6].map((i) => ({ id: i }));
  const a = pickN(list, "/grail", 4), b = pickN(list, "/grail", 4), c = pickN(list, "/runewords", 4);
  assert.deepEqual(a, b);
  assert.equal(new Set(a.map((x) => x.id)).size, 4);
  assert.notDeepEqual(a, c);
  assert.deepEqual(pickN([], "/", 4), []);
  assert.equal(pickN(list.slice(0, 2), "/", 4).length, 2);
});

t("키워드는 6시간 단위로 돌고 금지어가 없다", () => {
  assert.ok(KEYWORDS.length >= 3);
  const FORBIDDEN = ["게임 코드", "게임코드", "아이템", "계정", "골드", "배틀넷", "디아블로"];
  assert.deepEqual(KEYWORDS.filter((k) => FORBIDDEN.some((w) => k.includes(w))), []);
  const t0 = Date.UTC(2026, 0, 1);
  assert.equal(keywordFor(t0), keywordFor(t0 + 5 * 3600 * 1000));
  assert.notEqual(keywordFor(t0), keywordFor(t0 + 6 * 3600 * 1000));
});

console.log("\n[쿠팡 API] 라우트·방침");

t("라우트는 키가 없으면 빈 배열, 실패해도 throw 하지 않고, CDN 캐시를 건다", () => {
  const src = readFileSync(join(ROOT, "app", "api", "coupang", "route.js"), "utf8");
  assert.ok(src.includes("if (!accessKey || !secretKey) return ok({ products: []"));
  assert.ok(/catch \(e\)[\s\S]*products: \[\]/.test(src));
  assert.ok(src.includes("s-maxage=3600"));
});

t("개인정보처리방침이 쿠팡 광고 서버 이미지 요청을 밝힌다(레일이 외부 이미지를 쓰므로)", () => {
  const rail = readFileSync(join(ROOT, "app", "components", "SideRail.js"), "utf8");
  const privacy = readFileSync(join(ROOT, "app", "privacy", "page.js"), "utf8").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  if (rail.includes("useCoupangProducts")) assert.ok(privacy.includes("ads-partners.coupang.com"), "방침 7항에 쿠팡 광고 서버 이미지 요청을 적어라");
});

console.log(`\n[쿠팡 API] ${pass}개 통과`);
