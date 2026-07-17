// 빌드 가이드의 단일 스킬명을 diablo-mdb 정본으로 맞춘다.
//
// 왜: builds.js 의 스킬명은 손입력이라 D2R 공식과 어긋난 게 많다(광란→광분 등).
//   mdb `data/skills.json`(2026-07-18, 240개)이 (class, name_ko, skill_en) 정본을 준다.
//   조인은 **클래스 + 영문 skill_en** — 한글만으론 동명이의("무기 숙련"류)를 못 가른다(mdb 회신).
//
// 범위:
//   ✅ 단일 스킬 오역 14건 — mdb 정본으로 교체(class+skill_en 으로 확정).
//   ⚠ 이 스크립트는 `"name": "…"` 필드만 고친다. **빌드 타이틀·묶음·note·mercenary 산문 속 스킬명 참조는
//     기계가 안 잡는다** — 재실행 후 `grep` 으로 옛 표기를 전수 확인하고 손으로 맞춰라(2026-07-18: 5곳 있었다).
//   ⛔ 묶음 표기("쾌속·소멸·…") — 우리 UI 방식이지 오역 아님. 안 건드린다.
//   ⛔ "무기 숙련"(바바리안) — mdb는 무기별(도끼/칼 숙련)로 갈리는데 우리 note가 "쓰는 무기 계열 맞춤"이라
//      의도적으로 뭉뚱그린 것. 단일 스킬로 못 정정 → 유지.
//
// ⚠ 신뢰도: mdb 스킬 한글은 **단일 소스**(agenMode 하나, 교차검증 안 됨. skills.json _verified).
//   악마술사 30개는 사장님 인게임 확정(2026-07-16)으로 독립 확인됨. 나머지는 단일 소스임을 알고 채택.
//
// 쓰는 법:  node scripts/sync-build-skill-names.mjs <diablo-mdb clone>/data/skills.json

import fs from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src || !fs.existsSync(src)) {
  console.error("사용법: node scripts/sync-build-skill-names.mjs <mdb>/data/skills.json");
  process.exit(1);
}
const skills = JSON.parse(fs.readFileSync(src, "utf8")).skills;
const byEn = {};
for (const s of skills) byEn[s.skill_en.toLowerCase()] = s;

// 우리 (틀린 한글) → mdb skill_en. class+skill_en 으로 정본을 끌어온다.
// 이 표 자체가 검증 대상이라, 각 행을 mdb 에서 조회해 name_ko 를 **직접** 쓴다(손으로 안 적는다).
const FIX = [
  ["Lightning Fury"], ["Multiple Shot"], ["Critical Strike"], ["Blade Fury"],
  ["Frenzy"], ["Double Swing"], ["Oak Sage"], ["Bone Spirit"], ["Bone Wall"],
  ["Vigor"], ["Blessed Aim"], ["Ice Bolt"], ["Meteor"], ["Fire Bolt"],
];
const OLD = {
  "Lightning Fury": "번개의 분노", "Multiple Shot": "다중 사격", "Critical Strike": "치명적 일격",
  "Blade Fury": "화염 폭발", "Frenzy": "광란", "Double Swing": "이중 휘두르기",
  "Oak Sage": "참나무 정령", "Bone Spirit": "뼈 정령", "Bone Wall": "뼈 방벽",
  "Vigor": "활력", "Blessed Aim": "축복의 조준", "Ice Bolt": "얼음 화살",
  "Meteor": "유성", "Fire Bolt": "화염 화살",
};

const target = path.join(process.cwd(), "lib/builds.js");
let code = fs.readFileSync(target, "utf8");
const changed = [];
for (const [en] of FIX) {
  const s = byEn[en.toLowerCase()];
  const oldName = OLD[en];
  if (!s || !oldName) { console.warn(`  ⚠️ 스킵: ${en}`); continue; }
  // "name": "옛이름"  →  "name": "정본"  (해당 스킬 객체 안에서만)
  const re = new RegExp(`("name":\\s*")${oldName}(")`, "g");
  const before = code;
  code = code.replace(re, `$1${s.name_ko}$2`);
  if (code !== before) changed.push({ old: oldName, to: s.name_ko, en });
}
fs.writeFileSync(target, code);
console.log(`mdb skills: ${skills.length}개 · 스킬명 정정 ${changed.length}건\n`);
for (const c of changed) console.log(`  "${c.old}" → "${c.to}" (${c.en})`);
