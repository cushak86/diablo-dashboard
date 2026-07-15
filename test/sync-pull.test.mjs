// pullIfNewer 결정 로직 — 자동으로 남의 최신본을 당기되, 자기 최신본을 되돌리면 안 된다.
// 순수 판정 함수를 추출해 테스트한다(fetch·localStorage 없이).
import assert from "node:assert/strict";

// lib/sync.js의 pullIfNewer 내부 판정과 동일한 규칙(회귀 방지용 명세).
function shouldApply(localAt, remoteAt) {
  if (!remoteAt) return false;
  if (remoteAt === localAt) return false;          // 자기가 방금 push한 것
  if (localAt && remoteAt < localAt) return false; // 로컬이 더 최신(아직 push 전)
  return true;                                     // 원격이 더 최신 → 당긴다
}

let failed = 0;
const t = (n, f) => { try { f(); console.log(`  ok  ${n}`); } catch (e) { failed++; console.log(`  FAIL ${n}\n       ${e.message}`); } };

const A = "2026-07-15T10:00:00.000Z";
const B = "2026-07-15T11:00:00.000Z";

t("원격이 더 최신 → 당긴다", () => assert.equal(shouldApply(A, B), true));
t("로컬이 더 최신 → 안 당긴다(자기 미push분 보호)", () => assert.equal(shouldApply(B, A), false));
t("같은 시각 → 안 당긴다(자기 push분)", () => assert.equal(shouldApply(A, A), false));
t("로컬 없음 + 원격 있음(새 기기) → 당긴다", () => assert.equal(shouldApply("", B), true));
t("원격 없음 → 안 당긴다", () => assert.equal(shouldApply(A, ""), false));
t("둘 다 없음 → 안 당긴다", () => assert.equal(shouldApply("", ""), false));

console.log(failed === 0 ? "\n전부 통과" : `\n실패 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
