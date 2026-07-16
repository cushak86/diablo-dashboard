// TC(treasureclassex) 재귀 전개 엔진 — 순수 함수만. I/O·네트워크 없음.
// 빌드타임 전용(덤프는 커밋하지 않는다 → scripts/extract-farm-data.mjs 참조).
// lib/이 아니라 여기 있는 이유: 앱이 import하지 않는다. 클라이언트 번들에 넣지 않기 위함.
//
// ⚠ 확률(Prob·NoDrop·*ItemProbTotal)은 읽지도 내지도 않는다 — 범위 밖.
//   이 엔진이 답하는 것은 "나올 수 있는가"(경로 존재)이지 "얼마나 나오는가"가 아니다.

/** TC 엔트리의 자식 = Item1..ItemN. Prob은 의도적으로 무시한다. */
export function childrenOf(entry) {
  const out = [];
  for (let i = 1; ; i++) {
    const v = entry[`Item${i}`];
    if (v === undefined) break;
    if (v !== "") out.push(String(v));
  }
  return out;
}

/**
 * root에서 재귀 전개해 잎(= TC가 아닌 아이템 코드) 집합을 구한다.
 * 순환 참조는 seen으로 차단(무한루프 방지).
 */
export function expandLeaves(root, tcMap) {
  const seen = new Set();
  const leaves = new Set();
  const walk = (name) => {
    if (seen.has(name)) return;
    seen.add(name);
    const entry = tcMap[name];
    if (!entry) { leaves.add(name); return; } // TC가 아니면 잎(아이템 코드)
    for (const child of childrenOf(entry)) walk(child);
  };
  walk(root);
  return leaves;
}

/** root → target까지의 TC 경로(근거 표시용). 없으면 null. 첫 발견 경로를 반환. */
export function findPath(root, target, tcMap) {
  const seen = new Set();
  const walk = (name, trail) => {
    if (seen.has(name)) return null;
    seen.add(name);
    const next = [...trail, name];
    if (name === target) return next;
    const entry = tcMap[name];
    if (!entry) return null;
    for (const child of childrenOf(entry)) {
      const hit = walk(child, next);
      if (hit) return hit;
    }
    return null;
  };
  return walk(root, []);
}

/** 잎 집합에서 최고 룬 코드(rNN). 룬이 없으면 null. */
export function maxRune(leaves) {
  let max = 0;
  for (const code of leaves) {
    const m = /^r(\d+)$/.exec(code);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max ? `r${max}` : null;
}

/** 특정 아이템 코드를 Item 필드에 직접 가진 TC 이름 목록(재귀 아님). */
export function directParents(code, tcMap) {
  return Object.keys(tcMap).filter((k) => childrenOf(tcMap[k]).includes(code));
}

/**
 * Desecrated 변형(A~F…)은 지역이 아니라 **몬스터 레벨 구간**이다.
 * 같은 group을 공유하고 level이 오름차순 — D2 표준 TC group/level 선택 규칙.
 * 주어진 group의 변형들을 level 오름차순으로 반환.
 */
export function groupLadder(group, tcMap) {
  return Object.keys(tcMap)
    .filter((k) => tcMap[k].group === group && typeof tcMap[k].level === "number")
    .map((k) => ({ tc: k, level: tcMap[k].level }))
    .sort((a, b) => a.level - b.level);
}
