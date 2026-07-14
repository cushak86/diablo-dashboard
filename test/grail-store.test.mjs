// grail-store 테스트 — 사용자 체크가 걸린 코드다. 데이터가 조용히 사라지는 경로를 전부 고정한다.
// 실행: node test/grail-store.test.mjs
import assert from "node:assert/strict";
import { V1_KEY, V2_KEY, VERSION, hashIds, inScope, loadState, persist } from "../lib/grail-store.js";

// 신규 범위 id는 접두사로 판정(테스트용). 실제로는 COLLECT에서 파생한다.
const NEW = new Set(["u:New1", "rune:Ber", "rw:Infinity"]);
const scopeOf = (id) => (NEW.has(id) ? "new" : "classic");

const store = (init = {}) => {
  const m = new Map(Object.entries(init));
  return {
    read: (k) => (m.has(k) ? m.get(k) : null),
    write: (k, v) => m.set(k, v),
    dump: () => Object.fromEntries(m),
  };
};
const v2of = (s) => JSON.parse(s.dump()[V2_KEY]);
const v1of = (s) => JSON.parse(s.dump()[V1_KEY]);

let failed = 0;
const t = (name, fn) => {
  try { fn(); console.log(`  ok  ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
};

t("빈 저장소 — 기본 scope=new", () => {
  const s = store();
  const st = loadState(s.read, scopeOf);
  assert.deepEqual([...st.ids], []);
  assert.equal(st.scope, "new");
  assert.equal(st.readOnly, false);
});

t("v1 → v2 승격: ID 손실 0, scope=new (진행률 불변)", () => {
  const s = store({ [V1_KEY]: JSON.stringify(["u:New1", "rune:Ber"]) });
  const st = loadState(s.read, scopeOf);
  assert.equal(st.migrated, true);
  assert.deepEqual([...st.ids].sort(), ["rune:Ber", "u:New1"]);
  assert.equal(st.scope, "new");
  persist(s.write, st, scopeOf);
  assert.equal(v2of(s).version, VERSION);
  assert.deepEqual(v1of(s).sort(), ["rune:Ber", "u:New1"], "v1 투영이 유지돼야 한다");
  assert.equal(v2of(s).mirror, hashIds(v1of(s)));
});

t("persist — v2와 v1 투영을 함께 쓴다(클래식은 v1에 안 들어간다)", () => {
  const s = store();
  persist(s.write, { ids: new Set(["u:New1", "u:Classic1"]), scope: "all" }, scopeOf);
  assert.deepEqual(v2of(s).ids.sort(), ["u:Classic1", "u:New1"]);
  assert.deepEqual(v1of(s), ["u:New1"], "v1 투영은 신규 범위만");
});

// ── 재합류 4종 (critic #1) ──
t("재합류 ⓐ v1 없음 — v2 그대로", () => {
  const s = store({ [V2_KEY]: JSON.stringify({ version: 2, scope: "all", ids: ["u:Classic1"], mirror: hashIds([]) }) });
  const st = loadState(s.read, scopeOf);
  assert.deepEqual([...st.ids], ["u:Classic1"]);
  assert.ok(!st.rejoined);
});

t("재합류 ⓑ 해시 일치 — 구버전이 안 건드림 → v2 그대로", () => {
  const s = store();
  persist(s.write, { ids: new Set(["u:New1", "u:Classic1"]), scope: "all" }, scopeOf);
  const st = loadState(s.read, scopeOf);
  assert.deepEqual([...st.ids].sort(), ["u:Classic1", "u:New1"]);
  assert.ok(!st.rejoined);
});

t("재합류 ⓒ 구버전이 신규 항목을 **추가** 체크 → 반영", () => {
  const s = store();
  persist(s.write, { ids: new Set(["u:New1", "u:Classic1"]), scope: "all" }, scopeOf);
  // 구버전(v1만 아는 배포)이 rune:Ber를 추가로 체크
  s.write(V1_KEY, JSON.stringify(["u:New1", "rune:Ber"]));
  const st = loadState(s.read, scopeOf);
  assert.equal(st.rejoined, true);
  assert.deepEqual([...st.ids].sort(), ["rune:Ber", "u:Classic1", "u:New1"], "추가 체크 반영 + 클래식 보존");
});

t("재합류 ⓓ 구버전이 신규 항목을 **해제** → 해제도 반영(합집합이면 실패한다)", () => {
  const s = store();
  persist(s.write, { ids: new Set(["u:New1", "rune:Ber", "u:Classic1"]), scope: "all" }, scopeOf);
  // 구버전이 rune:Ber를 해제 (v1에서 사라짐)
  s.write(V1_KEY, JSON.stringify(["u:New1"]));
  const st = loadState(s.read, scopeOf);
  assert.equal(st.rejoined, true);
  assert.deepEqual([...st.ids].sort(), ["u:Classic1", "u:New1"], "해제가 반영돼야 한다 — 합집합이면 rune:Ber가 되살아난다");
  assert.equal(st.ids.has("u:Classic1"), true, "클래식 체크는 구버전이 몰라도 보존돼야 한다");
});

t("재합류 후 다시 persist하면 mirror가 갱신된다", () => {
  const s = store();
  persist(s.write, { ids: new Set(["u:New1", "u:Classic1"]), scope: "all" }, scopeOf);
  s.write(V1_KEY, JSON.stringify(["u:New1", "rune:Ber"]));
  const st = loadState(s.read, scopeOf);
  persist(s.write, st, scopeOf);
  const st2 = loadState(s.read, scopeOf);
  assert.ok(!st2.rejoined, "다시 읽으면 재합류가 발동하지 않아야 한다");
  assert.deepEqual([...st2.ids].sort(), ["rune:Ber", "u:Classic1", "u:New1"]);
});

// ── 미래 버전 방어 (critic #2) ──
t("미래 버전 — 읽기 전용, 쓰기 금지", () => {
  const s = store({ [V2_KEY]: JSON.stringify({ version: 3, scope: "all", ids: ["u:Future"], mirror: "x" }) });
  const st = loadState(s.read, scopeOf);
  assert.equal(st.readOnly, true);
  assert.equal(st.futureVersion, 3);
  assert.deepEqual([...st.ids], ["u:Future"], "표시는 하되");
  const wrote = persist(s.write, { ...st, ids: new Set(["u:New1"]) }, scopeOf);
  assert.equal(wrote, false, "쓰기를 거부해야 한다");
  assert.equal(v2of(s).version, 3, "원본이 보존돼야 한다");
});

t("깨진 v2 — v1로 폴백(원본 미삭제)", () => {
  const s = store({ [V2_KEY]: "{쓰레기", [V1_KEY]: JSON.stringify(["u:New1"]) });
  const st = loadState(s.read, scopeOf);
  assert.deepEqual([...st.ids], ["u:New1"]);
  assert.equal(s.dump()[V2_KEY], "{쓰레기", "원본을 지우지 않는다");
});

t("깨진 v1 — 무시하되 v2 유지", () => {
  const s = store();
  persist(s.write, { ids: new Set(["u:Classic1"]), scope: "all" }, scopeOf);
  s.write(V1_KEY, "{쓰레기");
  const st = loadState(s.read, scopeOf);
  assert.deepEqual([...st.ids], ["u:Classic1"]);
});

t("알 수 없는 id는 버리지 않는다(데이터 삭제 시 보존)", () => {
  const s = store({ [V2_KEY]: JSON.stringify({ version: 2, scope: "all", ids: ["u:Removed"], mirror: hashIds([]) }) });
  const st = loadState(s.read, scopeOf);
  assert.deepEqual([...st.ids], ["u:Removed"]);
});

t("inScope — new/classic/all", () => {
  assert.equal(inScope("new", "new"), true);
  assert.equal(inScope("classic", "new"), false);
  assert.equal(inScope("classic", "all"), true);
  assert.equal(inScope("new", "all"), true);
});

console.log(failed === 0 ? "\n전부 통과" : `\n실패 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
