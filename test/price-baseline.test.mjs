// 기준선 나이 계산 — 화면 경고("N개월 전 수집")의 근거. 날짜를 주입해 검증한다.
// 실행: node test/price-baseline.test.mjs
import assert from "node:assert/strict";
import { AS_OF, STALE_MONTHS, monthsSinceAsOf, BASELINE } from "../lib/price-baseline.js";

let failed = 0;
const t = (name, fn) => {
  try { fn(); console.log(`  ok  ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
};

t("AS_OF 형식 (YYYY-MM)", () => assert.match(AS_OF, /^\d{4}-\d{2}$/));
t("수집 당월 → 0개월", () => assert.equal(monthsSinceAsOf(new Date("2026-07-20")), 0));
t("다음 달 → 1개월", () => assert.equal(monthsSinceAsOf(new Date("2026-08-01")), 1));
t("해를 넘겨도 정확 (2027-01 → 6개월)", () => assert.equal(monthsSinceAsOf(new Date("2027-01-15")), 6));
t("경고 임계 — 6개월째부터 오래됨", () => {
  assert.equal(monthsSinceAsOf(new Date("2026-12-31")) >= STALE_MONTHS, false); // 5개월
  assert.equal(monthsSinceAsOf(new Date("2027-01-01")) >= STALE_MONTHS, true);  // 6개월
});
t("BASELINE이 비어있지 않다", () => assert.ok(BASELINE.length > 0));

console.log(failed === 0 ? "\n전부 통과" : `\n실패 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
