// 3.x 신규 룬워드(isNew)의 옵션 줄을 diablo-mdb 정본에서 생성해 lib/runewords.js 의 stats 에 넣는다.
//
// 왜: 이 7종은 손입력이었고 "비공식 · 검증 필요" 배지를 달고 있었다. 2026-08-27 실측 — mdb(CASC runes.txt 대조 완료)와
//   대조하니 광기 "공격 속도 +45%·달리기 +45%" 는 게임엔 없는 값이고, 발작 "방어 +45" 도 없다. 손으로 다시 적으면 또
//   틀린다 → mdb 가 렌더한 `text` 를 그대로 옮긴다(consuming.md: text 를 직접 만들지 마라).
//
// 범위: isNew 인 항목만. 나머지 92종은 손입력(3.2 정본 대조본)이라 이번엔 안 건드린다 — 확장하려면 아래 필터만 풀면 된다.
//   단 그때는 요약(stat) 도 함께 손봐야 한다(test/runeword-coherence 가 요약의 숫자를 stats 에서 찾는다).
// variant 가 여럿(무기/방패)이면 우리 표기대로 "[무기] a · b" 한 줄로 접는다 — 현재 7종은 전부 단일 variant.
// displayed:false·text 없는 줄은 낸다(consuming.md).
//
// 쓰는 법:  node scripts/sync-runeword-stats.mjs <diablo-mdb 클론 경로>

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.argv[2];
const src = root && path.join(root, "data/runewords.json");
if (!src || !fs.existsSync(src)) {
  console.error("사용법: node scripts/sync-runeword-stats.mjs <diablo-mdb 클론 경로>");
  process.exit(1);
}
let mdbRev = "unknown";
try { mdbRev = execSync("git log --format=%h -1", { cwd: root }).toString().trim(); } catch {}

const mdb = JSON.parse(fs.readFileSync(src, "utf8"));
const byEn = new Map(mdb.runewords.map((r) => [r.name_en, r]));

const target = path.join(process.cwd(), "lib/runewords.js");
let code = fs.readFileSync(target, "utf8");

const linesOf = (v) => v.stats.filter((s) => s.displayed !== false && s.text).map((s) => s.text);
const report = [];
let mismatch = 0;

// 한 항목 = 한 줄. `en:` 으로 찾고 isNew 가 있으면 그 줄의 stats:[...] 만 갈아 끼운다.
code = code.replace(/^(\s*\{ en: "([^"]+)",.*?isNew: true.*?stats: )\[[^\]]*\](.*)$/gm, (m, pre, en, post) => {
  const r = byEn.get(en);
  if (!r) { report.push(`  ⚠️ mdb 에 없음: ${en}`); return m; }

  // 레시피는 안 바꾼다 — 대신 다른지 검사해 알린다(mdb 가 정본이지만 runes 는 그레일 id·플래너가 쓰므로 사람이 판단).
  const ourRunes = /runes: \[([^\]]*)\]/.exec(m)?.[1].replace(/["\s]/g, "") ?? "";
  const mdbRunes = r.runes.map((x) => x.en).join(",");
  if (ourRunes !== mdbRunes) { mismatch++; report.push(`  ⚠️ 룬 불일치 ${en}: 우리 ${ourRunes} / mdb ${mdbRunes}`); }

  const stats = r.variants.length === 1
    ? linesOf(r.variants[0])
    : r.variants.map((v) => `[${v.slot_ko}] ${linesOf(v).join(" · ")}`);
  report.push(`  ${en.padEnd(10)} ${r.name_ko} — ${stats.length}줄`);
  return `${pre}${JSON.stringify(stats)}${post}`;
});

fs.writeFileSync(target, code);
console.log(`mdb ${mdbRev} · _generated ${mdb._generated}`);
console.log(report.join("\n"));
console.log(`\n룬 불일치 ${mismatch}건`);
if (mismatch) process.exitCode = 1;
