// 공포의 영역 3단 폴백(live → stale → mock) 규칙 — 2026-09-05 사고("테러존 시간이 안 맞아")의 재발 방지.
//
// 사고: 상류(d2runewizard) 일시 장애 → 라우트가 모의 로테이션 반환 → ISR 캐시에 실림 →
// 사용자에게 지어낸 지역이 실데이터처럼 보임. 고친 규칙: 실패 시 「마지막 정상 응답 + 확인 시각」을
// 먼저 쓰고, 그것도 없을 때만 모의. 이 파일은 그 규칙의 순수 부분과 배선을 지킨다.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { rememberable, staleFrom } from "../lib/tz-fallback.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}

console.log("\n[공역 폴백] 순수 규칙");

const live = { mode: "live", provider: "d2runewizard", current: { kr: "트라빈칼", en: "Travincal", act: 3 }, next: { kr: "비전의 성역" } };

t("보관 가치 — live + current 일 때만", () => {
  assert.equal(rememberable(live), true);
  assert.equal(rememberable({ ...live, mode: "mock" }), false);
  assert.equal(rememberable({ ...live, mode: "stale" }), false);
  assert.equal(rememberable({ ...live, current: null }), false);
  assert.equal(rememberable(null), false);
});

t("staleFrom — 마지막 정상을 stale 로, 사유·확인 시각을 실어서", () => {
  const saved = { at: "2026-09-05T12:00:00.000Z", payload: live };
  const s = staleFrom(saved, "d2rw-503");
  assert.equal(s.mode, "stale");
  assert.equal(s.reason, "d2rw-503");
  assert.equal(s.staleAsOf, saved.at);
  assert.equal(s.current.kr, "트라빈칼");
  assert.equal(s.next.kr, "비전의 성역");
  assert.equal(live.mode, "live", "원본을 변형하면 안 된다 — 다음 요청의 보관본이 오염된다");
});

t("보관본이 못 쓸 꼴이면 null → 호출부가 모의로 간다", () => {
  assert.equal(staleFrom(null, "x"), null);
  assert.equal(staleFrom({ at: "t", payload: null }, "x"), null);
  assert.equal(staleFrom({ at: "t", payload: { mode: "live", current: null } }, "x"), null);
});

console.log("\n[공역 폴백] 배선 — 라우트와 화면이 stale 을 실제로 다룬다");

t("라우트가 staleFrom 을 쓰고, 실패 시 모의는 마지막 수단이다", () => {
  const src = readFileSync(join(ROOT, "app", "api", "terror-zone", "route.js"), "utf8");
  assert.ok(src.includes("staleFrom"), "라우트가 lib/tz-fallback 을 안 쓴다");
  assert.ok(src.includes("rememberable"), "정상 응답을 보관하지 않는다");
  assert.ok(/staleFrom[\s\S]*?mockPayload/.test(src), "stale 시도 후에 모의로 떨어져야 한다");
});

t("화면이 stale 을 구분해 표기한다(실시간·모의와 다른 칩)", () => {
  const page = readFileSync(join(ROOT, "app", "terror-zone", "page.js"), "utf8");
  assert.ok(page.includes('mode === "stale"') || page.includes("isStale"), "페이지에 stale 분기가 없다");
  assert.ok(page.includes("mode-stale"), "stale 전용 칩 클래스가 없다");
  const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
  assert.ok(css.includes(".mode-stale"), "globals.css 에 .mode-stale 이 없다");
});

console.log(`\n[공역 폴백] ${pass}개 통과`);
