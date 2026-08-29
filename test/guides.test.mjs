// 가이드 글(lib/guides.js) 규칙 — 애드센스 "가치가 별로 없는 콘텐츠" 거절(2026-08-27)이 계기다.
//
// 지키는 것: 글은 얇으면 안 되고(한글 1,500자 이상), 두괄식 요약·질문형 H2·FAQ 구조여야 하며(CLAUDE.md §15),
// slug 가 유일해야 하고, 사이트맵(lib/site-pages.js)에 전부 실려야 한다 — 글을 써 놓고 색인 후보에서 새는 것을 막는다.

import assert from "node:assert/strict";
import { GUIDES } from "../lib/guides.js";
import { SITE_PAGES } from "../lib/site-pages.js";

let pass = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}
const textOf = (g) => [g.title, g.summary, ...g.sections.flatMap((s) => [s.h, ...s.p, ...(s.p2 || []), ...(s.list || []).flat(), ...(s.table?.rows || []).flat()]), ...(g.faq || []).flatMap((f) => [f.q, f.a])].join(" ");
const ko = (s) => (s.match(/[가-힣]/g) || []).length;

console.log("\n[가이드] 글 규칙");

t("글이 3편 이상 있고 slug 가 유일하다", () => {
  assert.ok(GUIDES.length >= 3, `${GUIDES.length}편`);
  assert.equal(new Set(GUIDES.map((g) => g.slug)).size, GUIDES.length);
  assert.ok(GUIDES.every((g) => /^[a-z0-9-]+$/.test(g.slug)), "slug 는 소문자·숫자·하이픈");
});

t("각 글이 한글 1,500자 이상이다 — 얇은 글은 없느니만 못하다", () => {
  const thin = GUIDES.filter((g) => ko(textOf(g)) < 1500).map((g) => `${g.slug}(${ko(textOf(g))}자)`);
  assert.deepEqual(thin, []);
});

t("구조 — 요약(40자+)·질문형 H2 3개 이상·FAQ 2개 이상·연관 도구 링크", () => {
  const bad = [];
  for (const g of GUIDES) {
    if (ko(g.summary) < 40) bad.push(`${g.slug}: 요약이 짧다`);
    if (g.sections.length < 3) bad.push(`${g.slug}: 섹션 ${g.sections.length}개`);
    if (!g.sections.every((s) => /\?$/.test(s.h.trim()))) bad.push(`${g.slug}: 질문형이 아닌 H2`);
    if (!(g.faq?.length >= 2)) bad.push(`${g.slug}: FAQ 부족`);
    if (!(g.related?.length >= 1)) bad.push(`${g.slug}: related 없음`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(g.date)) bad.push(`${g.slug}: date 형식`);
  }
  assert.deepEqual(bad, []);
});

t("사이트맵에 /guide 와 모든 글이 실려 있다", () => {
  const paths = new Set(SITE_PAGES.map((p) => p.path));
  assert.ok(paths.has("/guide"), "/guide 가 SITE_PAGES 에 없다");
  const missing = GUIDES.map((g) => `/guide/${g.slug}`).filter((p) => !paths.has(p));
  assert.deepEqual(missing, []);
});

t("가상의 전문가·통계를 인용하지 않는다(CLAUDE.md §15 단서)", () => {
  const bad = GUIDES.filter((g) => /전문가에 따르면|연구에 따르면|통계에 따르면|\d+%의 (유저|플레이어)/.test(textOf(g))).map((g) => g.slug);
  assert.deepEqual(bad, []);
});

console.log(`\n[가이드] ${pass}개 통과`);
