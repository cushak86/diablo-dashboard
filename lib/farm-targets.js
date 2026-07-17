// 파밍 지도 — 인기 목표별 "어디서 나오나" 데이터층. 1차 10개(기획: work/farming-drop-guide/results/planner.md §5).
//
// 근거는 통념이 아니라 게임 데이터다. 모든 spots/tcPath는 blizzhackers/d2data 덤프의 treasureclassex를
// 재귀 전개해 얻었다 — 재생성·재검증: `node scripts/extract-farm-data.mjs` (덤프는 커밋하지 않는다).
//
// ⚠ 확률·드롭레이트는 이 파일에 없다(범위 밖). 여기서 답하는 것은 **"나올 수 있는가"(경로 존재)** 뿐이며,
//   "얼마나 자주 나오는가"가 아니다. Prob·NoDrop 값은 추출기가 읽지도 않는다.
// ⚠ 지역 한글 표기는 lib/zones.js를 정본으로 쓴다(2026-07-16 확정). 게임 문자열 테이블 표기는 채택하지 않는다.

import { RW } from "./runewords.js";
import { BUILDS } from "./builds.js";

// ── 파밍 스팟 ─────────────────────────────────────────────────────────────
// tc/tcTz = treasureclassex 진입점. tcTz는 공포의 영역(Desecrated) 진입 TC.
// areaId·tzZoneId가 null인 항목은 **덤프에 몬스터↔지역 링크가 없어** 데이터로 확정하지 못한 것이다(warn 참조).
export const SPOTS = {
  countess: {
    kr: "카운테스", en: "The Countess", // superuniques.json Name → localestrings-kor
    tc: "Countess (H)", tcTz: "Countess (H) Desecrated A",
    areaId: 25, areaEn: "Tower Cellar Level 5", // superuniques.json areaId=25 → levels.json
    zoneKr: "잊힌 탑", tzZoneId: "Act1-Tower", // zones.js 정본 · desecratedzones level_id 25 포함
    farmingId: "countess", warn: null,
  },
  andariel: {
    kr: "안다리엘", en: "Andariel", // monstats.json NameStr → localestrings-kor
    tc: "Andarielq (H)", tcTz: "Andarielq (H) Desecrated A",
    areaId: null, areaEn: null, zoneKr: null, tzZoneId: null,
    farmingId: "andy", warn: "지역 미확인 — 덤프에 몬스터↔지역 링크 필드가 없다",
  },
  mephisto: {
    kr: "메피스토", en: "Mephisto",
    tc: "Mephisto (H)", tcTz: "Mephisto (H) Desecrated A",
    areaId: null, areaEn: null, zoneKr: null, tzZoneId: null,
    farmingId: "meph", warn: "지역 미확인 — 덤프에 몬스터↔지역 링크 필드가 없다",
  },
  diablo: {
    kr: "디아블로", en: "Diablo",
    tc: "Diablo (H)", tcTz: "Diablo (H) Desecrated A",
    areaId: null, areaEn: "Chaos Sanctuary",
    zoneKr: "혼돈의 성역", tzZoneId: "Act4-ChaosSanctuary", // 지역은 app/farming/page.js DAILY "카오스 생츄어리 · 디아블로 런" + zones.js
    farmingId: "chaos", warn: "지역 근거가 덤프가 아니라 사내 정본(app/farming/page.js + lib/zones.js)이다",
  },
  baal: {
    kr: "바알", en: "Baal Crab", // monstats NameStr="Baal Crab" → kor "바알"
    tc: "Baal (H)", tcTz: "Baal (H) Desecrated",
    areaId: null, areaEn: null, zoneKr: null, tzZoneId: null,
    farmingId: null, warn: "지역 미확인 — 덤프에 몬스터↔지역 링크 필드가 없다",
  },
  pindleskin: {
    kr: "핀들스킨", en: "Pindleskin",
    tc: "Act 5 (H) Super Cx", tcTz: null, // superuniques.json TC(H) — Desecrated 진입 TC 없음
    areaId: 121, areaEn: "Nihlathak's Temple", // superuniques areaId=121 → levels.json
    zoneKr: "니흘라탁의 사원", tzZoneId: "Act5-Halls", // zones.js 정본 · desecratedzones level_id 121 포함
    farmingId: "pindle", warn: null,
  },
  cows: {
    kr: "비밀의 젖소방", en: "The Secret Cow Level", // zones.js 정본 (app/farming은 "비밀 소 레벨"로 표기 — 표기 상충)
    tc: "Cow (H)", tcTz: null,
    areaId: null, areaEn: "Moo Moo Farm", zoneKr: "비밀의 젖소방", tzZoneId: "Act1-MooMooFarm",
    farmingId: "cows", warn: "몬스터(Hell Bovine)의 지역은 zones.js 근거 — 덤프 직접 링크 아님",
  },
};

