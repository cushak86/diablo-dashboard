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
import { buildRequest, signedDate, normalize, pickN, keywordsFor, KEYWORDS, SEARCH_PATH } from "../lib/coupang.js";

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

t("키워드는 3시간 슬롯마다 2개(서로 다름)가 돌고 금지어가 없다", () => {
  assert.ok(KEYWORDS.length >= 3);
  const FORBIDDEN = ["게임 코드", "게임코드", "아이템", "계정", "골드", "배틀넷", "디아블로"];
  assert.deepEqual(KEYWORDS.filter((k) => FORBIDDEN.some((w) => k.includes(w))), []);
  const t0 = Date.UTC(2026, 0, 1);
  const a = keywordsFor(t0);
  assert.equal(a.length, 2);
  assert.notEqual(a[0], a[1]);
  assert.deepEqual(a, keywordsFor(t0 + 2 * 3600 * 1000));
  assert.notDeepEqual(a, keywordsFor(t0 + 3 * 3600 * 1000));
  // 한 키워드가 이웃 슬롯에 걸친다 → 캐시(6h)가 살아 있는 동안 재사용된다(원본 호출 억제)
  assert.ok(keywordsFor(t0 + 3 * 3600 * 1000).includes(a[1]));
});

console.log("\n[쿠팡 API] 노출 자리 (2026-08-27 공격적 노출)");

t("스트립이 모든 페이지(layout)에 있고 카드 높이가 고정돼 있다(CLS 0)", () => {
  const layout = readFileSync(join(ROOT, "app", "layout.js"), "utf8");
  const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
  assert.ok(/<ProductStrip\s*\/>/.test(layout), "layout 에 <ProductStrip /> 이 없다");
  assert.ok(/<SideRail side="left"\s*\/>/.test(layout), "layout 에 왼쪽 레일이 없다");
  assert.ok(/\.pstrip-item\{[^}]*height:\s*\d+px/.test(css), ".pstrip-item 높이가 고정돼 있지 않다 — API 상품이 도착할 때 본문이 흔들린다");
  assert.ok(/\.side-rail\.left\{display:none\}/.test(css), "왼쪽 레일 기본값이 none 이 아니다");
  assert.ok(/@media \(min-width:1680px\)\{\s*\.side-rail\.left\{display:block/.test(css), "왼쪽 레일은 1680px 이상에서만 켜야 한다");
});

t("스트립·레일·하단 바 어디에도 스크립트·프레임이 없다", () => {
  for (const f of ["ProductStrip.js", "SideRail.js", "BottomAd.js", "useCoupang.js"]) {
    const code = readFileSync(join(ROOT, "app", "components", f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    assert.ok(!/<script|<iframe|dangerouslySetInnerHTML/.test(code), `${f} 에 스크립트·프레임이 있다`);
  }
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
