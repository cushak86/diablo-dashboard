// 동기화 코드 — 코드가 곧 열쇠다. 엔트로피·형식·정규화를 고정한다.
import assert from "node:assert/strict";
import { ALPHABET, CODE_RE, newCode, normalizeCode, isValidCode } from "../lib/sync-code.js";

let failed = 0;
const t = (n, f) => { try { f(); console.log(`  ok  ${n}`); } catch (e) { failed++; console.log(`  FAIL ${n}\n       ${e.message}`); } };

t("형식 — 8-8-8", () => assert.match(newCode(), CODE_RE));
t("혼동 문자 없음 (0·1·l·o·i 제외)", () => {
  for (const ch of "01loi") assert.equal(ALPHABET.includes(ch), false, ch);
});
t("엔트로피 — 1000개 생성해 중복 0", () => {
  const s = new Set(Array.from({ length: 1000 }, newCode));
  assert.equal(s.size, 1000);
});
t("정규화 — 공백·대문자 허용", () => {
  const c = newCode();
  assert.equal(normalizeCode(`  ${c.toUpperCase()} `), c);
  assert.equal(isValidCode(` ${c.toUpperCase()} `), true);
});
t("거부 — 짧은 코드·잘못된 문자·비문자열", () => {
  for (const bad of ["", "abc", "12345678-12345678-1234567", "abcdefgh-abcdefgh-abcdefg0", null, 42, {}])
    assert.equal(isValidCode(bad), false, String(bad));
});
console.log(failed === 0 ? "\n전부 통과" : `\n실패 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
