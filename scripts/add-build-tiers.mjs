// 빌드에 maxroll 3축 티어를 추가한다 → builds.js 각 빌드에 tier:{overall,ladder,density}
//
// 출처: maxroll.gg D2R Season 14 티어 리스트 3종 (2026-07-18 master 직접 열람)
//   overall-tier-list · ladder-start-tier-list · density-destroying-tier-list
// ⚠ 게임 사실이 아니라 **평가**다. maxroll 등급을 그대로 옮긴 것이고, 우리가 매기지 않았다.
//   "—" = 해당 축 미등재(데이터 없음 ≠ 낮은 등급). "S*" = 무술은 모자이크 변형 기준(순수 불사조는 D).
//
// 쓰는 법:  node scripts/add-build-tiers.mjs

import fs from "node:fs";
import path from "node:path";

// build id → [overall, ladder, density]
const TIERS = {
  "ama-javazon":      ["S", "A", "S"],
  "asn-trapsin":      ["S", "A", "A"],
  "pal-hammerdin":    ["S", "A", "A"],
  "pal-smiter":       ["S", "C", "—"],
  "sor-blizzard":     ["S", "S", "A"],
  "sor-fireball":     ["S", "S", "A"],
  "ama-bowazon":      ["A", "C", "A"],
  "nec-summoner":     ["A", "B", "A"],
  "bar-frenzy":       ["B", "F", "F"],
  "dru-wind":         ["B", "B", "C"],
  "war-warlock-phase1":["B", "—", "D"],
  "nec-bone":         ["C", "C", "—"],
  "bar-whirlwind":    ["C", "D", "F"],
  "asn-martial-arts": ["S*", "—", "—"],   // 모자이크 기준. 주석은 note 로.
};

const p = path.join(process.cwd(), "lib/builds.js");
const mod = await import(p + "?t=" + Date.now());
const arr = Object.values(mod).find((v) => Array.isArray(v) && v[0]?.keyRunewords);

let code = fs.readFileSync(p, "utf8");
let added = 0, miss = [];
for (const b of arr) {
  const t = TIERS[b.id];
  if (!t) { miss.push(b.id); continue; }
  const tierObj = `"tier": { "overall": "${t[0]}", "ladder": "${t[1]}", "density": "${t[2]}" },`;
  // "sources": [ 앞에 tier 삽입 — 각 빌드 객체에서 한 번씩. id 로 위치 특정.
  const re = new RegExp(`("id":\\s*"${b.id}"[\\s\\S]*?)(\\n\\s*)("sources":)`);
  if (re.test(code) && !code.match(new RegExp(`"id":\\s*"${b.id}"[\\s\\S]*?"tier":`))) {
    code = code.replace(re, `$1$2${tierObj}$2$3`);
    added++;
  }
}
fs.writeFileSync(p, code);
console.log(`티어 추가: ${added}/${arr.length}${miss.length ? " · 누락 " + miss.join(",") : ""}`);
