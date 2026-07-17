// 클래식 데이터 무결성 — id는 사용자 체크 그 자체다. 한 글자만 바뀌어도 수집 기록이 증발한다.
// 실행: node test/grail-data.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import { CLASSIC } from "../lib/grail-classic.js";
import { ITEMS } from "../lib/items.js";
import { RUNES } from "../lib/cube.js";
import { RW } from "../lib/runewords.js";

let failed = 0;
const t = (name, fn) => {
  try { fn(); console.log(`  ok  ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
};

// 기존 170개 id를 코드와 동일한 규칙으로 재구성 — lib/grail-collect.js:build()와 같은 규칙이어야 한다.
// ⚠ 이 재구성 자체는 아무것도 증명하지 않는다(같은 규칙이므로 항상 자기 자신과 일치한다).
//   안전망은 아래 "682 id 스냅샷"이다 — 재구성 결과를 **파일에 박제된 문자열**과 대조한다.
const legacy = [];
ITEMS.forEach((it) => {
  if (it.cat === "unique") legacy.push(`u:${it.en}`);
  else if (it.cat === "set" && it.slug) legacy.push(`s:${it.en}`);
  else if (it.cat === "jewel") legacy.push(`j:${it.en}`);
  else if (it.cat === "charm") legacy.push(`c:${it.en}`);
});
RUNES.forEach(([n]) => legacy.push(`rune:${n}`));
RW.forEach((r) => legacy.push(`rw:${r.en}`));

// 🔒 682 id 스냅샷 — 이 테스트가 이 파일의 존재 이유다.
// 사용자 체크박스의 키 = id 문자열. 개수·정규식만 보는 검사는 날조 id를 통과시킨다(2026-07-16 실증).
const SNAP = JSON.parse(fs.readFileSync(new URL("./grail-ids.snapshot.json", import.meta.url), "utf8"));

t(`682 id 스냅샷 — 문자열 전수 대조 (바뀌면 그 id를 체크한 사용자의 진행률이 증발한다)`, () => {
  const actual = [...legacy, ...CLASSIC.map((x) => x.id)].sort();
  const frozen = SNAP.ids;
  const fset = new Set(frozen);
  const aset = new Set(actual);
  const added = actual.filter((id) => !fset.has(id));
  const removed = frozen.filter((id) => !aset.has(id));
  const msg = [];
  if (removed.length) msg.push(`사라진 id ${removed.length}건(사용자 체크 증발): ${JSON.stringify(removed.slice(0, 5))}`);
  if (added.length) msg.push(`새 id ${added.length}건: ${JSON.stringify(added.slice(0, 5))}`);
  assert.ok(
    !msg.length,
    `${msg.join(" / ")}\n       → 의도한 변경이면 test/grail-ids.snapshot.json을 갱신하되, 먼저 답하라: 기존 사용자의 체크는 어떻게 되는가?`,
  );
  assert.equal(actual.length, frozen.length, `id 개수 ${actual.length} ≠ 스냅샷 ${frozen.length}(중복 발생 의심)`);
});

t("스냅샷 파일 자체의 무결성 (count와 실제 항목 수가 일치 · 중복 0)", () => {
  assert.equal(SNAP.ids.length, SNAP.count);
  assert.equal(new Set(SNAP.ids).size, SNAP.ids.length);
  assert.equal(SNAP.count, 682);
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
