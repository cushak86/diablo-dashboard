// 파밍 지도 데이터 추출기 — 오프라인 전용. lib/farm-targets.js의 근거를 재생성·재검증한다.
//
// 실행: node scripts/extract-farm-data.mjs [--refresh]
//
// ⚠ 덤프(blizzhackers/d2data)는 **커밋하지 않는다**. 블리자드 게임 데이터 추출물이고,
//   배포 미러(github.com/cushak86/diablo-dashboard)는 공개 repo다. 이 스크립트가 .d2data/(gitignored)로
//   내려받아 파싱하고, 파생 결과(작은 lib/farm-targets.js)만 사람이 검토해 커밋한다.
//
// ⚠ 확률·드롭레이트는 산출하지 않는다(범위 밖). 답하는 것은 "경로가 존재하는가"뿐.

import fs from "node:fs";
import path from "node:path";
import { expandLeaves, findPath, maxRune, directParents, groupLadder } from "./tc-extract.mjs";

const CACHE = path.join(process.cwd(), ".d2data");
const REPO = "https://raw.githubusercontent.com/blizzhackers/d2data/master";

// 🔴 소스 경로 주의 — 업스트림에 **두 벌**이 있고 값이 다르다(2026-07-16 실측):
//   json/treasureclassex.json      → TC 1345 · Desecrated 334 (452,626B)  ← 3.x Herald·월드스톤 조각 포함
//   json/base/treasureclassex.json → TC 1138 · Desecrated 285 (379,875B)  ← 부분집합(base에만 있는 TC 0개)
// 두 벌의 차이는 ①Herald/월드스톤 조각 TC 추가 ②Prob·Picks 값(범위 밖)이며,
// **우리가 뽑는 답(어느 룬까지 나오는가·근거 경로)은 두 소스에서 동일함을 확인했다**
// (9개 루트 max rune 9/9 일치 — master 독립 재검증 2026-07-16).
// json/(전체)로 고정한다 — 라이브 3.x 기준이 더 최신이라는 사장님 판정(2026-07-16).
const SRC = {
  treasureclassex: "json", misc: "json", monstats: "json",
  superuniques: "json", levels: "json", uniqueitems: "json", armor: "json",
  desecratedzones: "json", // base/엔 아예 없다(404)
};
// 순서 고정 — 아래 구조분해와 1:1로 맞춘다(Object.keys 순서에 기대지 말 것).
const FILES = ["treasureclassex", "misc", "monstats", "superuniques", "levels", "desecratedzones", "uniqueitems", "armor"];

