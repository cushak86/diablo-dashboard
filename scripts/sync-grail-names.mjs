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

// source_key(= 우리 en) → { ko, en, baseKo }
//
// baseKo 를 **우리 `base` 문자열로 조회하지 않는다.** 우리 base 는 지저분하다 —
// `Kris`(mdb `Kriss`) · `Hard Leather`(mdb `Hard Leather Armor`) · `AncientArmor`(띄어쓰기 없음) ·
// `Gloves`(후보 2개로 모호) · `Hunter\92s Bow`(Windows-1252 아포스트로피 잔재) · 값 자체가 틀린 것도 있다
// (`Cutthroat1` 의 base 가 우리는 `Runic Talons`, mdb 는 `Greater Talons`).
// 문자열 대조는 262/385 에서 막히고 나머지는 추측이 된다.
// → **유니크를 source_key 로 조인해 그 항목이 들고 있는 `base.ko` 를 쓴다. 512/512 확보된다.**
const bySK = new Map();
const pick = (x) => ({ ko: x.name_ko, en: x.name_en, baseKo: x.base?.ko || "" });
for (const u of U.uniques) bySK.set(`unique|${u.source_key}`, pick(u));
for (const s of S.sets || []) for (const it of s.items || []) bySK.set(`set|${it.source_key}`, pick(it));

const target = path.join(process.cwd(), "lib/grail-classic.js");
let code = fs.readFileSync(target, "utf8");

const krChanged = [], enAdded = [], baseAdded = [];
let miss = 0;
// `kr: "…", [aka: "…",] [enDisp: "…",] en: "<source_key>", cat: "…", [baseKr: "…",]`
// en·cat 은 캡처해 조회에만 쓰고 **그대로 되돌려 쓴다** — 구조적으로 못 바꾼다.
code = code.replace(
  /(kr:\s*")([^"]+)(",)(\s*aka:\s*"[^"]*",)?(\s*enDisp:\s*"[^"]*",)?(\s*en:\s*"([^"]+)",\s*cat:\s*"([^"]+)")(,\s*baseKr:\s*"[^"]*")?/g,
  (m, pre, oldKr, post, oldAka, _oldDisp, tail, en, cat, _oldBaseKr) => {
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

    // 베이스 한글: 검색용. "샤코"로 찾으면 할리퀸 관모가 나와야 한다(최다 검색어인데 안 잡혔다).
    let bk = "";
    if (hit.baseKo) { bk = `, baseKr: "${hit.baseKo}"`; baseAdded.push(en); }

    return pre + kr + post + aka + disp + tail + bk;
  }
);

fs.writeFileSync(target, code);
console.log(`mdb: uniques=${U._generated} sets=${S._generated}`);
console.log(`\nkr 변경 ${krChanged.length}건 · enDisp ${enAdded.length}건 · baseKr ${baseAdded.length}건 · source_key 미매칭 ${miss}건\n`);
for (const c of krChanged.slice(0, 10)) console.log(`  kr   ${c.en.padEnd(22)} "${c.from}" → "${c.to}"`);
if (krChanged.length > 10) console.log(`  … 외 ${krChanged.length - 10}건`);
console.log("");
for (const c of enAdded.slice(0, 10)) console.log(`  disp ${c.en.padEnd(22)} → "${c.to}"`);
if (enAdded.length > 10) console.log(`  … 외 ${enAdded.length - 10}건`);
