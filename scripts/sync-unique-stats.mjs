// 유니크·세트 옵션(도감용)을 diablo-mdb 에서 생성한다 → lib/unique-stats.js
//
// 왜 텍스트만 가져오나: mdb `docs/consuming.md` §"`text`를 직접 만들지 마라" —
//   `code`/`min`/`max` 로 문자열을 조립하면 D2 의 `descfunc` 함정에 빠진다(1/128 단위·프레임당 1/256·
//   원소 피해의 min/max 는 굴림 범위가 아님 등). mdb 가 이미 렌더한 `text` 를 그대로 쓴다.
//   `min`/`max`/`code` 는 필터·정렬용인데 우리는 아직 필터가 없으므로 안 가져온다(필요해지면 그때).
//
// 지켜야 할 것 (consuming.md · 실측으로 확인함):
//   - `displayed: false` → **숨긴다.** 게임도 옵션 줄로 안 보여주는 것들이다(내구도·소켓 등). 우리 512종에 68줄.
//   - `text` 없는 줄 → 렌더 못 한 줄이니 표시하지 않는다(현재 0줄).
//   - `expanded_from` → 한 속성이 여러 줄로 펼쳐진 것. **줄을 합치지 마라.**
//     유니크 중엔 지옥포(Hellrack) 1종뿐이고 화염·번개·냉기 3줄로 나온다. 합치면 2줄이 사라진다.
//     (mdb 회신: market 이 실제로 이 버그를 배포할 뻔했다.)
//   - 조인은 `source_key`(= 우리 `en`, 게임 내부 식별자). 512/512 붙는다.
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

const bySK = new Map();
for (const u of U.uniques) bySK.set(`unique|${u.source_key}`, u);
for (const s of S.sets || []) for (const it of s.items || []) bySK.set(`set|${it.source_key}`, { ...it, _set: s.name_ko });

const out = {};
let shown = 0, hidden = 0, noText = 0, miss = 0;
for (const o of CLASSIC) {
  const m = bySK.get(`${o.cat}|${o.en}`);
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
console.log(`\n항목 ${Object.keys(out).length}/${CLASSIC.length} · 표시 줄 ${shown} · 숨김(displayed:false) ${hidden} · text없음 ${noText} · 미매칭 ${miss}`);
console.log(`크기: ${(body.length / 1024).toFixed(0)}KB`);
