// 클래식 데이터 무결성 — id는 사용자 체크 그 자체다. 한 글자만 바뀌어도 수집 기록이 증발한다.
// 실행: node test/grail-data.test.mjs
import assert from "node:assert/strict";
import { CLASSIC } from "../lib/grail-classic.js";
import { ITEMS } from "../lib/items.js";
import { RUNES } from "../lib/cube.js";
import { RW } from "../lib/runewords.js";

let failed = 0;
const t = (name, fn) => {
  try { fn(); console.log(`  ok  ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
};

// 기존 170개 id를 코드와 동일한 규칙으로 재구성(스냅샷 대조용)
const legacy = [];
ITEMS.forEach((it) => {
  if (it.cat === "unique") legacy.push(`u:${it.en}`);
  else if (it.cat === "set" && it.slug) legacy.push(`s:${it.en}`);
  else if (it.cat === "jewel") legacy.push(`j:${it.en}`);
  else if (it.cat === "charm") legacy.push(`c:${it.en}`);
});
RUNES.forEach(([n]) => legacy.push(`rune:${n}`));
RW.forEach((r) => legacy.push(`rw:${r.en}`));

t("기존 수집 대상 170개 (스냅샷 — 바뀌면 기존 사용자 진행률이 변한다)", () => {
  assert.equal(legacy.length, 170);
});

t("클래식 512개 (유니크 385 + 세트 부위 127)", () => {
  assert.equal(CLASSIC.length, 512);
  assert.equal(CLASSIC.filter((x) => x.cat === "unique").length, 385);
  assert.equal(CLASSIC.filter((x) => x.cat === "set").length, 127);
});

t("ID 중복 0 (클래식 내부)", () => {
  const ids = CLASSIC.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
});

t("ID 충돌 0 (기존 170개 × 클래식 512개) — 겹치면 두 항목이 한 체크박스를 공유한다", () => {
  const set = new Set(legacy);
  const clash = CLASSIC.filter((x) => set.has(x.id)).map((x) => x.id);
  assert.deepEqual(clash, []);
});

t("모든 클래식 항목에 한국어 표기가 있다 (게임 string table 기준)", () => {
  const missing = CLASSIC.filter((x) => !x.kr || !x.kr.trim()).map((x) => x.en);
  assert.deepEqual(missing, []);
});

t("ID 규칙 — 유니크는 base를 항상 포함(조건부 아님)", () => {
  const bad = CLASSIC.filter((x) => x.cat === "unique" && !/^u:.+ \(.+\)$/.test(x.id));
  assert.deepEqual(bad.map((x) => x.id), []);
});

t("ID 규칙 — 세트는 세트명/부위", () => {
  const bad = CLASSIC.filter((x) => x.cat === "set" && !/^s:.+\/.+$/.test(x.id));
  assert.deepEqual(bad.map((x) => x.id), []);
});

t("레인보우 패싯 8종이 속성·발동으로 구분된다", () => {
  const f = CLASSIC.filter((x) => x.en === "Rainbow Facet");
  assert.equal(f.length, 8);
  assert.equal(new Set(f.map((x) => x.id)).size, 8);
});

t("전체 분모 = 682 (170 + 512)", () => {
  assert.equal(legacy.length + CLASSIC.length, 682);
});

console.log(failed === 0 ? "\n전부 통과" : `\n실패 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
