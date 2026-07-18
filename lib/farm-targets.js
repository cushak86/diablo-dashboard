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
    mlvl: 69, monId: "corruptrogue3", // monstats Level(H) — 슈퍼유니크(지역레벨과 별개)
    kr: "카운테스", en: "The Countess", // superuniques.json Name → localestrings-kor
    tc: "Countess (H)", tcTz: "Countess (H) Desecrated A",
    areaId: 25, areaEn: "Tower Cellar Level 5", // superuniques.json areaId=25 → levels.json
    zoneKr: "잊힌 탑", tzZoneId: "Act1-Tower", // zones.js 정본 · desecratedzones level_id 25 포함
    farmingId: "countess", warn: null,
  },
  andariel: {
    mlvl: 75, monId: "andariel",
    kr: "안다리엘", en: "Andariel", // monstats.json NameStr → localestrings-kor
    tc: "Andarielq (H)", tcTz: "Andarielq (H) Desecrated A",
    areaId: null, areaEn: null, zoneKr: null, tzZoneId: null,
    farmingId: "andy", warn: "지역 미확인 — 덤프에 몬스터↔지역 링크 필드가 없다",
  },
  mephisto: {
    mlvl: 87, monId: "mephisto",
    kr: "메피스토", en: "Mephisto",
    tc: "Mephisto (H)", tcTz: "Mephisto (H) Desecrated A",
    areaId: null, areaEn: null, zoneKr: null, tzZoneId: null,
    farmingId: "meph", warn: "지역 미확인 — 덤프에 몬스터↔지역 링크 필드가 없다",
  },
  diablo: {
    mlvl: 94, monId: "diablo",
    kr: "디아블로", en: "Diablo",
    tc: "Diablo (H)", tcTz: "Diablo (H) Desecrated A",
    areaId: null, areaEn: "Chaos Sanctuary",
    zoneKr: "혼돈의 성역", tzZoneId: "Act4-ChaosSanctuary", // 지역은 app/farming/page.js DAILY "카오스 생츄어리 · 디아블로 런" + zones.js
    farmingId: "chaos", warn: "지역 근거가 덤프가 아니라 사내 정본(app/farming/page.js + lib/zones.js)이다",
  },
  baal: {
    mlvl: 99, monId: "baalcrab",
    kr: "바알", en: "Baal Crab", // monstats NameStr="Baal Crab" → kor "바알"
    tc: "Baal (H)", tcTz: "Baal (H) Desecrated",
    areaId: null, areaEn: null, zoneKr: null, tzZoneId: null,
    farmingId: null, warn: "지역 미확인 — 덤프에 몬스터↔지역 링크 필드가 없다",
  },
  pindleskin: {
    mlvl: 85, monId: "reanimatedhorde5", // DefiledWarrior(핀들) Level(H)
    kr: "핀들스킨", en: "Pindleskin",
    tc: "Act 5 (H) Super Cx", tcTz: null, // superuniques.json TC(H) — Desecrated 진입 TC 없음
    areaId: 121, areaEn: "Nihlathak's Temple", // superuniques areaId=121 → levels.json
    zoneKr: "니흘라탁의 사원", tzZoneId: "Act5-Halls", // zones.js 정본 · desecratedzones level_id 121 포함
    farmingId: "pindle", warn: null,
  },
  cows: {
    mlvl: 81, monId: "hellbovine",
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
    // 말 룬 — price-baseline에 단품 카드가 없어 prices=null(Ist와 동일 처리).
    // 한글명 "말 룬"은 2026-07-18 사장님 확정(음차 관례·커뮤니티 통용. 정본 문자열 출처는 부재하나 사장님 권위로 확정).
    id: "rune-mal", kr: "말 룬", en: "Mal Rune", type: "rune", itemCode: "r23",
    alias: ["말 룬", "말", "Mal", "Mal Rune", "r23", "ㅁ", "ㅁㄹ"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 12", "r23"],
    links: { planner: true, cube: true, prices: null, terrorZone: true, grail: null },
    note: "말은 조건이 낮은 룬 표에 있어 아래 모든 곳에서 공포의 영역 없이도 경로가 열립니다. 소집·무한·비탄의 재료입니다.",
    warn: null, evidence: "A3 소집·A4 무한·A7 비탄 재료(E1 다수)",
  },
  {
    id: "rune-vex", kr: "벡스 룬", en: "Vex Rune", type: "rune", itemCode: "r26",
    alias: ["벡스 룬", "벡스", "Vex", "Vex Rune", "r26", "ㅂㅅ", "ㅂㅅㄹ"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 13", "r26"],
    links: { planner: true, cube: true, prices: "vex", terrorZone: true, grail: null },
    note: "벡스는 아래 모든 곳에서 공포의 영역 없이도 경로가 열립니다. 참나무의 심장·불사조의 재료입니다.",
    warn: null, evidence: "E2 HR 하위 고룬 통화 · 참나무의 심장 재료",
  },
  {
    id: "rune-ohm", kr: "옴 룬", en: "Ohm Rune", type: "rune", itemCode: "r27",
    alias: ["옴 룬", "옴", "Ohm", "Ohm Rune", "r27", "ㅇ", "ㅇㄹ"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 14", "r27"],
    links: { planner: true, cube: true, prices: "ohm", terrorZone: true, grail: null },
    note: "옴은 아래 모든 곳에서 공포의 영역 없이도 경로가 열립니다. 소집(CTA)과 피해증가 룬워드 다수의 재료입니다.",
    warn: null, evidence: "E2 HR 중상위 통화 · 소집 재료",
  },
  {
    id: "rune-lo", kr: "로 룬", en: "Lo Rune", type: "rune", itemCode: "r28",
    alias: ["로 룬", "로", "Lo", "Lo Rune", "r28", "ㄹ", "ㄹㄹ"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 14", "r28"],
    links: { planner: true, cube: true, prices: "lo", terrorZone: true, grail: null },
    note: "로는 아래 모든 곳에서 공포의 영역 없이도 경로가 열립니다. 불굴·비탄 등 치명타 룬워드의 재료입니다.",
    warn: null, evidence: "E2 HR · 불굴(5/14)·비탄(3/14) 재료",
  },
  {
    id: "rune-sur", kr: "수르 룬", en: "Sur Rune", type: "rune", itemCode: "r29",
    alias: ["수르 룬", "수르", "Sur", "Sur Rune", "r29", "ㅅㄹ"],
    spots: { plain: ["mephisto", "diablo", "baal", "pindleskin", "cows"], tz: ["countess", "andariel"] },
    tcPath: ["Runes 15", "r29"],
    links: { planner: true, cube: true, prices: "sur", terrorZone: true, grail: null },
    note: "수르는 조건이 높은 룬 표에 있어, 지옥 메피스토·디아블로·바알·핀들스킨·비밀의 젖소방은 공포의 영역이 아니어도 경로가 있지만, 카운테스와 안다리엘은 공포의 영역일 때만 닿습니다. 수르 2개 + 완벽 자수정으로 베르를 큐브 승급할 수 있습니다.",
    warn: null, evidence: "E2 HR · 베르 큐브 대체 경로",
  },
  {
    // 사이트 정본(price-baseline) 음차는 "샴 룬" — alias에 통용 "참 룬"도 넣어 검색 도달.
    id: "rune-cham", kr: "샴 룬", en: "Cham Rune", type: "rune", itemCode: "r32",
    alias: ["샴 룬", "샴", "참 룬", "참", "Cham", "Cham Rune", "r32", "ㅅ", "ㅊ", "ㅊㄹ"],
    spots: { plain: ["mephisto", "diablo", "baal", "pindleskin", "cows"], tz: ["countess", "andariel"] },
    tcPath: ["Runes 16", "r32"],
    links: { planner: true, cube: true, prices: "cham", terrorZone: true, grail: null },
    note: "샴도 조건이 높은 룬 표에 있어, 위 수르와 같은 곳에서 나옵니다 — 지옥 메피스토·디아블로·바알·핀들스킨·비밀의 젖소방은 공포의 영역 없이, 카운테스·안다리엘은 공포의 영역일 때. 얼지 않음 옵션이 필요할 때 씁니다.",
    warn: null, evidence: "E2 HR 특수 수요(얼지않음) · 안개·역병 재료",
  },
  {
    id: "rune-zod", kr: "조드 룬", en: "Zod Rune", type: "rune", itemCode: "r33",
    alias: ["조드 룬", "조드", "Zod", "Zod Rune", "r33", "ㅈㄷ"],
    spots: { plain: ["diablo", "baal", "pindleskin", "cows"], tz: ["countess", "andariel", "mephisto"] },
    tcPath: ["Runes 17", "r33"],
    links: { planner: true, cube: true, prices: "zod", terrorZone: true, grail: null },
    note: "조드는 가장 높은 조건의 룬 표에 있어, 지옥 디아블로·바알·핀들스킨·비밀의 젖소방만 공포의 영역 없이 닿고, 카운테스·안다리엘·메피스토는 공포의 영역일 때만 경로가 열립니다. 파괴 불가 옵션이 필요할 때 씁니다.",
    warn: null, evidence: "E2 HR 최고 번호(수요는 Ber보다 낮음)",
  },
  {
    id: "rune-low-set", kr: "저급 룬 (탈~돌)", en: "Low Runes", type: "rune", itemCode: null,
    alias: ["저급 룬", "하급 룬", "잡룬", "Tal", "Thul", "Ort", "Amn", "Ral", "Tir", "Sol", "Eth", "El", "Dol", "탈", "툴", "오르트", "암", "랄", "티르", "솔", "엘", "돌"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 6", "r11"], // 묶음 중 게이트가 가장 높은 Amn(r11) 기준
    links: { planner: true, cube: true, prices: null, terrorZone: true, grail: null },
    note: "정신·통찰·불굴 같은 초반 룬워드의 재료가 되는 저급 룬(탈·툴·오르트·암·랄·티르·솔·엣·엘·돌)은 조건이 낮아 아래 모든 곳에서 공포의 영역 없이도 나옵니다. 초반부터 자연히 모입니다.",
    warn: null, evidence: "A2 정신·A6 통찰·A5 불굴 재료 = 초보 검색 핵심층",
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
    // 표시=RW 정본 "인내"(2026-07-17 mdb 정본 원칙). 옛/통용 "불굴"은 alias로 검색 도달.
    id: "rw-fortitude", kr: "인내(Fortitude) 재료", en: "Fortitude", type: "runeword-mat", itemCode: null,
    alias: ["인내", "불굴", "포티튜드", "Fortitude", "ㅇㄴ", "ㅂㄱ", "ㅍㅌㅌㄷ"],
    runes: ["El", "Sol", "Dol", "Lo"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 14", "r28"], // 재료 중 게이트가 가장 높은 로(r28) 기준
    links: { runewords: ["Fortitude"], planner: true, cube: true, breakpoints: true, prices: "fortitude", terrorZone: true },
    note: "재료 중 로 룬이 조건을 결정하지만, 그래도 아래 모든 곳이 공포의 영역 없이 도달합니다. 나머지 재료는 저급 룬입니다.",
    warn: null, evidence: "E2 A티어 · 방어·물리 갑옷, 래더 초 인기",
  },
  {
    // 표시=RW 정본 "슬픔". 통용 "비탄"은 alias.
    id: "rw-grief", kr: "슬픔(Grief) 재료", en: "Grief", type: "runeword-mat", itemCode: null,
    alias: ["슬픔", "비탄", "그리프", "Grief", "ㅅㅍ", "ㅂㅌ", "ㄱㄹㅍ"],
    runes: ["Eth", "Tir", "Lo", "Mal", "Ral"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 14", "r28"], // 재료 중 게이트가 가장 높은 로(r28) 기준
    links: { runewords: ["Grief"], planner: true, cube: true, breakpoints: true, prices: "grief", terrorZone: true },
    note: "재료 중 로 룬이 조건을 결정하지만, 그래도 아래 모든 곳이 공포의 영역 없이 도달합니다. 페이즈 블레이드 등 무기 베이스가 필요합니다.",
    warn: null, evidence: "E1 · E2 S티어 물리 딜 최상위",
  },
  {
    // 표시=RW 정본 "참나무의 심장". 통용 "오크의 심장"은 alias.
    id: "rw-hoto", kr: "참나무의 심장(HotO) 재료", en: "Heart of the Oak", type: "runeword-mat", itemCode: null,
    alias: ["참나무의 심장", "오크의 심장", "오크심장", "호토", "HotO", "Heart of the Oak", "ㅊㄴㅁㅇㅅㅈ", "ㅇㅋㅅㅈ"],
    runes: ["Ko", "Vex", "Pul", "Thul"],
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Runes 13", "r26"], // 재료 중 게이트가 가장 높은 벡스(r26) 기준
    links: { runewords: ["Heart of the Oak"], planner: true, cube: true, breakpoints: true, prices: "heart-of-the-oak", terrorZone: true },
    note: "재료 중 벡스 룬이 조건을 결정하지만, 그래도 아래 모든 곳이 공포의 영역 없이 도달합니다. 지팡이·철퇴 베이스의 캐스터 무기입니다.",
    warn: null, evidence: "E1 · E2 A티어 캐스터 무기",
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
  {
    // 장신구 파이프라인 ✅ — 목걸이 베이스 amu가 TC 잎(Jewelry)으로 직접 등장. qlvl 80 필터로 spot을 가른다.
    id: "unique-mara", kr: "마라의 만화경", en: "Mara's Kaleidoscope", type: "unique", itemCode: "amu",
    alias: ["마라의 만화경", "마라", "마라 목걸이", "마라의 컬라이더스코프", "Mara", "Mara's Kaleidoscope", "ㅁㄹ", "ㅁㄹㅇㅁㅎㄱ"],
    qlvl: 80,
    // plain = 평시 몬스터 레벨 ≥ qlvl. tz = 평시 레벨 미달이나 공포의 영역 상승(≤96)으로 조건을 넘는 곳.
    spots: { plain: ["mephisto", "diablo", "baal", "pindleskin", "cows"], tz: ["countess", "andariel"] },
    tcPath: ["Jewelry A", "amu"],
    links: { planner: false, cube: false, prices: "maras-kaleidoscope", terrorZone: true, grail: "u:Mara's Kaleidoscope (Amulet)" },
    note: "목걸이는 드롭 표에 아이템 종류로 직접 등장합니다. 다만 마라는 아이템 레벨 80 이상에서만 만들어져, 몬스터 레벨이 80 이상인 지옥 메피스토(87)·디아블로(94)·바알(99)·핀들스킨(85)·비밀의 젖소방(81)에서 나올 수 있습니다. 카운테스(69)·안다리엘(75)은 일반 지옥 레벨이 80 미만이라, 공포의 영역으로 몬스터 레벨이 오를 때만 조건을 넘을 수 있습니다. 어느 목걸이가 나올지는 확률이라 이 탭의 범위가 아닙니다.",
    warn: null, evidence: "E2 B티어 · +2 전 스킬·전 저항 목걸이",
  },
  {
    // 참 파이프라인 ✅ — 거대 부적 베이스 cm3가 TC 잎(Jewelry). qlvl 70 필터.
    id: "unique-gheeds", kr: "기드의 행운", en: "Gheed's Fortune", type: "unique", itemCode: "cm3",
    alias: ["기드의 행운", "기드", "기드의 포츈", "Gheed", "Gheed's Fortune", "ㄱㄷ", "ㄱㄷㅇㅎㅇ"],
    qlvl: 70,
    spots: { plain: ["andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: ["countess"] },
    tcPath: ["Jewelry A", "cm3"],
    links: { planner: false, cube: false, prices: "gheeds-fortune", terrorZone: true, grail: "u:Gheed's Fortune (charm)" },
    note: "거대 부적은 드롭 표에 아이템 종류로 직접 등장합니다. 기드는 아이템 레벨 70 이상에서 만들어져, 몬스터 레벨이 70 이상인 지옥 안다리엘(75)·메피스토(87)·디아블로(94)·바알(99)·핀들스킨(85)·비밀의 젖소방(81)에서 나올 수 있습니다. 카운테스(69)는 일반 지옥 레벨이 70 미만이라 공포의 영역일 때만 조건을 넘을 수 있습니다.",
    warn: null, evidence: "E2 B티어 · MF·골드·상인가 대형 부적",
  },
  {
    // qlvl 110 — 지옥 최고 몬스터(바알 99)도 못 넘는다. 일반/공포의 영역 드롭 경로 없음(우버 전용). 데이터 확정 사실.
    id: "unique-annihilus", kr: "안니힐러스", en: "Annihilus", type: "unique", itemCode: "cm1",
    alias: ["안니힐러스", "안니", "어나이얼러스", "애니힐러스", "Annihilus", "ㅇㄴ", "ㅇㄴㅎㄹㅅ"],
    qlvl: 110, uberOnly: true, rewardSource: "우버 디아블로(디아블로 클론)",
    spots: { plain: [], tz: [] },
    tcPath: null,
    links: { planner: false, cube: false, prices: "annihilus", terrorZone: false, grail: "u:Annihilus (charm)" },
    note: null,
    warn: "우버 전용 — 아이템 레벨 110 요구(일반 사냥 몬스터는 지옥에서도 최고 99). 일반·공포의 영역 드롭 경로 없음. 우버 디아블로(디아블로 클론) 처치 보상 — 토치와 다른 이벤트.",
    evidence: "E2 S티어 · 소형 부적 전 스킬·능력치·저항",
  },
  {
    id: "unique-hellfire-torch", kr: "헬파이어 토치", en: "Hellfire Torch", type: "unique", itemCode: "cm2",
    alias: ["헬파이어 토치", "토치", "지옥불 횃불", "지옥의 횃불", "Hellfire Torch", "Torch", "ㅌㅊ", "ㅎㅍㅇㅇㅌㅊ"],
    qlvl: 110, uberOnly: true, rewardSource: "우버 트리스트람(펜데모니움 이벤트)",
    spots: { plain: [], tz: [] },
    tcPath: null,
    links: { planner: false, cube: false, prices: "hellfire-torch", terrorZone: false, grail: "u:Hellfire Torch (charm)" },
    note: null,
    warn: "우버 전용 — 아이템 레벨 110 요구(일반 사냥 몬스터는 지옥에서도 최고 99). 일반·공포의 영역 드롭 경로 없음. 우버 트리스트람(펜데모니움 이벤트) 처치 보상 — 안니와 다른 이벤트.",
    evidence: "E2 S티어 · 큰 부적 랜덤 스킬·저항",
  },

  // ── D1 확장: 인기 장신구(반지·목걸이) ─────────────────────────────────────
  // planner D1(스톰쉴드·그리폰 등)은 방어구라 armoNN 블로커로 스팟 미확정 → 제외. 대신 파이프라인이 깨끗한
  // 장신구를 추가한다(2026-07-18 사장님 판정). price-baseline 근거는 없어 evidence=사장님 판단+게임 통용 인기.
  // 스팟·qlvl은 SoJ·마라와 동일하게 추출기 실측(§5 덤프 대조가 검증). prices=null(baseline 카드 없음).
  {
    id: "unique-raven-frost", kr: "칠흑 서리", en: "Raven Frost", type: "unique", itemCode: "rin",
    alias: ["칠흑 서리", "레이븐 프로스트", "레이븐", "Raven Frost", "얼방 반지", "ㅊㅎㅅㄹ", "ㄹㅇㅂ"],
    qlvl: 53,
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Jewelry A", "rin"],
    links: { planner: false, cube: false, prices: null, terrorZone: true, grail: "u:Raven Frost (Ring)" },
    note: "반지는 드롭 표에 아이템 종류로 직접 등장합니다. 칠흑 서리는 아이템 레벨 53 이상에서 만들어지며, 아래 모든 곳이 그 조건을 넘습니다. 어느 반지가 나올지는 확률이라 이 탭의 범위가 아닙니다.",
    warn: null, evidence: "사장님 판단 · 얼지 않음+민첩 필수 반지(최다 착용)",
  },
  {
    id: "unique-highlords", kr: "대군주의 진노", en: "Highlord's Wrath", type: "unique", itemCode: "amu",
    alias: ["대군주의 진노", "하이로드의 진노", "하이로드의 래쓰", "하이로드", "Highlord's Wrath", "Highlords", "ㄷㄱㅈㅇㅈㄴ", "ㅎㅇㄹㄷ"],
    qlvl: 73,
    spots: { plain: ["andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: ["countess"] },
    tcPath: ["Jewelry A", "amu"],
    links: { planner: false, cube: false, prices: null, terrorZone: true, grail: "u:Highlord's Wrath (Amulet)" },
    note: "목걸이는 드롭 표에 아이템 종류로 직접 등장합니다. 대군주의 진노는 아이템 레벨 73 이상에서 만들어져, 몬스터 레벨이 73 이상인 지옥 안다리엘 이상에서 나올 수 있습니다. 카운테스(69)는 일반 지옥 레벨이 미달이라 공포의 영역일 때만 조건을 넘을 수 있습니다.",
    warn: null, evidence: "사장님 판단 · 공격속도+치명적공격+전스킬 목걸이 국민템",
  },
  {
    id: "unique-bul-kathos", kr: "불카토스의 결혼반지", en: "Bul Katho's Wedding Band", type: "unique", itemCode: "rin",
    alias: ["불카토스의 결혼반지", "불카토스", "발카서스의 웨딩 밴드", "불결반", "Bul-Kathos' Wedding Band", "Bul Katho's Wedding Band", "ㅂㅋㅌㅅ", "ㅂㄱㅂ"],
    qlvl: 66,
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Jewelry A", "rin"],
    links: { planner: false, cube: false, prices: null, terrorZone: true, grail: "u:Bul Katho's Wedding Band (Ring)" },
    note: "반지는 드롭 표에 아이템 종류로 직접 등장합니다. 불카토스의 결혼반지는 아이템 레벨 66 이상에서 만들어지며, 아래 모든 곳이 그 조건을 넘습니다.",
    warn: null, evidence: "사장님 판단 · +1 전 스킬·생명% 반지",
  },
  {
    id: "unique-nagelring", kr: "나겔링 반지", en: "Nagelring", type: "unique", itemCode: "rin",
    alias: ["나겔링 반지", "나겔링", "나겔", "Nagelring", "매법 반지", "ㄴㄱㄹ"],
    qlvl: 10,
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Jewelry A", "rin"],
    links: { planner: false, cube: false, prices: null, terrorZone: true, grail: "u:Nagelring (Ring)" },
    note: "반지는 드롭 표에 아이템 종류로 직접 등장합니다. 나겔링은 아이템 레벨 10 이상에서 만들어져, 아래 모든 곳이 조건을 넘습니다. 초반 매직 아이템 발견 확률(MF) 반지로 인기입니다.",
    warn: null, evidence: "사장님 판단 · MF 반지(초보 필수)",
  },
  {
    id: "unique-manald-heal", kr: "마날드 치유 반지", en: "Manald Heal", type: "unique", itemCode: "rin",
    alias: ["마날드 치유 반지", "마날드", "머날드 힐", "Manald Heal", "ㅁㄴㄷㅊㅇㅂㅈ", "ㅁㄴㄷ"],
    qlvl: 20,
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Jewelry A", "rin"],
    links: { planner: false, cube: false, prices: null, terrorZone: true, grail: "u:Manald Heal (Ring)" },
    note: "반지는 드롭 표에 아이템 종류로 직접 등장합니다. 마날드 치유 반지는 아이템 레벨 20 이상에서 만들어져, 아래 모든 곳이 조건을 넘습니다. 정전기 소서리스(FE 우회) 등으로 찾습니다.",
    warn: null, evidence: "사장님 판단 · 마나 흡수·정전기 반지",
  },
  {
    id: "unique-metalgrid", kr: "금속 격자", en: "Metalgrid", type: "unique", itemCode: "amu",
    alias: ["금속 격자", "메탈그리드", "메탈", "Metalgrid", "ㄱㅅㄱㅈ", "ㅁㅌㄱㄹㄷ"],
    qlvl: 85,
    spots: { plain: ["mephisto", "diablo", "baal", "pindleskin"], tz: ["countess", "andariel", "cows"] },
    tcPath: ["Jewelry A", "amu"],
    links: { planner: false, cube: false, prices: null, terrorZone: true, grail: "u:Metalgrid (amulet)" },
    note: "목걸이는 드롭 표에 아이템 종류로 직접 등장합니다. 금속 격자는 아이템 레벨 85 이상이라 조건이 높아, 몬스터 레벨이 85 이상인 지옥 메피스토·디아블로·바알·핀들스킨만 일반 조건을 넘습니다. 카운테스·안다리엘·비밀의 젖소방은 공포의 영역으로 레벨이 오를 때만 가능합니다.",
    warn: null, evidence: "사장님 판단 · +명중·전 저항·강철 골렘 소환 목걸이",
  },
  {
    id: "unique-atmas-scarab", kr: "아트마의 스카라베", en: "Atma's Scarab", type: "unique", itemCode: "amu",
    alias: ["아트마의 스카라베", "아트마의 스캐럽", "아트마", "Atma's Scarab", "증폭 목걸이", "ㅇㅌㅁ", "ㅇㅌㅁㅅㅋㄹㅂ"],
    qlvl: 60,
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Jewelry A", "amu"],
    links: { planner: false, cube: false, prices: null, terrorZone: true, grail: "u:Atma's Scarab (Amulet)" },
    note: "목걸이는 드롭 표에 아이템 종류로 직접 등장합니다. 아트마의 스카라베는 아이템 레벨 60 이상에서 만들어져, 아래 모든 곳이 조건을 넘습니다. 타격 시 대미지 증폭 발동으로 물리 파티에서 인기입니다.",
    warn: null, evidence: "사장님 판단 · 피해 증폭(Amplify Damage) 발동 목걸이",
  },
  {
    id: "unique-cats-eye", kr: "고양이 눈", en: "The Cat's Eye", type: "unique", itemCode: "amu",
    alias: ["고양이 눈", "캐츠 아이", "캣츠아이", "The Cat's Eye", "Cats Eye", "ㄱㅇㅇㄴ", "ㅋㅊㅇㅇ"],
    qlvl: 58,
    spots: { plain: ["countess", "andariel", "mephisto", "diablo", "baal", "pindleskin", "cows"], tz: [] },
    tcPath: ["Jewelry A", "amu"],
    links: { planner: false, cube: false, prices: null, terrorZone: true, grail: "u:The Cat's Eye (Amulet)" },
    note: "목걸이는 드롭 표에 아이템 종류로 직접 등장합니다. 고양이 눈은 아이템 레벨 58 이상에서 만들어져, 아래 모든 곳이 조건을 넘습니다. 공격 속도·달리기 속도·민첩 목걸이입니다.",
    warn: null, evidence: "사장님 판단 · 공속·이동속도·민첩 목걸이",
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
