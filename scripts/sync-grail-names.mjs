// 그레일(유니크·세트) 한글명을 diablo-mdb 정본에 맞춘다.
//
// 왜: lib/grail-classic.js 의 kr 은 blizzhackers 덤프의 localestrings-kor 에서 왔다(파일 주석 참조).
//     그 테이블은 구버전이라 **음차**다("더 내셔"·"데쓰스페이드"). D2R 설치본 스트링은 번역체다
//     ("갉아먹는 자"·"죽음의 날"). 2026-07-17 대조 결과 매칭 418종 중 409종(97.8%)이 달랐다.
//     같은 함정을 지역 표기에서도 밟았고(zones.js), 사장님이 덤프 표기를 물리치셨다.
//
// 이 스크립트가 바꾸는 것 / 안 바꾸는 것:
//   ✅ kr        — mdb의 name_ko. 표시 전용이라 사용자 수집 기록과 무관하다.
//   ✅ aka       — 옛 표기를 남긴다. 사용자는 옛 이름으로 검색한다(표기가 아니라 도달 문제).
//   ⛔ id·en·base — **한 글자도 안 건드린다.** id 가 곧 사용자의 체크 상태다(파일 주석 경고).
//                   en 을 고치려면 grail-store 의 v1/v2 마이그레이션 설계가 선행돼야 한다.
//
// 못 하는 것 (2026-07-17 기준 · master 실측):
//   - en 표기가 어긋난 35종(`Umes Lament` vs `Ume's Lament` — 덤프가 아포스트로피를 날렸다)
//   - mdb에 대응이 없는 59종. 그중 38종은 베이스로 1:1이 붙지만 **그건 추측이다**
//     (`Mindrend`→`Skull Splitter`가 정말 개명인지 근거 없음). 18종은 진짜 고아이고
//     `Cutthroat1`·`KhalimFlail` 같은 **내부 코드**가 섞여 있다.
//   → 위 둘은 이 스크립트의 범위 밖. 사장님 판단·마이그레이션 설계가 필요하다.
//
// 쓰는 법:  node scripts/sync-grail-names.mjs <diablo-mdb clone 경로>

import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
if (!root || !fs.existsSync(path.join(root, "data/uniques.json"))) {
  console.error("사용법: node scripts/sync-grail-names.mjs <diablo-mdb 클론 경로>");
  process.exit(1);
}

const U = JSON.parse(fs.readFileSync(path.join(root, "data/uniques.json"), "utf8"));
const S = JSON.parse(fs.readFileSync(path.join(root, "data/sets.json"), "utf8"));

// mdb 인덱스: cat|en → name_ko. 세트는 sets[].items[] 안에 있다.
const ko = new Map();
for (const u of U.uniques) ko.set(`unique|${u.name_en}`, u.name_ko);
for (const s of S.sets || []) for (const it of s.items || []) ko.set(`set|${it.name_en}`, it.name_ko);

const target = path.join(process.cwd(), "lib/grail-classic.js");
let code = fs.readFileSync(target, "utf8");

const changed = [];
let skipped = 0;
// `{ id: "...", kr: "X", en: "Y", cat: "Z", base: "..." }` — en·cat 으로 찾아 kr 만 교체하고 aka 를 남긴다.
// id 는 정규식의 캡처 밖이므로 구조적으로 건드릴 수 없다.
code = code.replace(
  /(kr:\s*")([^"]+)(",)(\s*aka:\s*"[^"]*",)?(\s*en:\s*"([^"]+)",\s*cat:\s*"([^"]+)")/g,
  (m, pre, oldKr, post, existingAka, tail, en, cat) => {
    const want = ko.get(`${cat}|${en}`);
    if (!want) { skipped++; return m; }          // mdb에 대응 없음 → 손대지 않는다
    if (want === oldKr) return m;
    changed.push({ en, cat, from: oldKr, to: want });
    const aka = existingAka || ` aka: "${oldKr}",`;
    return pre + want + post + aka + tail;
  }
);

fs.writeFileSync(target, code);
console.log(`mdb _generated: uniques=${U._generated} sets=${S._generated}`);
console.log(`mdb 보유: 유니크 ${U.uniques.length} · 세트 아이템 ${(S.sets || []).reduce((n, s) => n + (s.items || []).length, 0)}`);
console.log(`\nkr 변경 ${changed.length}건 · mdb 대응 없어 건너뜀 ${skipped}건\n`);
for (const c of changed.slice(0, 15)) console.log(`  [${c.cat}] ${c.en.padEnd(26)} "${c.from}" → "${c.to}"`);
if (changed.length > 15) console.log(`  … 외 ${changed.length - 15}건`);
