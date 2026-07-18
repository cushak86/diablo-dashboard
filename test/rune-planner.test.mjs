// rune-planner 고정 테스트 10건 + prefix-Hall 크로스체크 오라클.
// 실행: node test/rune-planner.test.mjs   (의존성·설정 없음. Node 20.19+/22의 ESM 구문 감지에 의존)
import assert from "node:assert/strict";
import { RUNES, needCount } from "../lib/cube.js";
import { RW } from "../lib/runewords.js";
import { STATUS, aggregate, plan, planRuneword, suggest, sanitizeStock } from "../lib/rune-planner.js";

const IDX = {};
RUNES.forEach(([name], i) => { IDX[name] = i; });
const rw = (en) => RW.find((r) => r.en === en);
const need = (o) => new Map(Object.entries(o).map(([n, c]) => [IDX[n], c]));

// 룬 k의 El-환산 가치. 그리디와 독립적으로 유도한 오라클용.
const E = [1];
for (let k = 1; k < RUNES.length; k++) E[k] = E[k - 1] * needCount(k);

// prefix-Hall: 요구 룬 k는 등급 ≤k 재고로만 충족된다(상위→하위 분해 불가).
// ⇒ 충족 가능 ⟺ ∀t: Σ_{k≤t} E[k]·need[k] ≤ Σ_{k≤t} E[k]·stock[k]
function hallFeasible(needMap, inventory) {
  const stock = new Array(RUNES.length).fill(0);
  for (const [n, c] of Object.entries(inventory)) stock[IDX[n]] += c;
  let needSum = 0;
  let stockSum = 0;
  for (let t = 0; t < RUNES.length; t++) {
    needSum += E[t] * (needMap.get(t) || 0);
    stockSum += E[t] * stock[t];
    if (needSum > stockSum) return false;
  }
  return true;
}

const cases = [];
const T = (name, needMap, inventory, expect) => cases.push({ name, needMap, inventory, expect });

T("T1 즉시 — Steel", aggregate(rw("Steel").runes), { Tir: 1, El: 1 },
  (r) => {
    assert.equal(r.status, STATUS.READY);
    assert.deepEqual(r.gems, {});
    assert.deepEqual(r.consumed, { El: 1, Tir: 1 });
  });

T("T2 중복·즉시 — Bone (Um×2)", aggregate(rw("Bone").runes), { Sol: 1, Um: 2 },
  (r) => {
    assert.equal(r.status, STATUS.READY);
    assert.deepEqual(r.consumed, { Sol: 1, Um: 2 });
  });

T("T3 중복·부족 — Infinity (Ber×2)", aggregate(rw("Infinity").runes), { Ber: 1, Mal: 1, Ist: 1 },
  (r) => {
    assert.equal(r.status, STATUS.SHORT);
    assert.deepEqual(r.missing, [{ rune: "Ber", count: 1 }]);
  });

T("T4 경계 needCount=2 — Um ← Pul×2", need({ Um: 1 }), { Pul: 2 },
  (r) => {
    assert.equal(r.status, STATUS.CUBABLE);
    assert.deepEqual(r.gems, { "흠집난 다이아몬드": 1 });
    assert.deepEqual(r.consumed, { Pul: 2 });
  });

T("T5a 경계 needCount=3 — Pul ← Lem×2 (부족)", need({ Pul: 1 }), { Lem: 2 },
  (r) => {
    assert.equal(r.status, STATUS.SHORT);
    assert.deepEqual(r.missing, [{ rune: "Pul", count: 1 }]);
    assert.deepEqual(r.consumed, {}, "실패한 시도는 재고를 되돌려야 한다");
    assert.deepEqual(r.gems, {}, "실패한 시도는 보석도 되돌려야 한다");
  });

T("T5b 경계 needCount=3 — Pul ← Lem×3", need({ Pul: 1 }), { Lem: 3 },
  (r) => {
    assert.equal(r.status, STATUS.CUBABLE);
    assert.deepEqual(r.gems, { "흠집난 에메랄드": 1 });
    assert.deepEqual(r.consumed, { Lem: 3 });
  });