// ── 1차 목표 10개 ────────────────────────────────────────────────────────
// spots.plain = 공포의 영역 없이도 경로 있음 / spots.tz = 공포의 영역(Desecrated)에서만 경로 있음.
// tcPath = 근거 경로(추출기 findPath 실측). evidence = 왜 인기인가(planner §2 코드).
export const FARM_TARGETS = [
  {
    id: "rune-ber", kr: "베르 룬", en: "Ber Rune", type: "rune", itemCode: "r30",
    alias: ["베르 룬", "베르", "Ber", "Ber Rune", "r30", "고룬", "ㅂㄹ", "ㅂㄹㄹ"],
    spots: { plain: ["mephisto", "diablo", "baal", "pindleskin", "cows"], tz: ["countess", "andariel"] },
    tcPath: ["Act 3 (H) Good", "Runes 15", "r30"],
    links: { planner: true, cube: true, prices: "ber", terrorZone: true, grail: null },
    note: "베르는 게임의 드롭 표 전체에서 단 한 자리에만 들어 있고, 그 자리는 지옥 3막 이상의 표에서만 열립니다. 지옥 메피스토·디아블로·바알·핀들스킨·비밀의 젖소방은 공포의 영역이 아니어도 경로가 있지만, 카운테스와 안다리엘은 공포의 영역일 때만 베르에 닿습니다.",
    warn: null, evidence: "E1 최다 수요원(Enigma 9/14 + Infinity 5/14·2개 소모) · E2 HR 기준 통화",
  },
  {
    // 표시=통용명(price-baseline "자 룬"), alias에 문자열 테이블 정본("조 룬")·영문·초성 전부 — 2026-07-16 사장님 판정
    id: "rune-jah", kr: "자 룬", en: "Jah Rune", type: "rune", itemCode: "r31",
    alias: ["자 룬", "조 룬", "Jah", "Jah Rune", "r31", "고룬", "ㅈㄹ"],
    spots: { plain: ["mephisto", "diablo", "baal", "pindleskin", "cows"], tz: ["countess", "andariel"] },
    tcPath: ["Act 4 (H) Good", "Runes 16", "r31"],
    links: { planner: true, cube: true, prices: "jah", terrorZone: true, grail: null },
    note: "자 룬도 드롭 표에서 단 한 자리에만 있으며, 베르보다 한 단계 위인 지옥 4막 이상의 표에서 열립니다. 나오는 곳 자체는 베르와 같습니다.",
    warn: null,
    evidence: "E1 Enigma(9/14) 재료 · E2 HR",
  },
  {
    // 표시=통용명 "이스트 룬"(2026-07-16 사장님 판정 — 사내 통용명 정본 부재로 사장님이 확정).
    // alias에 문자열 테이블 표기("아이스트 룬")·영문·초성 전부.
    id: "rune-ist", kr: "이스트 룬", en: "Ist Rune", type: "rune", itemCode: "r24",
    alias: ["이스트 룬", "이스트", "아이스트 룬", "Ist", "Ist Rune", "r24", "ㅇㅅㅌ", "ㅇㅇㅅㅌ"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 12", "r24"],
    links: { planner: true, cube: true, prices: null, terrorZone: true, grail: null }, // price-baseline에 Ist 단품 항목이 없다(환산 단위로만 등장)
    note: "이스트는 조건이 낮은 표에 있어, 아래 모든 곳에서 공포의 영역 없이도 경로가 열립니다. 지옥 카운테스가 룬만 떨구는 표는 상한이 정확히 이스트입니다.",
    warn: null,
    evidence: "E2 — price-baseline 전 항목이 Ist 환산 단위(사실상 기축통화) · CTA 재료",
  },
  {
    id: "rw-enigma", kr: "수수께끼(Enigma) 재료", en: "Enigma", type: "runeword-mat", itemCode: null,
    alias: ["수수께끼", "에니그마", "Enigma", "텔포 갑옷", "ㅅㅅㄲ", "ㅇㄴㄱㅁ"],
    runes: ["Jah", "Ith", "Ber"],
    spots: { plain: ["mephisto", "diablo", "baal", "pindleskin", "cows"], tz: ["countess", "andariel"] },
    tcPath: ["Act 4 (H) Good", "Runes 16", "r31"], // 게이트를 정하는 Jah(r31) 기준
    links: { runewords: ["Enigma"], planner: true, cube: true, breakpoints: true, prices: "enigma", terrorZone: true },
    note: "재료 중 자 룬이 조건을 결정합니다(지옥 4막 이상). 나머지 재료는 저급 룬이라 제약이 되지 않습니다. 룬워드 자체는 드롭되지 않으므로, 재료 룬이 나오는 곳이 곧 답입니다.",
    warn: null, evidence: "E1 9/14 최다 · E2 S티어",
  },
  {
    // 표시는 mdb 정본("영혼" — 2026-07-17 사장님 "mdb가 무조건 맞다"). 옛 표기 "정신"은 alias로 남긴다:
    // 표기가 아니라 검색 도달 문제다(오늘 이스트 룬/아이스트 룬과 같은 처리).
    id: "rw-spirit", kr: "영혼(Spirit) 재료", en: "Spirit", type: "runeword-mat", itemCode: null,
    alias: ["영혼", "정신", "스피릿", "Spirit", "ㅇㅎ", "ㅈㅅ", "ㅅㅍㄹ"],
    runes: ["Tal", "Thul", "Ort", "Amn"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 6", "r11"], // 재료 중 게이트가 가장 높은 Amn(r11) 기준
    links: { runewords: ["Spirit"], planner: true, cube: true, breakpoints: true, prices: "spirit", terrorZone: true },
    note: "재료가 전부 저급 룬이라, 아래 모든 곳에서 공포의 영역 없이도 경로가 열립니다.",
    warn: null, evidence: "E1 8/14 · 초보 검색 최대층",
  },
  {
    id: "rw-call-to-arms", kr: "소집(CTA) 재료", en: "Call to Arms", type: "runeword-mat", itemCode: null,
    alias: ["소집", "콜투암스", "CTA", "Call to Arms", "ㅅㅈ", "ㅋㅌㅇ"],
    runes: ["Amn", "Ral", "Mal", "Ist", "Ohm"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 14", "r27"], // 재료 중 게이트가 가장 높은 Ohm(r27) 기준
    links: { runewords: ["Call to Arms"], planner: true, cube: true, breakpoints: true, prices: "call-to-arms", terrorZone: true },
    note: "재료 중 옴 룬의 조건이 가장 높지만, 그래도 아래 모든 곳이 공포의 영역 없이 도달합니다.",
    warn: null, evidence: "E1 8/14 · E2 A티어",
  },
  {
    id: "rw-infinity", kr: "무한(Infinity) 재료", en: "Infinity", type: "runeword-mat", itemCode: null,
    alias: ["무한", "인피니티", "Infinity", "ㅁㅎ", "ㅇㅍㄴㅌ"],
    runes: ["Ber", "Mal", "Ber", "Ist"],
    spots: { plain: ["mephisto", "diablo", "baal", "pindleskin", "cows"], tz: ["countess", "andariel"] },
    tcPath: ["Act 3 (H) Good", "Runes 15", "r30"],
    links: { runewords: ["Infinity"], planner: true, cube: true, breakpoints: true, prices: "infinity", terrorZone: true },
    note: "베르 룬을 2개 사용하며, 조건은 베르와 같습니다. 호라드릭 큐브 승급(수르 룬 2개 + 완벽 자수정)이 대체 경로입니다.",
    warn: null, evidence: "E1 5/14 · E2 S티어(Ber 2개)",
  },
  {
    id: "rw-insight", kr: "통찰(Insight) 재료", en: "Insight", type: "runeword-mat", itemCode: null,
    alias: ["통찰", "인사이트", "Insight", "용병 명상", "ㅌㅊ", "ㅇㅅㅇㅌ"],
    runes: ["Ral", "Tir", "Tal", "Sol"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 6", "r12"],
    links: { runewords: ["Insight"], planner: true, cube: true, breakpoints: true, prices: "insight", terrorZone: true },
    note: "재료가 전부 저급 룬이라 초반에도 모입니다. 용병에게 들려주는 룬워드입니다.",
    warn: null, evidence: "E1 5/14 · 용병 필수",
  },
  {
    // 파일럿 ① — 유니크 파이프라인 검증(성공). 반지 베이스 `rin`이 TC 잎으로 직접 등장한다.
    id: "unique-soj", kr: "조던의 돌 (SoJ)", en: "The Stone of Jordan", type: "unique", itemCode: "rin",
    alias: ["조던의 돌", "조던링", "SoJ", "더 스톤 오브 조던", "The Stone of Jordan", "ㅈㄷㄹ", "ㅈㄷㅇㄷ"],
    qlvl: 39, // uniqueitems.json lvl — 아이템 레벨이 이 값 이상이어야 생성 가능
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Jewelry A", "rin"],
    links: { planner: false, cube: false, prices: "stone-of-jordan", terrorZone: true, grail: "u:The Stone of Jordan (Ring)" },
    note: "반지는 드롭 표에 아이템 종류로 직접 등장해 경로를 따라갈 수 있습니다. 조던의 돌은 아이템 레벨 39 이상에서만 만들어지며, 아래 모든 곳이 그 조건을 넘습니다. 다만 어느 반지가 나올지는 확률의 문제라 이 탭의 범위가 아닙니다 — 여기서 답하는 것은 '이곳에서 나올 수 있는가'까지입니다.",
    warn: null, evidence: "E2 A티어 · 우버 디아블로(클론) 소환 재료",
  },
  {
    // 파일럿 ② — 유니크 파이프라인 검증(실패). 아래 warn이 2차 확장 판단의 근거다.
    id: "unique-shako", kr: "샤코 (어릿광대의 문장)", en: "Harlequin Crest", type: "unique", itemCode: "uap",
    alias: ["샤코", "어릿광대의 문장", "할리퀸 크레스트", "Shako", "Harlequin Crest", "ㅅㅋ", "ㅎㄹㅋ"],
    qlvl: 69, // uniqueitems.json lvl
    spots: { plain: [], tz: [] }, // ← 데이터로 채우지 못했다. 추측으로 채우지 않는다.
    tcPath: null,
    links: { planner: false, cube: false, prices: "harlequin-crest", terrorZone: false, grail: "u:Harlequin Crest (Shako)" },
    note: null,
    warn: "⚠️ 데이터로 스팟을 확정하지 못했다. 샤코 베이스 코드 `uap`는 1345개 TC 어디에도 잎으로 등장하지 않는다 — 방어구는 `armo3`~`armo66` 같은 레벨 의사코드로만 참조되고, 그 의사코드가 어떤 베이스를 내주는지의 규칙은 덤프에 없다(엔진 규칙). armor.json 조인으로 `uap`=Shako·helm·level 58까지는 확인했으나, 그 이상은 가정이 필요해 비워 둔다.",
    evidence: "E2 B티어 · 캐스터 국민템",
  },
];

// ── 조회 유틸 ─────────────────────────────────────────────────────────────

const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

/** 한글 문자열의 초성 추출. 한글이 아닌 문자는 그대로 둔다. ("베르 룬" → "ㅂㄹㄹ") */
export function chosung(str) {
  let out = "";
  for (const ch of String(str)) {
    const c = ch.charCodeAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) out += CHO[Math.floor((c - 0xac00) / 588)];
    else if (ch !== " ") out += ch;
  }
  return out;
}

/** 한글명·별칭·영문·초성으로 목표 검색. 대소문자·공백 무시. */
export function searchTargets(query, targets = FARM_TARGETS) {
  const q = String(query).trim().toLowerCase().replace(/\s+/g, "");
  if (!q) return [];
  return targets.filter((t) => {
    const hay = [t.kr, t.en, t.id, ...(t.alias || [])];
    return hay.some((h) => {
      const s = String(h).toLowerCase().replace(/\s+/g, "");
      return s.includes(q) || chosung(s).toLowerCase().includes(q);
    });
  });
}

/** 이 룬을 재료로 쓰는 룬워드 이름(runewords.js 정본에서 실시간 도출 — 하드코딩 금지). */
export function runewordsUsing(rune) {
  return RW.filter((r) => r.runes.includes(rune)).map((r) => r.en);
}

/** 이 룬워드를 keyRunewords로 채택한 빌드 id(builds.js 정본에서 실시간 도출). */
export function buildsUsing(runeword) {
  return BUILDS.filter((b) => (b.keyRunewords || []).includes(runeword)).map((b) => b.id);
}

/**
 * 목표의 spots를 기획 §4-1 카드 형태로 전개한다.
 * → [{ spotId, kr, areaKr, areaEn, areaId, difficulty, tzOnly, tzZoneId, tcPath, warn }]
 */
export function resolveSpots(target) {
  const rows = [];
  for (const [mode, ids] of [["plain", target.spots.plain], ["tz", target.spots.tz]]) {
    for (const id of ids) {
      const s = SPOTS[id];
      if (!s) continue;
      rows.push({
        spotId: id, kr: s.kr, areaKr: s.zoneKr, areaEn: s.areaEn, areaId: s.areaId,
        difficulty: "H", tzOnly: mode === "tz", tzZoneId: s.tzZoneId,
        tcPath: target.tcPath, warn: s.warn,
      });
    }
  }
  return rows;
}
