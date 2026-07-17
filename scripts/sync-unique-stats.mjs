// 유니크·세트 옵션(도감용)을 diablo-mdb 에서 생성한다 → lib/unique-stats.js
//
// 왜 텍스트만 가져오나: mdb `docs/consuming.md` §"`text`를 직접 만들지 마라" —
//   `code`/`min`/`max` 로 문자열을 조립하면 D2 의 `descfunc` 함정에 빠진다(1/128 단위·프레임당 1/256·
//   원소 피해의 min/max 는 굴림 범위가 아님 등). mdb 가 이미 렌더한 `text` 를 그대로 쓴다.
//   `min`/`max`/`code` 는 필터·정렬용인데 우리는 아직 필터가 없으므로 안 가져온다(필요해지면 그때).
//
// 지켜야 할 것 (consuming.md · 실측으로 확인함):
//   - `displayed: false` → **숨긴다.** 게임도 옵션 줄로 안 보여주는 것들이다(`dur` 내구도 수치·`sock` 소켓 등 70줄).
//     ⚠ "내구도 1 회복"은 **정상 표시 옵션**이다(코드가 다르다) — 한국어 키워드로 다시 거르지 마라.
//   - `text` 없는 줄 → 렌더 못 한 줄이니 표시하지 않는다(현재 0줄).
//   - `expanded_from` → 한 속성이 여러 줄로 펼쳐진 것. **줄을 합치지 마라.**
//     유니크 중엔 지옥포(Hellrack) 1종뿐이고 화염·번개·냉기 3줄로 나온다. 합치면 2줄이 사라진다.
//     (mdb 회신: market 이 실제로 이 버그를 배포할 뻔했다.)
//   - 조인 축은 파일마다 다르다 — 아래 참조. 미매칭 0 으로 확인하고 쓴다.
//
// 쓰는 법:  node scripts/sync-unique-stats.mjs <diablo-mdb 클론 경로>

import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
if (!root || !fs.existsSync(path.join(root, "data/uniques.json"))) {
  console.error("사용법: node scripts/sync-unique-stats.mjs <diablo-mdb 클론 경로>");
  process.exit(1);
}

const U = JSON.parse(fs.readFileSync(path.join(root, "data/uniques.json"), "utf8"));
const S = JSON.parse(fs.readFileSync(path.join(root, "data/sets.json"), "utf8"));
const { CLASSIC } = await import(path.join(process.cwd(), "lib/grail-classic.js"));
const { ITEMS } = await import(path.join(process.cwd(), "lib/items.js"));

// 🔴 우리 두 데이터 파일의 `en` 은 **의미가 다르다.** 조인 축도 달라야 한다:
//   - `grail-classic.js` 의 en = 덤프 **내부 식별자**(`Cutthroat1`·`Mindrend`)  → mdb `source_key`
//   - `items.js`(3.x 신규) 의 en = **표시명**(`Hellwarden's Will`)              → mdb `name_en`
//     (mdb 의 그 항목 source_key 는 `Unique Warlock Helm` 이다. items.js 는 사람이 게임 화면에서
//      옮겨 적어 표시명이 들어갔다.)
// 축을 하나로 통일하려 들면 한쪽이 반드시 샌다. 실측: 각자의 축으로 512/512 · 20/20 붙는다.
const bySK = new Map();   // 내부 식별자 축 (클래식용)
const byEN = new Map();   // 표시명 축 (3.x 신규용)
for (const u of U.uniques) { bySK.set(`unique|${u.source_key}`, u); byEN.set(`unique|${u.name_en}`, u); }
for (const s of S.sets || []) for (const it of s.items || []) {
  bySK.set(`set|${it.source_key}`, it);
  byEN.set(`set|${it.name_en}`, it);
}

// 신규(items.js)는 grail-collect 가 `u:${en}`·`s:${en}` 로 id 를 만든다 — 그 규칙 그대로 맞춘다.
const targets = [
  ...CLASSIC.map((o) => ({ id: o.id, cat: o.cat, key: o.en, idx: bySK })),
  ...ITEMS.filter((i) => i.cat === "unique").map((i) => ({ id: `u:${i.en}`, cat: "unique", key: i.en, idx: byEN })),
  ...ITEMS.filter((i) => i.cat === "set" && i.slug).map((i) => ({ id: `s:${i.en}`, cat: "set", key: i.en, idx: byEN })),
];

const out = {};
let shown = 0, hidden = 0, noText = 0, miss = 0;
for (const o of targets) {
  const m = o.idx.get(`${o.cat}|${o.key}`);
  if (!m) { miss++; continue; }
  const lines = [];
  for (const st of m.stats || []) {
    if (st.displayed === false) { hidden++; continue; }   // 게임이 옵션으로 안 보여주는 줄
    if (!st.text) { noText++; continue; }                 // 렌더 못 한 줄
    lines.push(st.text);
    shown++;
  }
  if (lines.length) out[o.id] = lines;
}

const body = `// 자동 생성 — 직접 수정하지 마라. \`node scripts/sync-unique-stats.mjs <mdb-clone>\` 로 다시 만든다.
// 출처: diablo-mdb (D2R 설치본 스트링 빌드 3.2.92777). uniques _generated=${U._generated} · sets _generated=${S._generated}
//
// 그레일 id → 옵션 줄(한글). mdb 가 렌더한 \`stats[].text\` 원문이다 — 우리가 조립하지 않는다(descfunc 함정).
// \`displayed:false\` 줄은 제외했다(게임도 옵션으로 안 보여준다). 한 속성이 여러 줄인 것(지옥포의 화염·번개·냉기)은
// **펼쳐진 그대로 둔다** — 합치면 줄이 사라진다.
export const UNIQUE_STATS = ${JSON.stringify(out, null, 0)};
`;
fs.writeFileSync(path.join(process.cwd(), "lib/unique-stats.js"), body);

console.log(`mdb: uniques=${U._generated}`);
console.log(`\n항목 ${Object.keys(out).length}/${targets.length} (클래식 ${CLASSIC.length} + 3.x 신규 ${targets.length - CLASSIC.length}) · 표시 줄 ${shown} · 숨김(displayed:false) ${hidden} · text없음 ${noText} · 미매칭 ${miss}`);
console.log(`크기: ${(body.length / 1024).toFixed(0)}KB`);