T("T6 혼합 등급 — Ber ← Sur1+Lo2 (combine()이 못 내는 답)", need({ Ber: 1 }), { Sur: 1, Lo: 2 },
  (r) => {
    assert.equal(r.status, STATUS.CUBABLE);
    assert.deepEqual(r.consumed, { Lo: 2, Sur: 1 });
    assert.deepEqual(r.gems, { "완벽에 가까운 자수정": 1, "완벽에 가까운 황옥": 1 });
  });

T("T7 다운그레이드 불가 — Sanctuary (Ist로 Mal을 못 만든다)", aggregate(rw("Sanctuary").runes), { Ko: 2, Ist: 1 },
  (r) => {
    assert.equal(r.status, STATUS.SHORT);
    assert.deepEqual(r.missing, [{ rune: "Mal", count: 1 }]);
  });

T("T9 재고 순차 반영 — Ber+Sur, 재고 전량 소비", need({ Ber: 1, Sur: 1 }), { Sur: 2, Lo: 1, Ohm: 2 },
  (r) => {
    assert.equal(r.status, STATUS.CUBABLE);
    assert.deepEqual(r.consumed, { Ohm: 2, Lo: 1, Sur: 2 });
  });

T("T10a 정수 안전 — Zod ← El 전량", need({ Zod: 1 }), { El: 14281868906496 },
  (r) => {
    assert.equal(r.status, STATUS.CUBABLE);
    assert.equal(r.consumed.El, 14281868906496);
    assert.equal(Number.isSafeInteger(r.consumed.El), true);
  });

T("T10b 정수 안전 — El 1개 부족", need({ Zod: 1 }), { El: 14281868906495 },
  (r) => {
    assert.equal(r.status, STATUS.SHORT);
    assert.deepEqual(r.missing, [{ rune: "Zod", count: 1 }]);
  });

// C1-1 부분 성공 후 실패 — 첫 Um은 합성되고 둘째에서 바닥나야 한다(같은 tier 반복 + 복원).
T("C1-1 부분 성공 후 실패 — Um×2 ← Pul×3", need({ Um: 2 }), { Pul: 3 },
  (r) => {
    assert.equal(r.status, STATUS.SHORT);
    assert.deepEqual(r.missing, [{ rune: "Um", count: 1 }]);
    assert.deepEqual(r.consumed, { Pul: 2 }, "성공한 첫 합성분만 소비돼야 한다");
    assert.deepEqual(r.gems, { "흠집난 다이아몬드": 1 }, "실패한 둘째 시도의 보석은 되돌아가야 한다");
  });

T("C1-2 재고 0·빈 재고 — 정상 SHORT", need({ Pul: 1 }), { Pul: 0, Lem: 0 },
  (r) => {
    assert.equal(r.status, STATUS.SHORT);
    assert.deepEqual(r.missing, [{ rune: "Pul", count: 1 }]);
  });

T("C1-3 빈 요구 — READY (계약 명시)", new Map(), { Ber: 1 },
  (r) => {
    assert.equal(r.status, STATUS.READY);
    assert.deepEqual(r.consumed, {});
  });

let failed = 0;
for (const c of cases) {
  const inventoryBefore = JSON.stringify(c.inventory);
  try {
    const result = plan(c.needMap, c.inventory);
    c.expect(result);
    // 오라클: 그리디 판정과 prefix-Hall 조건이 일치해야 한다.
    assert.equal(result.status !== STATUS.SHORT, hallFeasible(c.needMap, c.inventory),
      "prefix-Hall 오라클과 그리디 판정이 불일치");
    // 순수성: 입력 재고는 변형되지 않아야 한다(사본 위에서만 판정).
    assert.equal(JSON.stringify(c.inventory), inventoryBefore, "입력 재고가 변형됐다");
    console.log(`  ok  ${c.name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${c.name}\n       ${e.message}`);
  }
}

