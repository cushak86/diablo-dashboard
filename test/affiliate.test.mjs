// 제휴(쿠팡) 데이터·배치 규칙 — 사람이 지켜야 하는 것을 기계가 지킨다.
//
// 왜 (2026-08-09): 형제 사이트 강냥에서 같은 검사를 만들자마자 8건이 나왔다 —
// 상품 note 가 "가구 손상 예방, 초반부터" 같은 홍보 문구였고 본문 기준과 이어져 있지 않았다.
// 제휴는 늘리기 쉽고 규율은 사람이 잊는다.
//
// 이 사이트에서 가장 중요한 규칙은 **도구 화면을 침범하지 않는 것**이다.
// 여기는 "지금 어디 돌지"를 확인하러 오는 곳이지 쇼핑하러 오는 곳이 아니다.
// 특히 /terror-zone 은 정각 직전에 급히 보는 화면이라, CLS 를 0.387 → 0.041 로 줄인 자리를
// 광고로 다시 흔들면 그 작업이 통째로 무의미해진다.

import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AFFILIATE_PRODUCTS, activeProducts } from "../lib/affiliate.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let pass = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}

console.log("\n[제휴] 데이터 규칙");

t("note 가 전부 '쓰는 이유:' 로 시작한다", () => {
  const bad = AFFILIATE_PRODUCTS.filter((p) => !String(p.note).startsWith("쓰는 이유:")).map((p) => p.name);
  assert.deepEqual(bad, [], `근거 없는 상품은 그냥 광고다: ${bad.join(", ")}`);
});

t("같은 상품이 두 번 없다", () => {
  const names = AFFILIATE_PRODUCTS.map((p) => p.name);
  assert.equal(new Set(names).size, names.length);
});

t("4개 이하다 — 그 이상은 목록이 아니라 진열대다", () => {
  assert.ok(AFFILIATE_PRODUCTS.length <= 4, `${AFFILIATE_PRODUCTS.length}개`);
});

t("url 이 빈 항목은 렌더 대상에서 빠진다", () => {
  const empty = AFFILIATE_PRODUCTS.filter((p) => !String(p.url).trim());
  const leaked = activeProducts().filter((p) => empty.some((e) => e.name === p.name));
  assert.deepEqual(leaked, [], "링크 없이 배포해도 안전해야 한다");
});

t("게임 소프트웨어·아이템 거래를 팔지 않는다", () => {
  // 약관 위반이고 이 사이트는 비공식 팬 사이트다. 이름에 걸리는 말이 있으면 잡는다.
  const FORBIDDEN = ["게임 코드", "게임코드", "아이템", "계정", "골드", "배틀넷", "디아블로"];
  const bad = AFFILIATE_PRODUCTS.filter((p) => FORBIDDEN.some((w) => p.name.includes(w))).map((p) => p.name);
  assert.deepEqual(bad, [], `실물 주변기기만 판다: ${bad.join(", ")}`);
});

console.log("\n[제휴] 표시 규칙");

t("고지가 링크보다 위에 있고 rel 이 붙어 있다", () => {
  const src = readFileSync(join(ROOT, "app", "components", "AffiliateCards.js"), "utf8");
  const iNotice = src.indexOf("쿠팡 파트너스 활동의 일환");
  const iLink = src.indexOf("href={p.url}");
  assert.ok(iNotice >= 0, "고지 문구가 없다");
  assert.ok(iLink >= 0 && iNotice < iLink, "고지가 링크보다 아래에 있다");
  assert.match(src, /rel="[^"]*sponsored/, "rel 에 sponsored 가 없다");
  assert.match(src, /rel="[^"]*nofollow/, "rel 에 nofollow 가 없다");
});

console.log("\n[제휴] 배치 규칙 — 도구 화면을 침범하지 않는다");

t("허용된 화면에만 놓인다", () => {
  // 놓아도 되는 곳: 홈(app/page.js) · /about. 그 외 라우트에 있으면 실패.
  const ALLOWED = new Set(["page.js", join("about", "page.js")]);
  const found = [];
  const walk = (dir, rel = "") => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "components" || e.name === "api") continue;
      const full = join(dir, e.name);
      const r = rel ? join(rel, e.name) : e.name;
      if (e.isDirectory()) walk(full, r);
      else if (e.name.endsWith(".js") && readFileSync(full, "utf8").includes("<AffiliateCards")) found.push(r);
    }
  };
  walk(join(ROOT, "app"));
  const illegal = found.filter((f) => !ALLOWED.has(f));
  assert.deepEqual(
    illegal, [],
    `도구 화면에 제휴가 들어갔다: ${illegal.join(", ")}\n` +
      `       놓아도 되는 곳은 홈과 /about 뿐이다(lib/affiliate.js 머리말).`
  );
  assert.ok(found.length > 0, "어디에도 배치되지 않았다 — 홈이나 /about 에 넣어라");
});

t("/terror-zone 에는 없다 — 정각 직전에 급히 보는 화면이다", () => {
  const p = join(ROOT, "app", "terror-zone", "page.js");
  if (!existsSync(p)) return;
  assert.ok(!readFileSync(p, "utf8").includes("AffiliateCards"),
    "CLS 를 0.387 → 0.041 로 줄인 자리를 광고로 다시 흔들지 마라");
});

console.log(`\n[제휴] ${pass}개 통과`);
