// 룬 재고 → 제작 가능 룬워드 판정. 순수 함수 모듈(상태·부작용 없음).
// cube.js의 RUNES·GEMS·needCount만 재사용한다. combine()·runewordCubeCost()는 쓰지 않는다
// — 둘 다 source 등급이 하나뿐이라고 가정해서(cube.js:32,35 mult 스칼라 / :48-53 최고 룬만 추림)
//   "혼합 등급 재고 + 중복 룬 요구"라는 이 문제의 형태를 표현하지 못한다.
import { RUNES, GEMS, needCount } from "./cube.js";

// 룬 이름 → 인덱스(= 등급). cube.js의 RUNE_INDEX는 export가 없어 다시 만든다.
// Map인 이유: 평범한 객체면 "__proto__"·"toString" 같은 이름이 상속 프로퍼티에 걸려 미지 룬이 아닌 것처럼 보인다.
const IDX = new Map(RUNES.map(([name], i) => [name, i]));

export const STATUS = { READY: "READY", CUBABLE: "CUBABLE", SHORT: "SHORT" };

// 미지 룬은 조용히 건너뛰지 않고 던진다. 건너뛰면 요구가 줄어들어 SHORT여야 할 룬워드가 READY로 뒤집히고,
// 사용자는 못 만들 룬워드를 만들겠다고 룬을 태운다. 3.x 신규 7종의 runes 배열은 아직 미검증이라 실재 위험이다.
function idxOf(name) {
  const i = IDX.get(name);
  if (i === undefined) throw new RangeError(`알 수 없는 룬: ${String(name)}`);
  return i;
}

function checkCount(n, what) {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`${what}는 0 이상의 안전한 정수여야 한다: ${String(n)}`);
}

// 룬 이름 배열 → Map(인덱스 → 개수). 중복 룬이 기본 경로다(Infinity=Ber×2, Last Wish=Jah×3, Phoenix=Vex×2, Bone=Um×2, Sanctuary=Ko×2).
export function aggregate(runeNames) {
  const need = new Map();
  for (const name of runeNames) {
    const i = idxOf(name);
    need.set(i, (need.get(i) || 0) + 1);
  }
  return need;
}

// 재고 객체({룬이름: 개수}) → 인덱스 배열.
function toStock(inventory) {
  const stock = new Array(RUNES.length).fill(0);
  for (const [name, count] of Object.entries(inventory)) {
    checkCount(count, `재고(${name})`);
    stock[idxOf(name)] += count;
  }
  return stock;
}

// tier k 룬 d개를 재고에서 뽑아낸다(stock·gems를 변형). 부족하면 false.
// 원시 연산은 combine이 아니라 "한 단계 승급": 룬 k 1개 = 룬 k-1 needCount(k)개 + 보석 GEMS[k] 1개.
function fill(stock, gems, k, d) {
  const use = Math.min(stock[k], d);
  stock[k] -= use;
  d -= use;
  if (d === 0) return true;
  if (k === 0) return false; // El은 하위가 없어 합성 불가 — 여기가 바닥
  if (GEMS[k]) gems[GEMS[k]] = (gems[GEMS[k]] || 0) + d;
  const lower = d * needCount(k);
  // Zod 1개 = El 14,281,868,906,496개(2^53 미만)라 정상 요구는 안전하다. 넘으면 조용히 틀린 답 대신 던진다.
  if (!Number.isSafeInteger(lower)) throw new RangeError("요구량이 안전한 정수 범위를 넘었다");
  return fill(stock, gems, k - 1, lower);
}

// 요구 룬(Map 인덱스→개수)을 재고 사본 위에서 판정한다. 재고·요구는 변형되지 않는다.
export function plan(need, inventory) {
  const stock = toStock(inventory);
  const gems = {};
  const missing = [];
  let synth = 0;

  // 높은 등급부터. 순서는 결과(가능/불가)에 영향이 없지만(needCount가 tier에만 의존, cube.js:24-26),
  // consumed·gems 출력을 결정론적으로 만들기 위해 DESC로 고정한다.
  for (const r of [...need.keys()].sort((a, b) => b - a)) {
    if (!Number.isInteger(r) || r < 0 || r >= RUNES.length) throw new RangeError(`요구 룬 인덱스 범위 밖: ${String(r)}`);
    const want = need.get(r);
    checkCount(want, `요구(${RUNES[r][0]})`);
    const have = Math.min(stock[r], want);
    stock[r] -= have;

    for (let u = 1; u <= want - have; u++) {
      const trialStock = stock.slice();
      const trialGems = { ...gems };
      if (fill(stock, gems, r, 1)) {
        synth += 1;
      } else {
        // 낱개 1개가 실패하면 남은 것도 전부 실패한다(재고는 단조 감소).
        stock.splice(0, stock.length, ...trialStock);
        for (const key of Object.keys(gems)) delete gems[key];
        Object.assign(gems, trialGems);
        missing.push({ rune: RUNES[r][0], count: want - have - u + 1 });
        break;
      }
    }
  }

  const consumed = {};
  const before = toStock(inventory);
  before.forEach((n, i) => {
    if (n > stock[i]) consumed[RUNES[i][0]] = n - stock[i];
  });

  let status;
  if (missing.length > 0) status = STATUS.SHORT;
  else if (synth === 0) status = STATUS.READY;
  else status = STATUS.CUBABLE;

  return { status, missing, gems, consumed };
}

// 룬워드 1개 판정. 각 룬워드는 재고 사본 위에서 단독으로 평가된다
// (여러 룬워드를 동시에 만들 수 있는지는 별개 문제 — 화면에 "각 항목은 단독 기준"을 명시할 것).
export function planRuneword(rw, inventory) {
  return plan(aggregate(rw.runes), inventory);
}