// T8 경쟁 — 각 룬워드는 단독 기준으로 판정된다(D2). 재고 사본을 안 쓰면 두 번째가 SHORT로 갈라진다.
try {
  const inv = { Ber: 2, Mal: 2, Ist: 1, Jah: 3, Sur: 1 };
  const inf = planRuneword(rw("Infinity"), inv);
  const lw = planRuneword(rw("Last Wish"), inv);
  assert.equal(inf.status, STATUS.READY);
  assert.equal(lw.status, STATUS.READY);
  // 그러나 동시 제작은 불가하다: Ber 합계 요구 3 > 재고 2. UI는 "각 항목은 단독 기준"을 명시해야 한다.
  assert.equal((inf.consumed.Ber || 0) + (lw.consumed.Ber || 0) > inv.Ber, true);
  console.log("  ok  T8 경쟁 — Infinity·Last Wish 둘 다 READY(단독 기준), 동시 제작은 불가");
} catch (e) {
  failed += 1;
  console.log(`  FAIL T8 경쟁\n       ${e.message}`);
}

// 계약 위반은 조용히 넘어가지 않고 던져야 한다.
// 특히 미지 룬을 skip하면 요구가 줄어 SHORT여야 할 룬워드가 READY로 뒤집힌다 → 사용자가 룬을 잘못 태운다.
const throwCases = [
  ["C2-1 미지 룬(요구) — 조용한 skip 금지", () => aggregate(["NotARune"])],
  ["C2-2 프로토타입 키(요구) — __proto__", () => aggregate(["__proto__"])],
  ["C2-3 프로토타입 키(요구) — toString", () => aggregate(["toString"])],
  ["C2-4 미지 룬(재고)", () => plan(need({ Pul: 1 }), { NotARune: 5 })],
  ["C2-5 음수 재고", () => plan(need({ Pul: 1 }), { Lem: -3 })],
  ["C2-6 소수 재고", () => plan(need({ Pul: 1 }), { Lem: 2.5 })],
  ["C2-7 NaN 재고", () => plan(need({ Pul: 1 }), { Lem: NaN })],
  ["C2-8 unsafe integer 재고", () => plan(need({ Pul: 1 }), { Lem: 2 ** 53 })],
  ["C2-9 범위 밖 tier 요구", () => plan(new Map([[99, 1]]), { El: 1 })],
  ["C2-10 음수 요구 수량", () => plan(new Map([[20, -1]]), { El: 1 })],
];
for (const [name, fn] of throwCases) {
  try {
    assert.throws(fn, RangeError);
    console.log(`  ok  ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${name}\n       ${e.message}`);
  }
}

// 미지 룬 오판 회귀: skip 방식이었다면 이 호출이 READY를 반환했다(요구가 통째로 사라져서).
try {
  assert.throws(() => planRuneword({ en: "Broken", runes: ["Ber", "Typo"] }, { Ber: 1 }), RangeError);
  console.log("  ok  C2-11 데이터 오타 룬워드 — READY 오판 대신 던진다");
} catch (e) {
  failed += 1;
  console.log(`  FAIL C2-11\n       ${e.message}`);
}

// 전체 화면 스모크: 룬워드 99종 × 재고 1벌.
const all = RW.map((r) => planRuneword(r, { Jah: 1, Ber: 2, Sur: 3, Lo: 4, Ohm: 5, El: 200 }));
console.log(`\n전체 ${RW.length}종 판정: READY ${all.filter((r) => r.status === STATUS.READY).length} · ` +
  `CUBABLE ${all.filter((r) => r.status === STATUS.CUBABLE).length} · SHORT ${all.filter((r) => r.status === STATUS.SHORT).length}`);

