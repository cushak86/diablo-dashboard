// backup 모듈 테스트 — 검증(거부)이 핵심. 외부 JSON을 내부 상태로 쓰는 경로라 통과시키는 것보다 막는 게 중요하다.
// 실행: node test/backup.test.mjs
import assert from "node:assert/strict";
import { APP, VERSION, MAX_BYTES, KEYS, buildExport, summarize, parseImport, applyImport } from "../lib/backup.js";

// 가짜 저장소
const store = (init = {}) => {
  const m = new Map(Object.entries(init));
  return {
    read: (k) => (m.has(k) ? m.get(k) : null),
    write: (k, v) => m.set(k, v),
    dump: () => Object.fromEntries(m),
  };
};

const SAMPLE = {
  "grail:v1": JSON.stringify(["rune:Ber", "rw:Infinity"]),
  "farm:v1": JSON.stringify({ countess: "2026-07-13", cows: "2026-W28" }),
  "fav:rw": JSON.stringify(["Infinity"]),
  "fav:ni": JSON.stringify([]),
  "runes:v1": JSON.stringify({ Ber: 2, Jah: 3 }),
};

let failed = 0;
const t = (name, fn) => {
  try { fn(); console.log(`  ok  ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
};

t("export — 5개 키를 담고 포맷 헤더를 붙인다", () => {
  const s = store(SAMPLE);
  const out = buildExport(s.read, "2026-07-13T00:00:00Z");
  assert.equal(out.app, APP);
  assert.equal(out.version, VERSION);
  assert.equal(out.exportedAt, "2026-07-13T00:00:00Z");
  assert.deepEqual(Object.keys(out.data).sort(), KEYS.map((k) => k.key).sort());
});

t("export — 없는 키는 담지 않는다(부분 상태 정상)", () => {
  const s = store({ "fav:rw": JSON.stringify(["Enigma"]) });
  const out = buildExport(s.read, "t");
  assert.deepEqual(Object.keys(out.data), ["fav:rw"]);
});

t("export — 깨진 값은 백업에 담지 않는다", () => {
  const s = store({ ...SAMPLE, "grail:v1": "{쓰레기" });
  const out = buildExport(s.read, "t");
  assert.equal("grail:v1" in out.data, false);
});

t("round-trip — export → import → 동일 복원", () => {
  const src = store(SAMPLE);
  const text = JSON.stringify(buildExport(src.read, "t"));
  const parsed = parseImport(text);
  assert.equal(parsed.ok, true);
  const dst = store();
  assert.equal(applyImport(parsed, dst.write), 5);
  assert.deepEqual(dst.dump(), SAMPLE);
});

t("summarize — 키별 개수", () => {
  const s = store(SAMPLE);
  const sum = summarize(s.read);
  assert.equal(sum.find((x) => x.key === "grail:v1").count, 2);
  assert.equal(sum.find((x) => x.key === "runes:v1").count, 2);
  assert.equal(sum.find((x) => x.key === "fav:ni").count, 0);
});

// ── 거부해야 하는 입력들 ──
const rejects = [
  ["빈 문자열", ""],
  ["JSON이 아님", "not json"],
  ["최상위가 배열", "[1,2,3]"],
  ["다른 앱의 백업", JSON.stringify({ app: "other", version: 1, data: { "fav:rw": [] } })],
  ["버전 없음", JSON.stringify({ app: APP, data: { "fav:rw": [] } })],
  ["미래 버전", JSON.stringify({ app: APP, version: VERSION + 1, data: { "fav:rw": [] } })],
  ["data 없음", JSON.stringify({ app: APP, version: 1 })],
  ["알려진 키가 하나도 없음", JSON.stringify({ app: APP, version: 1, data: { junk: [1] } })],
  ["grail이 배열이 아님", JSON.stringify({ app: APP, version: 1, data: { "grail:v1": { a: 1 } } })],
  ["grail 원소가 문자열이 아님", JSON.stringify({ app: APP, version: 1, data: { "grail:v1": [1, 2] } })],
  ["farm 값이 문자열이 아님", JSON.stringify({ app: APP, version: 1, data: { "farm:v1": { a: 1 } } })],
  ["룬 재고가 음수", JSON.stringify({ app: APP, version: 1, data: { "runes:v1": { Ber: -1 } } })],
  ["룬 재고가 상한 초과", JSON.stringify({ app: APP, version: 1, data: { "runes:v1": { Ber: 100 } } })],
  ["룬 재고가 소수", JSON.stringify({ app: APP, version: 1, data: { "runes:v1": { Ber: 1.5 } } })],
  ["크기 초과", JSON.stringify({ app: APP, version: 1, data: { "fav:rw": ["x".repeat(MAX_BYTES)] } })],
];
for (const [name, text] of rejects) {
  t(`거부 — ${name}`, () => {
    const r = parseImport(text);
    assert.equal(r.ok, false, "거부해야 한다");
    assert.equal(typeof r.error, "string");
    assert.ok(r.error.length > 0, "사용자가 읽을 수 있는 사유가 있어야 한다");
  });
}

t("원자성 — 한 키라도 형식이 틀리면 나머지도 쓰지 않는다", () => {
  const dst = store();
  const bad = JSON.stringify({
    app: APP, version: 1,
    data: { "fav:rw": ["Infinity"], "runes:v1": { Ber: 999 } }, // 두 번째가 불량
  });
  const parsed = parseImport(bad);
  assert.equal(parsed.ok, false);
  assert.throws(() => applyImport(parsed, dst.write));
  assert.deepEqual(dst.dump(), {}, "아무것도 쓰이지 않아야 한다");
});

t("알 수 없는 키는 무시하되 경고로 표면화한다", () => {
  const text = JSON.stringify({ app: APP, version: 1, data: { "fav:rw": ["Enigma"], "evil:key": 1 } });
  const parsed = parseImport(text);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.unknownKeys, ["evil:key"]);
  const dst = store();
  applyImport(parsed, dst.write);
  assert.deepEqual(Object.keys(dst.dump()), ["fav:rw"], "알 수 없는 키는 쓰이지 않아야 한다");
});

t("백업에 없는 키는 건드리지 않는다(부분 백업 복원)", () => {
  const dst = store({ "grail:v1": JSON.stringify(["기존"]) });
  const parsed = parseImport(JSON.stringify({ app: APP, version: 1, data: { "fav:rw": ["Enigma"] } }));
  applyImport(parsed, dst.write);
  assert.deepEqual(JSON.parse(dst.dump()["grail:v1"]), ["기존"], "기존 그레일 진행이 보존돼야 한다");
});

console.log(failed === 0 ? "\n전부 통과" : `\n실패 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
