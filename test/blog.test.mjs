// 블로그 로더 — frontmatter 파싱·목록·경로 안전성. 실행: node test/blog.test.mjs
import assert from "node:assert/strict";
import { getAllPosts, getPost, getPostSlugs } from "../lib/blog.js";

let failed = 0;
const t = (name, fn) => {
  try { fn(); console.log(`  ok  ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
};

t("포스트가 1개 이상 있고 slug는 파일명 규칙(a-z0-9-)", () => {
  const slugs = getPostSlugs();
  assert.ok(slugs.length >= 1, "content/blog에 글이 하나도 없다");
  for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/);
});

t("getPost — frontmatter(title·description·date)와 body를 분리한다", () => {
  const p = getPost("d2r-drop-location-guide");
  assert.ok(p, "첫 글이 로드돼야 한다");
  assert.ok(p.title && p.title.length > 5, "title 파싱");
  assert.ok(p.description && p.description.length > 10, "description 파싱");
  assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/, "date는 YYYY-MM-DD");
  assert.ok(!p.body.includes("---"), "본문에 frontmatter 구분선이 남으면 안 된다");
  assert.ok(p.body.includes("/drops"), "본문에 내부 링크(/drops)가 있어야 한다(상호링크)");
});

t("getPost — 경로 조작·미존재는 null(디렉터리 탈출 차단)", () => {
  assert.equal(getPost("../secret"), null);
  assert.equal(getPost("no-such-post"), null);
  assert.equal(getPost(""), null);
});

t("getAllPosts — 날짜 내림차순(최신순) 정렬", () => {
  const posts = getAllPosts();
  for (let i = 1; i < posts.length; i++) {
    assert.ok(posts[i - 1].date >= posts[i].date, "최신순 정렬이 깨졌다");
  }
});

console.log(failed === 0 ? "\n전부 통과" : `\n실패 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
