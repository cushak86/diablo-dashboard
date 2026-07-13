// 룬 순서(엘→조드)와 요구 레벨, 큐브 업그레이드 로직. cube·runewords 페이지 공용.
// (기존 app/cube/page.js에서 로직 이동 — 값·순서 무변경, D2R 3.2 정본.)

// 룬 순서(엘→조드)와 요구 레벨. 큐브 업그레이드 정본(D2R 3.2).
export const RUNES = [
  ["El", 11], ["Eld", 11], ["Tir", 13], ["Nef", 13], ["Eth", 15], ["Ith", 15],
  ["Tal", 17], ["Ral", 19], ["Ort", 21], ["Thul", 23], ["Amn", 25], ["Sol", 27],
  ["Shael", 29], ["Dol", 31], ["Hel", 33], ["Io", 35], ["Lum", 37], ["Ko", 39],
  ["Fal", 41], ["Lem", 43], ["Pul", 45], ["Um", 47], ["Mal", 49], ["Ist", 51],
  ["Gul", 53], ["Vex", 55], ["Ohm", 57], ["Lo", 59], ["Sur", 61], ["Ber", 63],
  ["Jah", 65], ["Cham", 67], ["Zod", 69],
];

// 결과 룬(index)을 만들 때 필요한 보석. index 0~9(엘~둔)은 보석 없음.
export const GEMS = [
  null, null, null, null, null, null, null, null, null, null,
  "조각난 황옥", "조각난 자수정", "조각난 사파이어", "조각난 루비", "조각난 에메랄드", "조각난 다이아몬드",
  "흠집난 황옥", "흠집난 자수정", "흠집난 사파이어", "흠집난 루비", "흠집난 에메랄드", "흠집난 다이아몬드",
  "황옥(일반)", "자수정(일반)", "사파이어(일반)", "루비(일반)", "에메랄드(일반)", "다이아몬드(일반)",
  "완벽에 가까운 황옥", "완벽에 가까운 자수정", "완벽에 가까운 사파이어", "완벽에 가까운 루비", "완벽에 가까운 에메랄드",
];

// 결과 룬 index를 만들 때 필요한 하위 룬 개수: index 1~20은 3개, 21~32(움~조드)는 2개.
export function needCount(i) {
  return i <= 20 ? 3 : 2;
}

// source 룬만으로 target 룬 1개를 만들 때: 필요한 source 개수 + 보석 목록(상위 등급부터).
export function combine(sourceIdx, targetIdx) {
  if (sourceIdx >= targetIdx) return null;
  const gems = [];
  let mult = 1; // 현재 층에서 만들어야 할 target 계열 룬 개수
  for (let k = targetIdx; k >= sourceIdx + 1; k--) {
    if (GEMS[k]) gems.push({ name: GEMS[k], count: mult });
    mult = mult * needCount(k);
  }
  return { runeCount: mult, gems };
}

// 룬 이름 → RUNES 인덱스.
const RUNE_INDEX = {};
RUNES.forEach(([name], i) => { RUNE_INDEX[name] = i; });

// 룬워드 구성 룬 배열에서 최고 룬을 찾아, El(0)부터 큐브로 만들 때의 총 소모량을 반환.
// 최고 룬이 El이거나 알 수 없는 룬이 있으면 null.
export function runewordCubeCost(runeNames) {
  let maxIdx = -1;
  for (const n of runeNames) {
    const i = RUNE_INDEX[n];
    if (i == null) return null;
    if (i > maxIdx) maxIdx = i;
  }
  if (maxIdx <= 0) return null;
  const res = combine(0, maxIdx);
  if (!res) return null;
  return {
    highest: RUNES[maxIdx][0],
    fromRune: RUNES[0][0],
    runeCount: res.runeCount,
    gems: res.gems,
  };
}
