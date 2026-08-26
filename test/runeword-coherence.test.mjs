// 룬워드 데이터 정합 — 같은 사실이 두 곳에 적혀 있으면 반드시 갈라진다.
//
// 2026-08-09 감사에서 나온 것:
//   (1) 한 카드 안에서 요약(stat)과 전체 옵션(stats)이 서로 다른 값을 말했다 — 9종.
//       "공격 속도 +40%" vs stats "+15%", "+9 전 스킬" vs "+3", 오라 이름이 통째로 다른 것들.
//       둘 다 같은 카드에 렌더되므로 독자는 한 화면에서 모순을 본다.
//   (2) "3.x 비공식 · 검증 필요" 표시가 /runewords 에만 있고 /new-items 에는 없었다 —
//       같은 룬 조합을 한쪽은 미검증, 한쪽은 사실로 내놓았다.
//   (3) 경계(Vigilance) 베이스가 두 파일에서 달랐다(방패·마법서·수축 머리 vs 방패만).
//
// 정본은 lib/runewords.js 다. lib/items.js 의 룬워드 줄은 거기서 파생시킨다.

import assert from "node:assert/strict";
import { RW } from "../lib/runewords.js";
import { ITEMS } from "../lib/items.js";

let pass = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}

console.log("\n[룬워드] 데이터 정합");

// 요약에서 뽑을 수 있는 "검증 가능한 조각" — 숫자가 붙은 표현과 오라 이름.
// 문장 전체를 대조하면 표현 차이로 오탐이 나므로, 숫자·고유명사만 본다.
const NUMS = /[+-]?\d+(?:~\d+)?%?/g;

t("요약(stat)의 숫자가 전부 상세(stats)에도 있다", () => {
  const bad = [];
  for (const r of RW) {
    if (!r.stat || !Array.isArray(r.stats)) continue;
    const detail = r.stats.join(" ");
    for (const num of r.stat.match(NUMS) ?? []) {
      // 상세 어딘가에 같은 숫자 표현이 있으면 통과. 없으면 요약이 근거 없는 값을 말하는 것이다.
      if (!detail.includes(num)) bad.push(`${r.kr}(${r.en}): 요약의 "${num}" 이 stats 에 없다`);
    }
  }
  assert.deepEqual(bad, [], `\n       ${bad.join("\n       ")}\n       고치는 법: stats 가 정본이다. 요약을 stats 에 있는 값으로 맞춰라.`);
});

t("오라를 요약에 적었으면 상세에도 같은 오라가 있다", () => {
  const bad = [];
  for (const r of RW) {
    if (!r.stat || !Array.isArray(r.stats)) continue;
    const detail = r.stats.join(" ");
    // "○○ 오라" 형태만 본다. 오라는 룬워드를 고르는 핵심 근거라 틀리면 판단이 바뀐다.
    for (const m of r.stat.matchAll(/([가-힣]+(?:\([A-Za-z]+\))?)\s*오라/g)) {
      const name = m[1].replace(/\([A-Za-z]+\)/, "");
      if (!detail.includes(name)) bad.push(`${r.kr}(${r.en}): 요약의 "${name} 오라" 가 stats 에 없다`);
    }
  }
  assert.deepEqual(bad, [], `\n       ${bad.join("\n       ")}`);
});

t("items.js 의 룬워드가 runewords.js 와 같은 룬·소켓·베이스를 말한다", () => {
  const byEn = new Map(RW.map((r) => [r.en, r]));
  const bad = [];
  for (const it of ITEMS) {
    if (it.cat !== "rw") continue;
    const r = byEn.get(it.en);
    if (!r) { bad.push(`${it.kr}(${it.en}): runewords.js 에 없다`); continue; }
    // meta 문자열에 룬 이름·소켓 수·베이스가 다 들어 있어야 한다.
    for (const rune of r.runes) {
      if (!it.meta.includes(rune)) bad.push(`${it.kr}: meta 에 룬 "${rune}" 이 없다`);
    }
    if (!it.meta.includes(`${r.sockets}소켓`)) bad.push(`${it.kr}: meta 에 "${r.sockets}소켓" 이 없다`);
    // 베이스는 "방패 · 마법서 · 수축 머리" 처럼 여러 개일 수 있다 — 첫 항목만 있어도 통과시키지 않는다.
    for (const base of r.base.split("·").map((b) => b.trim())) {
      if (base && !it.meta.includes(base)) bad.push(`${it.kr}: meta 에 베이스 "${base}" 가 없다 (runewords.js: "${r.base}")`);
    }
  }
  assert.deepEqual(bad, [], `\n       ${bad.join("\n       ")}\n       고치는 법: lib/items.js 의 meta 를 손으로 적지 말고 runewords.js 에서 파생시켜라.`);
});

// 2026-08-27: 3.x 7종의 룬 조합·옵션이 diablo-mdb(CASC 대조) 정본으로 바뀌었다. "검증 필요" 마커는 더 이상
// 없어야 하고, 두 파일의 isNew 집합은 같아야 한다(배지가 한쪽에만 뜨던 2026-08-09 회귀 방지).
t("'검증 필요' 마커가 남아 있지 않다 — 옵션은 mdb 정본이다", () => {
  const stale = RW.filter((r) => (r.stats ?? []).some((x) => /검증 필요/.test(x))).map((r) => r.en);
  assert.deepEqual(stale, [], "값이 의심되면 손으로 '검증 필요' 를 되살리지 말고 diablo-mdb 에 이슈로 올려라.");
});

t("3.x 신규(isNew) 집합이 두 파일에서 일치한다", () => {
  const isNew = new Set(RW.filter((r) => r.isNew).map((r) => r.en));
  const bad = [];
  for (const it of ITEMS) {
    if (it.cat !== "rw") continue;
    if (isNew.has(it.en) !== Boolean(it.isNew)) bad.push(`${it.kr}(${it.en}): runewords.js isNew=${isNew.has(it.en)} · items.js isNew=${Boolean(it.isNew)}`);
  }
  assert.deepEqual(bad, [], `\n       ${bad.join("\n       ")}\n       고치는 법: items.js 는 isNew 를 runewords.js 에서 파생시킨다 — 손으로 적지 마라.`);
});

console.log(`\n[룬워드] ${pass}개 통과`);
