// 공포의 영역 이름 매칭 — 실패하면 화면에 영문이 그대로 뜬다.
//
// 왜 (2026-08-09 사장님 제보): /terror-zone 이 "Tamoe Highland, Outer Cloister, and The Pit" 를
// 한글로 못 바꾸고 영문 그대로 보여줬다. 원인이 둘이었다:
//   (1) 그 존이 lib/zones.js 에 **아예 없었다**.
//   (2) matchZone 의 임계(0.5)가 **질의 토큰 대비 비율**이라 다중 지역 이름에서 희석된다 —
//       토큰 6개 중 한 지역만 아는 후보는 2/6=0.33 이라 임계를 못 넘는다.
//
// 이 사이트 최다 유입 페이지이고, 한국어 사용자가 영문 지역명을 보면 쓸 수 없다.
// 새 패치가 나오면 API 가 모르는 이름을 보내올 것이므로, 매칭 규칙 자체를 고정한다.

import assert from "node:assert/strict";
import { matchZone, TERROR_ZONES } from "../lib/zones.js";

let pass = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}

console.log("\n[공포의 영역] 이름 매칭");

// d2runewizard 가 실제로 내보내는 형식들. 실측으로 확인한 것만 넣는다.
const REAL = [
  "Tamoe Highland, Outer Cloister, and The Pit",
  "Glacial Trail and Drifter Cavern",
  "Stony Field",
  "The Pit",
];

t("API 가 실제로 보내는 이름이 전부 매칭된다", () => {
  const miss = REAL.filter((n) => !matchZone(n));
  assert.deepEqual(miss, [], `매칭 실패 → 화면에 영문이 뜬다: ${miss.join(" / ")}`);
});

t("매칭 결과가 한글 이름을 준다", () => {
  const bad = [];
  for (const n of REAL) {
    const kr = matchZone(n)?.zone.kr ?? "";
    // 한글이 한 글자도 없으면 번역이 안 된 것이다.
    if (!/[가-힣]/.test(kr)) bad.push(`${n} → "${kr}"`);
  }
  assert.deepEqual(bad, []);
});

t("쉼표·and·& 로 이어진 이름을 조각으로도 찾는다", () => {
  // 통째로는 희석돼 실패해도 조각 하나가 확실하면 그 존을 쓴다.
  assert.ok(matchZone("Tamoe Highland"), "단일 지역명도 찾아야 한다");
  assert.ok(matchZone("Outer Cloister"), "단일 지역명도 찾아야 한다");
});

t("모르는 이름은 정직하게 실패한다 — 아무거나 갖다 붙이지 않는다", () => {
  assert.equal(matchZone("Completely Unknown Place XYZ"), null);
  assert.equal(matchZone(""), null);
  assert.equal(matchZone(null), null);
});

t("모든 존이 한글 이름과 영문 이름을 갖는다", () => {
  const bad = TERROR_ZONES.filter((z) => !/[가-힣]/.test(z.kr) || !z.en).map((z) => z.en || "(이름없음)");
  assert.deepEqual(bad, [], `한글 이름이 없는 존: ${bad.join(", ")}`);
});

t("모든 포함 지역이 한글 이름을 갖는다", () => {
  const bad = [];
  for (const z of TERROR_ZONES) {
    for (const [kr, en] of z.areas ?? []) {
      if (!/[가-힣]/.test(kr)) bad.push(`${z.en} → ${en} ("${kr}")`);
    }
  }
  assert.deepEqual(bad, [], `포함 지역이 영문으로 뜬다: ${bad.join(" / ")}`);
});

console.log(`\n[공포의 영역] ${pass}개 통과`);