// ── suggest(): 제안 정렬·파생 필드 계약 ──
try {
  // 완성/큐브가능은 shortCount=0으로 맨 앞. 부족은 부족 개수 오름차순. Ber1개부족 < Ber2개부족.
  const inv = { Tir: 1, El: 1, Ber: 1, Mal: 1, Ist: 1 };
  const rows = suggest(RW, inv);
  // 순수성: 입력 재고 불변.
  assert.deepEqual(inv, { Tir: 1, El: 1, Ber: 1, Mal: 1, Ist: 1 }, "suggest가 입력 재고를 변형했다");
  // 모든 룬워드 포함.
  assert.equal(rows.length, RW.length);
  // 정렬 단조성: 상태 랭크(즉시0<큐브1<부족2)·shortCount 모두 비내림차순.
  const RANK = { [STATUS.READY]: 0, [STATUS.CUBABLE]: 1, [STATUS.SHORT]: 2 };
  for (let i = 1; i < rows.length; i++) {
    assert.equal(RANK[rows[i].status] >= RANK[rows[i - 1].status], true, "상태 랭크 정렬이 깨졌다");
    assert.equal(rows[i].shortCount >= rows[i - 1].shortCount, true, "shortCount 정렬이 깨졌다");
  }
  // Steel(Tir+El)은 재고로 즉시 → shortCount 0, usesOwned true, 맨 앞 그룹.
  const steel = rows.find((r) => r.rw.en === "Steel");
  assert.equal(steel.shortCount, 0);
  assert.equal(steel.usesOwned, true);
  assert.equal(steel.status, STATUS.READY);
  // Infinity(Ber×2 Mal Ist): Ber 1개 부족 → shortCount 1, 내 Ber·Mal·Ist 소비 → usesOwned true.
  const inf = rows.find((r) => r.rw.en === "Infinity");
  assert.equal(inf.shortCount, 1);
  assert.deepEqual(inf.missing, [{ rune: "Ber", count: 1 }]);
  assert.equal(inf.usesOwned, true);
  // 내 재고를 하나도 안 쓰는 룬워드는 usesOwned=false (필터로 걸러질 대상).
  const noneOwned = rows.find((r) => !r.usesOwned);
  assert.equal(Object.keys(noneOwned.consumed).length, 0, "usesOwned=false면 consumed가 비어야 한다");
  // distance 타이브레이크: 빈 재고에서 El 2개(Steel=Tir+El… 아니라) — Zod부족 > El부족 거리.
  const empty = suggest(RW, {});
  const zi = empty.findIndex((r) => r.rw.en === "Last Wish"); // Jah×3 Mal Sur Ber = 큰 거리
  const si = empty.findIndex((r) => r.rw.en === "Steel");     // Tir El = 작은 거리
  assert.equal(si < zi, true, "빈 재고에서 거리가 작은 Steel이 Last Wish보다 앞서야 한다");
  console.log("  ok  suggest — 정렬·shortCount·usesOwned·distance·순수성");
} catch (e) {
  failed += 1;
  console.log(`  FAIL suggest\n       ${e.message}`);
}

// ── sanitizeStock(): 오염된 localStorage를 렌더 죽이지 않게 정화 (codex 감사 대응) ──
try {
  assert.deepEqual(sanitizeStock(null), {}, "null → {}");
  assert.deepEqual(sanitizeStock([]), {}, "배열 → {}");
  assert.deepEqual(sanitizeStock("x"), {}, "문자열 → {}");
  assert.deepEqual(sanitizeStock({ El: "1" }), {}, "문자열 값 → 버림");
  assert.deepEqual(sanitizeStock({ El: 2.5 }), {}, "소수 → 버림");
  assert.deepEqual(sanitizeStock({ El: -1 }), {}, "음수 → 버림");
  assert.deepEqual(sanitizeStock({ El: 0 }), {}, "0 → 버림(앱은 0을 저장하지 않음)");
  assert.deepEqual(sanitizeStock({ El: NaN }), {}, "NaN → 버림");
  assert.deepEqual(sanitizeStock({ El: 2 ** 53 }), {}, "unsafe integer → 버림");
  assert.deepEqual(sanitizeStock({ NotARune: 3 }), {}, "미지 룬 → 버림");
  assert.deepEqual(sanitizeStock(JSON.parse('{"__proto__":5}')), {}, "프로토타입 키(JSON 경로) → 버림");
  assert.deepEqual(sanitizeStock({ Ber: 2, El: 1, Junk: 9, Ohm: 1.1 }), { Ber: 2, El: 1 },
    "유효 룬만 남기고 오염분 제거");
  // 정화된 결과는 suggest/planRuneword에 넣어도 throw하지 않아야 한다.
  const clean = sanitizeStock({ Ber: 1, Bad: "x" });
  assert.doesNotThrow(() => suggest(RW, clean));
  console.log("  ok  sanitizeStock — 오염 형태 방어(null·배열·문자열·소수·음수·미지룬·프로토타입)");
} catch (e) {
  failed += 1;
  console.log(`  FAIL sanitizeStock\n       ${e.message}`);
}

console.log(failed === 0 ? "\n전부 통과" : `\n실패 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
