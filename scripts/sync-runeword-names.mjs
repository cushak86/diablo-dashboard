// 룬워드 한글명을 diablo-mdb 정본에 맞춘다.
//
// 왜 이 스크립트가 있나: 이름을 손으로 적다 틀려서 mdb가 생겼다(mdb docs/consuming.md §1).
// 그래서 여기서도 손으로 적지 않는다 — mdb의 name_ko를 기계로 옮긴다.
//
// 적용 범위 (2026-07-17 사장님 지시 "적용할 수 있는 부분에 대해서만"):
//   ✅ kr(name_ko)  — mdb가 정본. 우리 값과 36건 달랐다.
//   ⏸ en           — `Ancient's Pledge`→`Ancients' Pledge` 1건 차이. 그레일 id·즐겨찾기 키라
//                     마이그레이션이 필요해 보류(사장님 판단 대기).
//   ⏸ variants/stats — mdb가 갱신 중. 구조 결합은 안정된 뒤에.
//   ⛔ runes·sockets — 대조 결과 99/99 일치. 바꿀 것이 없다.
//
// 쓰는 법:  node scripts/sync-runeword-names.mjs <mdb-runewords.json 경로>
// 출력:     lib/runewords.js 의 kr 값을 제자리 치환하고 무엇이 바뀌었는지 보고한다.

import fs from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src || !fs.existsSync(src)) {
  console.error("사용법: node scripts/sync-runeword-names.mjs <diablo-mdb/data/runewords.json>");
  process.exit(1);
}

const mdb = JSON.parse(fs.readFileSync(src, "utf8"));
const target = path.join(process.cwd(), "lib/runewords.js");
let code = fs.readFileSync(target, "utf8");

// mdb의 en → ko. 우리 en 표기와 다른 1건은 여기서 흡수한다(값 자체는 안 바꾼다 — 위 ⏸ 참고).
const ko = new Map();
for (const r of mdb.runewords) {
  ko.set(r.name_en, r.name_ko);
  ko.set(r.name_en.replace("Ancients'", "Ancient's"), r.name_ko); // 우리 표기로도 찾히게
}

const changed = [];
// `{ en: "X", kr: "Y",` 형태를 en 기준으로 찾아 kr만 교체한다.
// 이름이 바뀌면 옛 표기를 `aka`로 남긴다 — 표시는 mdb 정본이지만 사용자는 옛 이름으로 검색한다
// (표기 문제가 아니라 검색 도달 문제). 이미 aka가 있으면 덮지 않는다(재실행 안전).
code = code.replace(/(\{\s*en:\s*"([^"]+)",\s*kr:\s*")([^"]+)(",)(\s*aka:\s*"[^"]*",)?/g,
  (m, pre, en, oldKr, post, existingAka) => {
    const want = ko.get(en);
    if (!want || want === oldKr) return m;
    changed.push({ file: "lib/runewords.js", en, from: oldKr, to: want });
    const aka = existingAka || ` aka: "${oldKr}",`;
    return pre + want + post + aka;
  });
fs.writeFileSync(target, code);

// price-baseline은 `{ key: "x", kr: "Y", en: "Z"` 순서라 별도 패턴. en이 있어 안전하게 매핑된다.
// (산문 안의 이름 — builds.js 메모 등 — 은 기계가 건드리지 않는다. 문맥 충돌이 있어 사람이 고친다:
//  "힘"은 Strength 룬워드이자 스탯이고, "맹세"는 Oath이자 악마술사 기술 "피의 맹세"의 일부다.)
const pb = path.join(process.cwd(), "lib/price-baseline.js");
let pbCode = fs.readFileSync(pb, "utf8");
pbCode = pbCode.replace(/(kr:\s*")([^"]+)(",\s*en:\s*"([^"]+)")/g, (m, pre, oldKr, post, en) => {
  const want = ko.get(en);
  if (!want || want === oldKr) return m;
  changed.push({ file: "lib/price-baseline.js", en, from: oldKr, to: want });
  return pre + want + post;
});
fs.writeFileSync(pb, pbCode);

console.log(`mdb _generated: ${mdb._generated}`);
console.log(`룬워드 ${mdb.runewords.length}개 대조 → kr 변경 ${changed.length}건\n`);
for (const c of changed) console.log(`  [${c.file.replace("lib/", "")}] ${c.en.padEnd(20)} "${c.from}" → "${c.to}"`);