async function load(name) {
  const file = path.join(CACHE, `${name}.json`);
  if (!fs.existsSync(file) || process.argv.includes("--refresh")) {
    fs.mkdirSync(CACHE, { recursive: true });
    const res = await fetch(`${REPO}/${SRC[name]}/${name}.json`);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status} (${SRC[name]})`);
    fs.writeFileSync(file, await res.text());
    console.log(`  받음 ${SRC[name]}/${name}.json`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const list = (o) => (Array.isArray(o) ? o : Object.values(o));

const main = async () => {
  console.log("덤프 로드 (.d2data/ — gitignored)");
  const [tc, misc, monstats, superuniques, levels, dz, uniques, armor] = await Promise.all(FILES.map(load));

  const runeName = {};
  for (const m of list(misc)) if (/^r\d+$/.test(m.code || "")) runeName[m.code] = m.name;

  console.log(`\nTC ${Object.keys(tc).length} · Desecrated ${Object.keys(tc).filter((k) => k.includes("Desecrated")).length}`);

  // ── 1. Desecrated A~F 정체 ────────────────────────────────────────────
  console.log("\n[1] Desecrated 변형 = 지역인가 레벨 구간인가");
  console.log(`  desecratedzones.json에 "Desecrated A" 문자열: ${JSON.stringify(dz).includes("Desecrated A")}`);
  console.log("  Countess group 35 사다리(level 오름차순):");
  for (const r of groupLadder(35, tc)) console.log(`    ${String(r.level).padStart(3)} ${r.tc} → max ${maxRune(expandLeaves(r.tc, tc)) ?? "-"}`);

  // ── 2. TZ 매핑: areaId → desecrated zone ──────────────────────────────
  const zoneOf = {};
  for (const z of dz.desecrated_zones[0].zones) for (const l of z.levels) zoneOf[l.level_id] = z.id;
  console.log(`\n[2] TZ 존 ${dz.desecrated_zones[0].zones.length} · 공포화 가능 area ${Object.keys(zoneOf).length}`);
  const hell = dz.desecrated_zones[0].game_difficulties.expansion.hell.defaults;
  console.log(`  지옥 TZ 몬스터 레벨 범위: ${hell.bound_incl_min}~${hell.bound_incl_max} (boost_level=${hell.boost_level})`);

  // ── 3. 슈퍼유니크별 룬 도달 상한 ───────────────────────────────────────
  console.log("\n[3] 슈퍼유니크 룬 상한 (지옥 · 비TZ vs TZ)");
  const areaName = {};
  for (const l of list(levels)) if (l.Id !== undefined) areaName[l.Id] = l.LevelName;
  const rows = [];
  for (const s of list(superuniques)) {
    const base = s["TC(H)"], des = s["TC(H) Desecrated"];
    if (!base || !tc[base]) continue;
    const plain = maxRune(expandLeaves(base, tc));
    // TZ는 group 사다리 전체가 도달 가능(몬스터 레벨에 따라) → 사다리 최상단 기준
    const ladder = tc[des] ? groupLadder(tc[des].group, tc).filter((r) => r.tc.includes("(H)")) : [];
    const top = ladder.length ? maxRune(expandLeaves(ladder[ladder.length - 1].tc, tc)) : null;
    rows.push({ name: s.Name, area: areaName[s.areaId], areaId: s.areaId, tz: zoneOf[s.areaId] ?? null, plain, top });
  }
  for (const r of rows.filter((r) => r.plain).sort((a, b) => (Number(b.top?.slice(1)) || 0) - (Number(a.top?.slice(1)) || 0)).slice(0, 12))
    console.log(`  ${String(r.name).padEnd(22)} ${String(r.area ?? "지역미상(areaId 없음)").padEnd(24)} 비TZ ${String(r.plain).padEnd(4)}(${runeName[r.plain] ?? "?"}) TZ상한 ${r.top ?? "-"}(${runeName[r.top] ?? "-"}) ${r.tz ?? "TZ로테이션 없음"}`);

  // ── 4. 고룬 직접 포함 TC ──────────────────────────────────────────────
  console.log("\n[4] 고룬 직접 포함 TC");
  for (const code of ["r24", "r28", "r30", "r31", "r32", "r33"])
    console.log(`  ${code}(${runeName[code]}): ${JSON.stringify(directParents(code, tc))}`);

  // ── 5. 유니크 파일럿 ─────────────────────────────────────────────────
  console.log("\n[5] 유니크 파일럿 — TC만으로 답할 수 있나");
  const uniq = (idx) => list(uniques).find((u) => u.index === idx);
  const armorOf = (code) => list(armor).find((a) => a.code === code);
  for (const idx of ["The Stone of Jordan", "Harlequin Crest"]) {
    const u = uniq(idx);
    const parents = directParents(u.code, tc);
    const a = armorOf(u.code);
    console.log(`  ${idx}: code=${u.code} qlvl=${u.lvl} spawnable=${u.spawnable}`);
    console.log(`    TC에 코드가 직접 등장하는 곳: ${parents.length}개 ${JSON.stringify(parents.slice(0, 4))}`);
    if (!parents.length && a) console.log(`    → TC 직접 부재. armor.json 조인: type=${a.type} level=${a.level} → armoNN 의사코드 경유(해석 규칙 미확인)`);
  }
  const cl = expandLeaves("Countess (H)", tc);
  console.log(`  Countess (H) 잎: rin=${cl.has("rin")} uap=${cl.has("uap")} · armo 티어 상한=${[...cl].filter((c) => /^armo\d+$/.test(c)).map((c) => +c.slice(4)).sort((a, b) => b - a)[0]}`);
  console.log(`  Countess 몬스터 레벨(지옥): ${list(monstats).find((m) => m.Id === "corruptrogue3")?.["Level(H)"]}`);

  // ── 6. 고정 케이스 재검증 ────────────────────────────────────────────
  console.log("\n[6] 고정 케이스(master 검증값) 재현");
  const cases = [["Countess (H)", "r28"], ["Countess Rune (H)", "r24"], ["Countess (H) Desecrated A", "r32"], ["Countess (H) Desecrated D", "r33"]];
  let ok = true;
  for (const [root, want] of cases) {
    const got = maxRune(expandLeaves(root, tc));
    const pass = got === want;
    ok &&= pass;
    console.log(`  ${pass ? "ok  " : "FAIL"} ${root.padEnd(28)} → ${got} (기대 ${want})`);
  }
  console.log(`  경로 예시(Ber): ${JSON.stringify(findPath("Act 3 (H) Good", "r30", tc))}`);
  console.log(ok ? "\n전부 일치" : "\n불일치 있음");
};

main().catch((e) => { console.error(e.message); process.exit(1); });
