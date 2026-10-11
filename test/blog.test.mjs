// 블로그(cushaks 블로그에서 옮겨 온 디아2 글) 규칙 — 2026-10-11.
//
// 지키는 것:
//   ① 정리기(lib/blog-sanitize.js) — 본문을 dangerouslySetInnerHTML 로 그리므로 허용목록 밖(script·on*·style·javascript:)이
//      절대 남지 않는다. 같은 블로그의 디아2 글 링크는 /blog/<slug> 로, 이 사이트 옛 주소는 상대 경로로.
//   ② 생성 데이터 — 글마다 본문이 있고, 본문의 이미지는 public/ 에 실제로 있고, 디아블로4 글은 섞이지 않았다.
//   ③ 사이트맵·탭 — /blog 와 모든 글이 사이트맵에 있고, 탭에 블로그가 있다.

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sanitize, isD2Title, rewriteHref } from "../lib/blog-sanitize.js";
import { BLOG_META } from "../lib/blog-meta.js";
import { BLOG_CONTENT } from "../lib/blog-content.js";
import { SITE_PAGES } from "../lib/site-pages.js";
import { TABS } from "../lib/pages.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}

const ctx = {
  cafeHost: "cushaks.mycafe24.com",
  slugOfPath: (p) => (p === "/디아2-룬워드-정리" ? "디아2-룬워드-정리" : null),
  imageFor: (src) => (src.endsWith("/a.jpg") ? { src: "/blog-img/a.webp", w: 960, h: 540 } : null),
};

console.log("\n[블로그] 정리기");

t("script·iframe·광고(ins)·style 블록은 내용째 버린다", () => {
  const out = sanitize(`<p>a</p><script>alert(1)</script><iframe src="x"></iframe><ins class="adsbygoogle"></ins><style>p{}</style><p>b</p>`, ctx);
  assert.equal(out, "<p>a</p><p>b</p>");
});

t("on* 핸들러·style·class 속성은 남지 않는다", () => {
  const out = sanitize(`<p onclick="x()" style="color:red" class="c">t</p><img src="https://cushaks.mycafe24.com/a.jpg" onerror="x()">`, ctx);
  assert.ok(!/onclick|onerror|style=|class=/.test(out), out);
  assert.ok(out.includes('<img src="/blog-img/a.webp"'), out);
});

t("javascript: 링크는 href 를 버린다", () => {
  assert.equal(sanitize(`<a href="javascript:alert(1)">x</a>`, ctx), "<a>x</a>");
  assert.equal(rewriteHref("JavaScript:alert(1)", ctx), null);
});

t("같은 블로그의 디아2 글 → /blog/<slug>, 이 사이트 옛 주소 → 상대 경로, 외부 → 새 탭", () => {
  const enc = encodeURIComponent("디아2-룬워드-정리");
  assert.ok(sanitize(`<a href="http://cushaks.mycafe24.com/${enc}/">r</a>`, ctx).includes('href="/blog/디아2-룬워드-정리"'));
  assert.ok(sanitize(`<a href="https://diablo-dashboard-phi.vercel.app/terror-zone">t</a>`, ctx).includes('href="/terror-zone"'));
  assert.ok(sanitize(`<a href="http://example.com/x">e</a>`, ctx).includes('href="https://example.com/x" target="_blank" rel="noopener"'));
});

t("내려받지 못한 이미지는 태그째 버린다(깨진 그림을 싣지 않는다)", () => {
  assert.equal(sanitize(`<figure><img src="https://cushaks.mycafe24.com/missing.png"></figure>`, ctx), "<figure></figure>");
});

t("빈 문단(<p><br>…</p>)을 지운다", () => {
  assert.equal(sanitize(`<p><br><br>\n<br></p><p>x</p>`, ctx), "<p>x</p>");
});

t("디아2 제목 판정 — 띄어쓰기 변형 포함, 디아블로4 제외", () => {
  assert.equal(isD2Title("【래더 14 정손용딘 세팅】"), true);
  assert.equal(isD2Title("디아2 룬워드 총정리"), true);
  assert.equal(isD2Title("디아블로4 시즌15 룬워드 정리"), false);
  assert.equal(isD2Title("와우 포에버 베타 참여 방법"), false);
});

console.log("\n[블로그] 생성 데이터");

t("글이 있고 slug 가 유일하며 글마다 본문이 있다", () => {
  assert.ok(BLOG_META.length > 0);
  assert.equal(new Set(BLOG_META.map((p) => p.slug)).size, BLOG_META.length);
  assert.deepEqual(BLOG_META.filter((p) => !BLOG_CONTENT[p.slug]).map((p) => p.slug), []);
});

t("디아블로4 글이 섞이지 않았다", () => {
  assert.deepEqual(BLOG_META.filter((p) => !isD2Title(p.title)).map((p) => p.title), []);
});

t("본문 전체에 허용목록 밖 패턴이 없다", () => {
  const all = Object.values(BLOG_CONTENT).join("");
  assert.ok(!/<script|<iframe|\son[a-z]+=|style=|class=|javascript:/i.test(all));
});

t("본문·썸네일 이미지 파일이 public/ 에 실제로 있다", () => {
  const srcs = new Set();
  for (const html of Object.values(BLOG_CONTENT)) for (const m of html.matchAll(/<img src="([^"]+)"/g)) srcs.add(m[1]);
  for (const p of BLOG_META) if (p.thumb) srcs.add(p.thumb.src);
  const missing = [...srcs].filter((s) => !existsSync(join(ROOT, "public", s.replace(/^\//, ""))));
  assert.deepEqual(missing, []);
});

console.log("\n[블로그] 사이트 연결");

t("/blog 와 모든 글이 사이트맵에 있고, 탭에 블로그가 있다", () => {
  const paths = new Set(SITE_PAGES.map((p) => p.path));
  assert.ok(paths.has("/blog"));
  assert.deepEqual(BLOG_META.map((p) => `/blog/${encodeURIComponent(p.slug)}`).filter((p) => !paths.has(p)), []);
  assert.ok(TABS.some((t) => t.href === "/blog"));
});

console.log(`\n[블로그] ${pass}개 통과`);
