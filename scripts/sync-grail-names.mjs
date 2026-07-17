// 그레일(유니크·세트) 표시명을 diablo-mdb 정본에 맞춘다.
//
// ── 핵심: 게임엔 이름이 둘이다 ──────────────────────────────────────────────
// D2 덤프의 `uniqueitems.txt` 의 `index` 는 **내부 식별자**이고, 화면에 뜨는 이름은
// `item-names` 스트링 테이블에 따로 있다. `index` 가 그 스트링의 키다.
//
//     index(내부)        →  표시명(D2R 공식)
//     "Umes Lament"      →  "Ume's Lament"
//     "Mindrend"         →  "Skull Splitter"
//     "Cutthroat1"       →  "Bartuc's Cut-Throat"
//     베이스 "Saber"      →  "Sabre"
//
// 우리 `en` 은 **그 index** 다. 즉 틀린 이름이 아니라 **안정 키**다(그래서 id 로 쓰는 게 옳았다).
// mdb 는 `source_key` 로 그 index 를 그대로 내보낸다 → 추측 없이 1:1 로 잇는다.
// (2026-07-17 mdb 회신. 우리 512종 전부 붙는 것을 실측 확인 — 미매칭 0.)
//
// ── 이 스크립트가 바꾸는 것 / 안 바꾸는 것 ─────────────────────────────────
//   ✅ kr      — mdb `name_ko`. D2R 공식 한글.
//   ✅ enDisp  — mdb `name_en`. **화면에 보여줄 영문.** 없으면 `en`(내부 이름)이 노출된다.
//   ✅ aka     — 옛 한글 표기(검색 도달용). 사용자는 옛 이름으로 검색한다.
//   ⛔ id·en·base — **한 글자도 안 건드린다.** id 가 곧 사용자의 수집 체크다.
//                   `en` 은 안정 키이므로 바꿀 이유가 애초에 없다 → **마이그레이션 불필요.**
//
// 쓰는 법:  node scripts/sync-grail-names.mjs <diablo-mdb 클론 경로>

import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
if (!root || !fs.existsSync(path.join(root, "data/uniques.json"))) {
  console.error("사용법: node scripts/sync-grail-names.mjs <diablo-mdb 클론 경로>");
  process.exit(1);
}

const U = JSON.parse(fs.readFileSync(path.join(root, "data/uniques.json"), "utf8"));
const S = JSON.parse(fs.readFileSync(path.join(root, "data/sets.json"), "utf8"));

// source_key(= 우리 en) → { ko, en }
const bySK = new Map();
for (const u of U.uniques) bySK.set(`unique|${u.source_key}`, { ko: u.name_ko, en: u.name_en });
for (const s of S.sets || []) for (const it of s.items || []) bySK.set(`set|${it.source_key}`, { ko: it.name_ko, en: it.name_en });

const target = path.join(process.cwd(), "lib/grail-classic.js");
let code = fs.readFileSync(target, "utf8");

const krChanged = [], enAdded = [];
let miss = 0;
// `kr: "…", [aka: "…",] [enDisp: "…",] en: "<source_key>", cat: "…"`
// en·cat 은 캡처해 조회에만 쓰고 **그대로 되돌려 쓴다** — 구조적으로 못 바꾼다.
code = code.replace(
  /(kr:\s*")([^"]+)(",)(\s*aka:\s*"[^"]*",)?(\s*enDisp:\s*"[^"]*",)?(\s*en:\s*"([^"]+)",\s*cat:\s*"([^"]+)")/g,
  (m, pre, oldKr, post, oldAka, _oldDisp, tail, en, cat) => {
    const hit = bySK.get(`${cat}|${en}`);
    if (!hit) { miss++; return m; }

    let kr = oldKr, aka = oldAka || "";
    if (hit.ko !== oldKr) {
      krChanged.push({ en, from: oldKr, to: hit.ko });
      kr = hit.ko;
      if (!aka) aka = ` aka: "${oldKr}",`;   // 옛 표기 보존(이미 있으면 유지)
    }
    // 표시 영문: 내부 이름과 다를 때만 붙인다(같으면 군더더기).
    let disp = "";
    if (hit.en !== en) { disp = ` enDisp: "${hit.en}",`; enAdded.push({ en, to: hit.en }); }

    return pre + kr + post + aka + disp + tail;
  }
);

fs.writeFileSync(target, code);
console.log(`mdb: uniques=${U._generated} sets=${S._generated}`);
console.log(`\nkr 변경 ${krChanged.length}건 · enDisp 부여 ${enAdded.length}건 · source_key 미매칭 ${miss}건\n`);
for (const c of krChanged.slice(0, 10)) console.log(`  kr   ${c.en.padEnd(22)} "${c.from}" → "${c.to}"`);
if (krChanged.length > 10) console.log(`  … 외 ${krChanged.length - 10}건`);
console.log("");
for (const c of enAdded.slice(0, 10)) console.log(`  disp ${c.en.padEnd(22)} → "${c.to}"`);
if (enAdded.length > 10) console.log(`  … 외 ${enAdded.length - 10}건`);
