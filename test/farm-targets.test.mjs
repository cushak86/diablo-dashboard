// 파밍 지도 데이터층 — 추출 엔진 + lib/farm-targets.js 무결성.
// 실행: node test/farm-targets.test.mjs
//
// 2단: ①덤프 없이도 도는 검증(엔진 로직 + 데이터 정합 + 링크 실존) ②덤프(.d2data/)가 있으면 원본 스냅샷까지.
// 덤프는 커밋하지 않으므로(공개 미러·저작권) ②는 없으면 건너뛴다. ①만으로도 회귀는 잡힌다.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { expandLeaves, findPath, maxRune, directParents, childrenOf, groupLadder } from "../scripts/tc-extract.mjs";
import { FARM_TARGETS, SPOTS, chosung, searchTargets, runewordsUsing, buildsUsing, resolveSpots } from "../lib/farm-targets.js";
import { RW } from "../lib/runewords.js";
import { RUNES } from "../lib/cube.js";
import { BASELINE } from "../lib/price-baseline.js";
import { CLASSIC } from "../lib/grail-classic.js";
import { TERROR_ZONES } from "../lib/zones.js";

let failed = 0;
const t = (name, fn) => {
  try { fn(); console.log(`  ok  ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
};

// ── ① 추출 엔진 (픽스처 — 덤프 불필요) ────────────────────────────────────
// 실제 TC 구조를 축소 재현: TC가 TC를 참조하고, 잎은 아이템 코드다.
const FIX = {
  "Boss (H)":   { Item1: "Boss Item (H)", Prob1: 1, Item2: "Runes 2", Prob2: 1 },
  "Boss Item (H)": { Item1: "Act 1 Good", Prob1: 1 },
  "Act 1 Good": { Item1: "Runes 3", Prob1: 1, Item2: "gld", Prob2: 1 },
  "Runes 3":    { Item1: "r30", Prob1: 1, Item2: "Runes 2", Prob2: 1 },
  "Runes 2":    { Item1: "r24", Prob1: 1, Item2: "Runes 1", Prob2: 1 },
  "Runes 1":    { Item1: "r01", Prob1: 1, Item2: "", Prob2: 0 }, // 빈 Item은 건너뛴다
  "Cycle A":    { Item1: "Cycle B" },
  "Cycle B":    { Item1: "Cycle A", Item2: "r09" }, // 순환 — 무한루프 나면 안 됨
  "Tier Lo":    { group: 7, level: 10, Item1: "r01" },
  "Tier Hi":    { group: 7, level: 90, Item1: "r33" },
};

t("childrenOf — Item1..N만 읽고 빈 값은 버린다(Prob은 읽지 않는다)", () => {
  assert.deepEqual(childrenOf(FIX["Runes 3"]), ["r30", "Runes 2"]);
  assert.deepEqual(childrenOf(FIX["Runes 1"]), ["r01"]);
});

t("expandLeaves — 재귀 전개로 잎(아이템 코드)만 남는다", () => {
  assert.deepEqual([...expandLeaves("Boss (H)", FIX)].sort(), ["gld", "r01", "r24", "r30"]);
});

t("expandLeaves — 순환 참조에서 멈춘다(무한루프 방지)", () => {
  assert.deepEqual([...expandLeaves("Cycle A", FIX)], ["r09"]);
});

t("expandLeaves — TC가 아닌 이름은 그 자체가 잎", () => {
  assert.deepEqual([...expandLeaves("r30", FIX)], ["r30"]);
});

t("maxRune — 잎 집합에서 최고 룬 코드", () => {
  assert.equal(maxRune(expandLeaves("Boss (H)", FIX)), "r30");
  assert.equal(maxRune(expandLeaves("Runes 2", FIX)), "r24");
  assert.equal(maxRune(new Set(["gld", "rin"])), null); // 룬 없으면 null
});

t("findPath — 근거 경로를 실제 부모 체인으로 돌려준다", () => {
  assert.deepEqual(findPath("Boss (H)", "r30", FIX), ["Boss (H)", "Boss Item (H)", "Act 1 Good", "Runes 3", "r30"]);
  assert.equal(findPath("Runes 1", "r30", FIX), null); // 없는 경로는 null (있다고 우기지 않는다)
});

t("directParents — 코드를 직접 가진 TC만(재귀 아님)", () => {
  assert.deepEqual(directParents("r30", FIX), ["Runes 3"]);
  assert.deepEqual(directParents("r24", FIX), ["Runes 2"]);
});

t("groupLadder — 같은 group을 level 오름차순으로(Desecrated 변형 = 레벨 구간)", () => {
  assert.deepEqual(groupLadder(7, FIX), [{ tc: "Tier Lo", level: 10 }, { tc: "Tier Hi", level: 90 }]);
});

// ── ② 데이터 정합 (lib/farm-targets.js) ──────────────────────────────────
t("목표 37개 (1차 10 + 2차 15 + D1 장신구 8 + D1 방어구 4[샤코는 기존 정정])", () => {
  assert.equal(FARM_TARGETS.length, 37);
});

t("타입 분포 — 룬 11 · 룬워드 재료 8 · 고유 18", () => {
  const by = (ty) => FARM_TARGETS.filter((x) => x.type === ty).length;
  assert.equal(by("rune"), 11);
  assert.equal(by("runeword-mat"), 8);
  assert.equal(by("unique"), 18);
});

t("uberOnly(안니·토치) — 스팟 0·tcPath 없음·warn 있음·qlvl 110 (일반 드롭 불가 확정)", () => {
  const uber = FARM_TARGETS.filter((x) => x.uberOnly);
  assert.deepEqual(uber.map((x) => x.id).sort(), ["unique-annihilus", "unique-hellfire-torch"]);
  for (const x of uber) {
    assert.equal(x.spots.plain.length + x.spots.tz.length, 0, `${x.id}: uberOnly면 스팟 0`);
    assert.equal(x.tcPath, null, `${x.id}: uberOnly면 tcPath 없음(떨어지지 않으므로)`);
    assert.ok(x.warn, `${x.id}: 사유(warn) 있어야`);
    assert.equal(x.qlvl, 110);
    assert.ok(x.rewardSource, `${x.id}: 출처(rewardSource) 있어야 — 화면 안내에 쓴다`);
  }
  // 안니≠토치: 두 우버 아이템의 출처가 서로 달라야 한다(codex 지적 — 같은 이벤트로 오안내 방지).
  const anni = FARM_TARGETS.find((x) => x.id === "unique-annihilus");
  const torch = FARM_TARGETS.find((x) => x.id === "unique-hellfire-torch");
  assert.notEqual(anni.rewardSource, torch.rewardSource, "안니(우버 디아블로)와 토치(우버 트리스트람)는 다른 이벤트");
  assert.ok(anni.rewardSource.includes("디아블로"));
  assert.ok(torch.rewardSource.includes("트리스트람"));
});

t("유니크 qlvl 필터 — 표시한 plain 스팟은 전부 몬스터 레벨 ≥ qlvl (근거 있는 것만)", () => {
  const bad = [];
  for (const x of FARM_TARGETS.filter((x) => x.type === "unique" && x.qlvl)) {
    for (const id of x.spots.plain) {
      const s = SPOTS[id];
      if (!(s.mlvl >= x.qlvl)) bad.push(`${x.id}: ${id}(mlvl ${s.mlvl}) < qlvl ${x.qlvl}`);
    }
  }
  assert.deepEqual(bad, []);
});

t("유니크 qlvl 필터 완결성 — plain=레벨충족·tz=레벨미달, 7스팟 전부 분류(임의 누락 금지)", () => {
  // mara·gheed 베이스(목걸이·거대부적)는 7스팟 전부 도달(§5 덤프 대조로 별도 검증). 여기선 mlvl로 plain/tz가
  // 완전 분할되는지 본다 — plain=mlvl≥qlvl, tz=mlvl<qlvl. 어느 한쪽에서 스팟이 사라지면 잡힌다.
  const plainExp = (qlvl) => Object.entries(SPOTS).filter(([, s]) => s.mlvl >= qlvl).map(([id]) => id).sort();
  const tzExp = (qlvl) => Object.entries(SPOTS).filter(([, s]) => s.mlvl < qlvl).map(([id]) => id).sort();
  for (const [id, qlvl] of [["unique-mara", 80], ["unique-gheeds", 70]]) {
    const t2 = FARM_TARGETS.find((x) => x.id === id);
    assert.deepEqual([...t2.spots.plain].sort(), plainExp(qlvl), `${id} plain`);
    assert.deepEqual([...t2.spots.tz].sort(), tzExp(qlvl), `${id} tz`);
    assert.equal(t2.spots.plain.length + t2.spots.tz.length, Object.keys(SPOTS).length, `${id} 7스팟 전부 분류`);
  }
});

t("SPOTS 전부 mlvl·monId 보유 (유니크 레벨 판정의 근거)", () => {
  const bad = Object.entries(SPOTS).filter(([, s]) => !Number.isInteger(s.mlvl) || !s.monId).map(([id]) => id);
  assert.deepEqual(bad, []);
});

t("id 중복 0 — id는 링크·체크가 물리는 안정 키다", () => {
  const ids = FARM_TARGETS.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
});

t("모든 spots 참조가 SPOTS에 실존한다(오타 = 카드에서 스팟 증발)", () => {
  const bad = [];
  for (const t2 of FARM_TARGETS)
    for (const id of [...t2.spots.plain, ...t2.spots.tz])
      if (!SPOTS[id]) bad.push(`${t2.id} → ${id}`);
  assert.deepEqual(bad, []);
});

t("같은 스팟이 plain과 tz에 동시에 오지 않는다(TZ전용 = 비TZ 불가라는 뜻)", () => {
  const bad = FARM_TARGETS.filter((x) => x.spots.plain.some((s) => x.spots.tz.includes(s))).map((x) => x.id);
  assert.deepEqual(bad, []);
});

t("확률·드롭레이트 수치가 데이터에 없다 (범위 밖 — 규율)", () => {
  // 주석이 아니라 **실제 내보내는 데이터**를 본다(주석의 "Prob은 읽지 않는다" 같은 서술은 위반이 아니다).
  const data = JSON.stringify(FARM_TARGETS) + JSON.stringify(SPOTS);
  const leaks = [/\bProb\d/, /\bNoDrop\b/, /ItemProbTotal/, /드롭\s*확률\s*\d/, /\d+\s*분의\s*\d+/, /\d+(\.\d+)?\s*%/];
  const hit = leaks.filter((re) => re.test(data)).map(String);
  assert.deepEqual(hit, []);
});

t("근거 없는 스팟은 없다 — 스팟이 비면 반드시 warn이 있다(빈칸 금지·추측 금지)", () => {
  const bad = FARM_TARGETS.filter((x) => !x.spots.plain.length && !x.spots.tz.length && !x.warn).map((x) => x.id);
  assert.deepEqual(bad, []);
});

t("스팟이 있으면 근거가 있다 — tcPath(직접 잎) 또는 baseLevel(방어구 armo 밴드)", () => {
  // 방어구 유니크는 armo 밴드로 나와 직접 잎 경로가 없다 → 근거는 baseLevel(+SPOTS.armoMax 규칙). 그 외는 tcPath.
  const bad = FARM_TARGETS.filter((x) => (x.spots.plain.length || x.spots.tz.length) && !x.tcPath && !x.baseLevel).map((x) => x.id);
  assert.deepEqual(bad, []);
});

t("모든 목표에 evidence(왜 인기인가)가 있다", () => {
  assert.deepEqual(FARM_TARGETS.filter((x) => !x.evidence).map((x) => x.id), []);
});

t("룬워드 재료 목표는 선호 베이스(bases)를 1개 이상 갖는다 — '재료'만으로는 부족(사장님 지시)", () => {
  const bad = FARM_TARGETS.filter((x) => x.type === "runeword-mat")
    .filter((x) => !Array.isArray(x.bases) || x.bases.length === 0 || x.bases.some((b) => !b.kr))
    .map((x) => x.id);
  assert.deepEqual(bad, []);
});

t("참 룬 표시명 확정(2026-07-18 사장님) — 샴은 alias로만", () => {
  const cham = FARM_TARGETS.find((x) => x.id === "rune-cham");
  assert.equal(cham.kr, "참 룬");
  assert.ok(cham.alias.includes("샴 룬"), "검색 도달용으로 샴 룬은 alias에 유지");
});

t("SoJ 7곳 · 샤코는 armoNN 크랙으로 7곳 해결(2026-07-18 — round-1 '0곳' 정정)", () => {
  const soj = FARM_TARGETS.find((x) => x.id === "unique-soj");
  const shako = FARM_TARGETS.find((x) => x.id === "unique-shako");
  assert.equal(soj.spots.plain.length, 7);
  assert.equal(shako.spots.plain.length, 7, "샤코는 이제 데이터로 스팟 확정(warn/빈칸 아님)");
  assert.equal(shako.warn, null, "해결됐으므로 미해결 warn 없음");
  assert.equal(shako.baseLevel, 58, "방어구 유니크는 baseLevel(armor.json)로 판정");
});

t("방어구 유니크 규칙 — plain 스팟은 armoMax≥baseLevel AND mlvl≥qlvl (근거 있는 것만)", () => {
  // 방어구 유니크 = baseLevel 보유(직접 잎 아님). 표시한 plain이 두 게이트를 모두 만족하는지.
  const bad = [];
  for (const x of FARM_TARGETS.filter((x) => x.type === "unique" && x.baseLevel)) {
    for (const id of x.spots.plain) {
      const s = SPOTS[id];
      if (!(s.armoMax >= x.baseLevel)) bad.push(`${x.id}: ${id} armoMax ${s.armoMax} < baseLevel ${x.baseLevel}`);
      if (!(s.mlvl >= x.qlvl)) bad.push(`${x.id}: ${id} mlvl ${s.mlvl} < qlvl ${x.qlvl}`);
    }
  }
  assert.deepEqual(bad, []);
});

t("방어구 유니크 완결성 — 두 게이트를 만족하는 스팟은 빠짐없이 실렸다(임의 누락 금지)", () => {
  const bad = [];
  for (const x of FARM_TARGETS.filter((x) => x.type === "unique" && x.baseLevel)) {
    const expect = Object.entries(SPOTS).filter(([, s]) => s.armoMax >= x.baseLevel && s.mlvl >= x.qlvl).map(([id]) => id).sort();
    const got = [...x.spots.plain].sort();
    if (JSON.stringify(got) !== JSON.stringify(expect)) bad.push(`${x.id}: ${JSON.stringify(got)} ≠ 규칙 ${JSON.stringify(expect)}`);
  }
  assert.deepEqual(bad, []);
});

// ── ③ 링크 축 실존 (기획 §4-3 — 404 = 0) ─────────────────────────────────
t("links.runewords가 runewords.js에 실존한다", () => {
  const known = new Set(RW.map((r) => r.en));
  const bad = FARM_TARGETS.flatMap((x) => (x.links.runewords || []).filter((n) => !known.has(n)));
  assert.deepEqual(bad, []);
});

t("links.prices가 price-baseline.js에 실존한다", () => {
  const known = new Set(BASELINE.map((b) => b.key));
  const bad = FARM_TARGETS.filter((x) => x.links.prices && !known.has(x.links.prices)).map((x) => `${x.id} → ${x.links.prices}`);
  assert.deepEqual(bad, []);
});

t("links.grail이 grail-classic.js id로 실존한다(수집 체크가 물리는 키)", () => {
  const known = new Set(CLASSIC.map((c) => c.id));
  const bad = FARM_TARGETS.filter((x) => x.links.grail && !known.has(x.links.grail)).map((x) => `${x.id} → ${x.links.grail}`);
  assert.deepEqual(bad, []);
});

t("룬워드 재료 목표의 runes[]가 해당 룬워드의 실제 재료와 일치한다", () => {
  const bad = [];
  for (const t2 of FARM_TARGETS.filter((x) => x.type === "runeword-mat")) {
    const rw = RW.find((r) => r.en === t2.en);
    if (!rw) { bad.push(`${t2.id}: 룬워드 없음`); continue; }
    if (JSON.stringify(rw.runes) !== JSON.stringify(t2.runes)) bad.push(`${t2.id}: ${JSON.stringify(t2.runes)} ≠ ${JSON.stringify(rw.runes)}`);
  }
  assert.deepEqual(bad, []);
});

t("룬 코드 규약 — cube.js RUNES 순번이 곧 rNN (Ber=30번째=r30)", () => {
  const idx = (name) => RUNES.findIndex(([n]) => n === name) + 1;
  assert.equal(idx("Ber"), 30);
  assert.equal(idx("Jah"), 31);
  assert.equal(idx("Ist"), 24);
  // farm-targets의 itemCode가 이 규약과 어긋나지 않는지
  for (const [id, rune] of [["rune-ber", "Ber"], ["rune-jah", "Jah"], ["rune-ist", "Ist"]])
    assert.equal(FARM_TARGETS.find((x) => x.id === id).itemCode, `r${idx(rune)}`);
});

t("runewordsUsing/buildsUsing — 정본에서 실시간 도출(하드코딩 아님)", () => {
  assert.ok(runewordsUsing("Ber").includes("Enigma"));
  assert.ok(runewordsUsing("Ber").includes("Infinity"));
  assert.equal(buildsUsing("Enigma").length, 9); // planner E1 실측 9/14
  assert.equal(buildsUsing("Spirit").length, 8);
});

// ── ④ 검색 (기획 S5 — 10/10 도달) ────────────────────────────────────────
t("chosung — 한글 초성 추출", () => {
  assert.equal(chosung("베르 룬"), "ㅂㄹㄹ"); // 공백은 버린다
  assert.equal(chosung("수수께끼"), "ㅅㅅㄲㄲ"); // 4음절 → 초성 4개(된소리 초성 유지)
  assert.equal(chosung("자 룬"), "ㅈㄹ");
  assert.equal(chosung("Ber"), "Ber"); // 한글 아니면 그대로
});

t("검색 S5 — 전 목표 한글명으로 조회된다", () => {
  const miss = FARM_TARGETS.filter((x) => !searchTargets(x.kr).some((r) => r.id === x.id)).map((x) => x.id);
  assert.deepEqual(miss, []);
});

t("검색 S5 — 전 목표 영문명으로 조회된다", () => {
  const miss = FARM_TARGETS.filter((x) => !searchTargets(x.en).some((r) => r.id === x.id)).map((x) => x.id);
  assert.deepEqual(miss, []);
});

t("검색 S5 — 전 목표 초성으로 조회된다", () => {
  const miss = FARM_TARGETS.filter((x) => !searchTargets(chosung(x.kr)).some((r) => r.id === x.id)).map((x) => x.id);
  assert.deepEqual(miss, []);
});

t("검색 — 실사용 검색어가 목표에 닿는다", () => {
  const cases = [["고룬", "rune-ber"], ["조던링", "unique-soj"], ["샤코", "unique-shako"], ["에니그마", "rw-enigma"], ["텔포 갑옷", "rw-enigma"], ["용병 명상", "rw-insight"]];
  const miss = cases.filter(([q, id]) => !searchTargets(q).some((r) => r.id === id)).map(([q]) => q);
  assert.deepEqual(miss, []);
});

t("검색 — 빈 질의는 빈 결과(전체 덤프 금지)", () => {
  assert.deepEqual(searchTargets(""), []);
  assert.deepEqual(searchTargets("   "), []);
});

t("resolveSpots — 기획 §4-1 카드 형태로 전개되고 tzOnly가 구분된다", () => {
  const ber = FARM_TARGETS.find((x) => x.id === "rune-ber");
  const rows = resolveSpots(ber);
  assert.equal(rows.length, 7);
  assert.equal(rows.filter((r) => r.tzOnly).length, 2); // 카운테스·안다리엘은 TZ에서만
  const countess = rows.find((r) => r.spotId === "countess");
  assert.equal(countess.tzOnly, true);
  assert.equal(countess.areaKr, "잊힌 탑"); // zones.js 정본(2026-07-16 확정)
  assert.equal(countess.difficulty, "H");
});

t("지역 표기는 zones.js 정본을 쓴다 — 문자열 테이블 표기가 새어들면 잡는다", () => {
  // 2026-07-16 사장님 판정: 지역명은 zones.js 우선, localestrings-kor 표기는 채택하지 않음.
  const stringTable = ["타워 지하", "쓰론 오브", "머설리엄", "고대 하수도", "트라빈컬", "아케인 생츄어리", "니라트하크"];
  const data = JSON.stringify(FARM_TARGETS) + JSON.stringify(SPOTS);
  assert.deepEqual(stringTable.filter((s) => data.includes(s)), []);
});

t("SPOTS의 zoneKr는 zones.js에 실존하는 표기다(지역명 날조 방지)", () => {
  const known = new Set(TERROR_ZONES.flatMap((z) => [z.kr, ...z.areas.map((a) => a[0])]));
  const bad = Object.entries(SPOTS).filter(([, s]) => s.zoneKr && !known.has(s.zoneKr)).map(([id, s]) => `${id} → ${s.zoneKr}`);
  assert.deepEqual(bad, []);
});

// ── ⑤ 원본 스냅샷 (덤프 있을 때만 — master 독립 검증값) ───────────────────
const DUMP = path.join(process.cwd(), ".d2data", "treasureclassex.json");
if (fs.existsSync(DUMP)) {
  const tc = JSON.parse(fs.readFileSync(DUMP, "utf8"));
  console.log("\n  [원본 대조] .d2data/ 발견 — 덤프 스냅샷 검증");

  // 소스 = json/(전체·3.x Herald 포함). 사장님 판정 2026-07-16으로 json/base/(1138·285)에서 전환.
  t("TC 총수 1345 · Desecrated TC 334", () => {
    assert.equal(Object.keys(tc).length, 1345);
    assert.equal(Object.keys(tc).filter((k) => k.includes("Desecrated")).length, 334);
  });

  t("카운테스 재귀 — 비TZ는 Lo(r28)까지, 룬 전용 TC는 Ist(r24)까지", () => {
    assert.equal(maxRune(expandLeaves("Countess (H)", tc)), "r28");
    assert.equal(maxRune(expandLeaves("Countess Rune (H)", tc)), "r24");
  });

  t("카운테스 공포의 영역 — Desecrated A는 Cham(r32), D는 Zod(r33)", () => {
    assert.equal(maxRune(expandLeaves("Countess (H) Desecrated A", tc)), "r32");
    assert.equal(maxRune(expandLeaves("Countess (H) Desecrated D", tc)), "r33");
  });

  t("Ber·Jah는 각각 단 하나의 TC에만 직접 들어 있다", () => {
    assert.deepEqual(directParents("r30", tc), ["Runes 15"]);
    assert.deepEqual(directParents("r31", tc), ["Runes 16"]);
  });

  t("farm-targets의 tcPath가 원본에서 실제로 성립한다(근거 경로 날조 방지)", () => {
    const bad = [];
    for (const t2 of FARM_TARGETS) {
      if (!t2.tcPath) continue;
      const [root, ...rest] = t2.tcPath;
      const leaf = rest[rest.length - 1];
      const real = findPath(root, leaf, tc);
      if (JSON.stringify(real) !== JSON.stringify(t2.tcPath)) bad.push(`${t2.id}: 주장 ${JSON.stringify(t2.tcPath)} ≠ 실제 ${JSON.stringify(real)}`);
    }
    assert.deepEqual(bad, []);
  });

  t("farm-targets의 spots가 원본 TC 도달성과 일치한다(비TZ/TZ 구분 포함)", () => {
    const top = (t3) => {
      const g = tc[t3]?.group;
      if (g === undefined) return t3;
      const l = groupLadder(g, tc).filter((r) => r.tc.includes("(H)"));
      return l.length ? l[l.length - 1].tc : t3;
    };
    // 공포의 영역 지옥 몬스터 레벨 상한(desecratedzones expansion.hell bound_incl_max). qlvl 유니크의 TZ 도달 판정용.
    const TZ_MAX = 96;
    const bad = [];
    for (const t2 of FARM_TARGETS) {
      if (!t2.itemCode) continue; // 룬워드 재료·저급묶음은 tcPath 검증으로 충분
      if (t2.baseLevel) continue; // 방어구 유니크는 직접 잎이 아님(armo 밴드) — armoMax 규칙 테스트가 별도 검증
      const gate = t2.qlvl || 0; // 유니크는 qlvl로 plain/tz가 갈린다(룬은 gate=0 → 베이스 도달성으로)
      for (const id of t2.spots.plain) {
        const s = SPOTS[id];
        if (!expandLeaves(s.tc, tc).has(t2.itemCode)) bad.push(`${t2.id}: ${id} plain인데 원본에 베이스 경로 없음`);
        if (gate && s.mlvl < gate) bad.push(`${t2.id}: ${id} plain인데 mlvl ${s.mlvl} < qlvl ${gate}`);
      }
      for (const id of t2.spots.tz) {
        const s = SPOTS[id];
        if (gate) {
          // qlvl 유니크의 TZ전용 = 평시 레벨 미달(mlvl<qlvl)이나 공포의 영역 상승(qlvl≤TZ_MAX)으로 조건 도달 + 베이스 경로 존재.
          if (s.mlvl >= gate) bad.push(`${t2.id}: ${id} TZ전용 주장했으나 평시 mlvl ${s.mlvl} ≥ qlvl ${gate}(평시 가능해야 함)`);
          if (gate > TZ_MAX) bad.push(`${t2.id}: ${id} qlvl ${gate} > TZ 상한 ${TZ_MAX}(TZ로도 불가)`);
          const okBase = expandLeaves(s.tc, tc).has(t2.itemCode) || (s.tcTz && expandLeaves(top(s.tcTz), tc).has(t2.itemCode));
          if (!okBase) bad.push(`${t2.id}: ${id} 베이스 코드 경로 없음`);
        } else {
          // 룬: TZ전용 = 평시 미도달 + Desecrated 도달.
          if (expandLeaves(s.tc, tc).has(t2.itemCode)) bad.push(`${t2.id}: ${id} TZ전용 주장했으나 비TZ로도 도달`);
          if (s.tcTz && !expandLeaves(top(s.tcTz), tc).has(t2.itemCode)) bad.push(`${t2.id}: ${id} TZ 경로 없음`);
        }
      }
    }
    assert.deepEqual(bad, []);
  });

  t("방어구 코드 uap는 직접 잎이 아니다 — 그래서 armo 밴드 규칙을 쓴다(직접 도달성으로 판정하면 안 됨)", () => {
    assert.deepEqual(directParents("uap", tc), []);
    assert.equal(expandLeaves("Countess (H)", tc).has("uap"), false);
    // 대신 armo 밴드로 도달: Countess armoMax(66) ≥ Shako baseLevel(58) → 도달. 이것이 크랙의 핵심.
    assert.equal(SPOTS.countess.armoMax >= 58, true);
  });

  t("SPOTS.armoMax·weapMax가 원본 TC 전개의 최고 armo/weap 밴드와 일치한다(크랙 근거 — 매직넘버 아님)", () => {
    const bandMax = (leaves, pre) => Math.max(0, ...[...leaves].filter((c) => new RegExp(`^${pre}\\d+$`).test(c)).map((c) => +c.slice(pre.length)));
    const bad = [];
    for (const [id, s] of Object.entries(SPOTS)) {
      const lv = expandLeaves(s.tc, tc);
      const aM = bandMax(lv, "armo"), wM = bandMax(lv, "weap");
      if (s.armoMax !== aM) bad.push(`${id}: armoMax ${s.armoMax} ≠ 실제 ${aM}`);
      if (s.weapMax !== wM) bad.push(`${id}: weapMax ${s.weapMax} ≠ 실제 ${wM}`);
    }
    assert.deepEqual(bad, []);
  });

  t("방어구 유니크 baseLevel이 armor.json[code].level과 일치한다(날조 방지)", () => {
    const AR = path.join(process.cwd(), ".d2data", "armor.json");
    if (!fs.existsSync(AR)) { console.log("       (armor.json 없음 — 건너뜀)"); return; }
    const raw = JSON.parse(fs.readFileSync(AR, "utf8"));
    const arr = Array.isArray(raw) ? raw : Object.values(raw);
    const lvlOf = {};
    for (const a of arr) lvlOf[a.code] = a.level;
    const bad = [];
    for (const x of FARM_TARGETS.filter((x) => x.baseLevel)) {
      if (lvlOf[x.itemCode] !== x.baseLevel) bad.push(`${x.id}: baseLevel ${x.baseLevel} ≠ armor.json(${x.itemCode}) ${lvlOf[x.itemCode]}`);
    }
    assert.deepEqual(bad, []);
  });

  t("SPOTS.mlvl이 monstats Level(H)와 일치한다(유니크 qlvl 판정의 근거 — 매직넘버 아님)", () => {
    const MS = path.join(process.cwd(), ".d2data", "monstats.json");
    if (!fs.existsSync(MS)) { console.log("       (monstats.json 없음 — 건너뜀)"); return; }
    const raw = JSON.parse(fs.readFileSync(MS, "utf8"));
    const ms = Array.isArray(raw) ? raw : Object.values(raw);
    const lvl = {};
    for (const m of ms) if (m.Id) lvl[m.Id] = m["Level(H)"];
    const bad = [];
    for (const [id, s] of Object.entries(SPOTS)) {
      if (lvl[s.monId] !== s.mlvl) bad.push(`${id}: SPOTS ${s.mlvl} ≠ monstats(${s.monId}) ${lvl[s.monId]}`);
    }
    assert.deepEqual(bad, []);
  });

  t("안니·토치 qlvl 110 > 지옥 최고 몬스터 레벨(=99, 바알) — 일반 드롭 불가가 데이터로 성립", () => {
    const maxMlvl = Math.max(...Object.values(SPOTS).map((s) => s.mlvl));
    assert.equal(maxMlvl, 99);
    for (const x of FARM_TARGETS.filter((x) => x.uberOnly)) assert.ok(x.qlvl > maxMlvl);
  });
} else {
  console.log("\n  [원본 대조] .d2data/ 없음 — 덤프 스냅샷 건너뜀 (node scripts/extract-farm-data.mjs 로 받는다)");
}

console.log(failed === 0 ? "\n전부 통과" : `\n실패 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
