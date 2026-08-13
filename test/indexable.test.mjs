// 색인 후보 집합 검사 — 「사이트맵에 실릴 페이지」와 「실제로 존재하는 페이지」가 갈리지 않게.
//
// 왜 (2026-08-11, 16회차 감사):
//   lib/site-pages.js 는 SITE_PAGES 를 사이트맵·llms.txt·JSON-LD 의 단일 정본으로 두어 **그 셋이**
//   갈라지는 것은 막았다. 그런데 **그 표 자체가 app/ 의 실제 라우트와 갈리는 것**은 아무도 안 봤다.
//   제외 정책은 파일 맨 아래 주석 한 줄이었고, 주석은 아무것도 강제하지 않는다.
//
//   이 결함은 조용하다. 새 공개 페이지는 200 으로 뜨고 링크도 걸린다 — 404 가 아니니 경보가 없다.
//   다만 사이트맵에 없어서 크롤러에게 "발견" 신호가 안 가고, llms.txt 에 없어서 AI 에게도 없는
//   페이지가 된다. 화면 어디에도 그 사실이 나타나지 않는다.
//   판정 지표 ①이 「색인된 페이지 수」인데, 그 분자가 아니라 **모수가 조용히 새고 있었다.**
//
//   같은 부류를 예산플래너는 이미 기계로 막고 있다(볼트 라우트 드리프트 검사, 2026-08-09 — 실제
//   폴더를 읽어 목록과 대조). 검사가 한 저장소에만 있으면 나머지에서 같은 사고가 그대로 난다.
//
// ⚠️ 빌드 산출물로 재지 않는 이유(2026-08-11 실측):
//   `.next/server/app` 에는 .html 이 11개뿐인데 SITE_PAGES 는 15개다(/build·/drops·/rune-plan·
//   /about·/privacy 가 없다). 빌드 산출물로 고아를 세면 **거짓 고아 4~5건**이 나온다.
//   그래서 링크 도달성은 정본(TABS + layout.js)에서 재고, 라우트 집합은 app/ 폴더에서 읽는다.
//   같은 날 라이브 크롤로 교차 확인했다 — 사이트맵 15개 전부 인바운드 ≥ 1, 고아 0.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_PAGES, EXCLUDED_PATHS } from "../lib/site-pages.js";
import { TABS } from "../lib/pages.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0;
const fails = [];
function check(name, ok) {
  if (ok) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name}`); fails.push(name); }
}

/** app/ 아래 실제 라우트. page.js 가 있는 폴더가 곧 하나의 URL 이다. 라우트 그룹 `(x)` 는 URL 에 안 들어간다. */
function routes(dir = join(ROOT, "app"), base = "") {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      // api 는 페이지가 아니다. _ 로 시작하는 것은 Next 내부(_not-found 등).
      if (e.name === "api" || e.name.startsWith("_")) continue;
      const seg = e.name.startsWith("(") && e.name.endsWith(")") ? "" : `/${e.name}`;
      out.push(...routes(join(dir, e.name), base + seg));
    } else if (e.name === "page.js" || e.name === "page.jsx") {
      out.push(base || "/");
    }
  }
  return out;
}

const actual = routes().sort();
const listed = [...SITE_PAGES.map((p) => p.path), ...EXCLUDED_PATHS].sort();

console.log(`\n[집합] app/ 의 모든 라우트가 색인할지 말지를 밝힌다 (실제 ${actual.length}개)`);
{
  // 어느 쪽에도 없는 라우트 = 새로 만들고 아무 데도 등록 안 한 페이지. 이게 이 파일의 존재 이유다.
  const unlisted = actual.filter((r) => !listed.includes(r));
  check(
    `등록 안 된 라우트 없음${unlisted.length ? " — " + unlisted.join(", ") : ""}`,
    unlisted.length === 0
  );

  // 반대 방향: 표에는 있는데 실물이 없는 경로. 사이트맵이 404 를 신고하게 된다.
  const ghost = listed.filter((r) => !actual.includes(r));
  check(
    `실물 없는 경로를 표가 주장하지 않음${ghost.length ? " — " + ghost.join(", ") : ""}`,
    ghost.length === 0
  );

  const dup = SITE_PAGES.map((p) => p.path);
  check("SITE_PAGES 에 중복 경로 없음", new Set(dup).size === dup.length);

  const overlap = EXCLUDED_PATHS.filter((p) => dup.includes(p));
  check(
    `제외 목록과 사이트맵 목록이 겹치지 않음${overlap.length ? " — " + overlap.join(", ") : ""}`,
    overlap.length === 0
  );
}

console.log("\n[제외] 뺀 페이지는 코드로도 noindex 를 선언한다");
{
  // 주석은 "layout.js에서 noindex" 라고 **주장**했다. 참인지 센다.
  // robots.txt 로 막지 않는 설계라, 이 선언이 빠지면 비공개 화면이 그대로 색인된다.
  const missing = [];
  for (const p of EXCLUDED_PATHS) {
    const dir = join(ROOT, "app", ...p.slice(1).split("/"));
    const declared = ["layout.js", "page.js"].some((f) => {
      try { return /robots:\s*\{[^}]*index:\s*false/.test(readFileSync(join(dir, f), "utf8")); }
      catch { return false; }
    });
    if (!declared) missing.push(p);
  }
  check(
    `제외 ${EXCLUDED_PATHS.length}개 전부 index:false 선언${missing.length ? " — 빠짐: " + missing.join(", ") : ""}`,
    missing.length === 0
  );
}

console.log("\n[고아] 사이트맵에 실은 페이지는 사이트 안에서 도달 가능하다");
{
  // 사이트맵 등재는 크롤러에게 "발견" 신호일 뿐 "중요하다" 는 신호가 아니다. 아무도 가리키지 않는
  // URL 은 정확히 「발견됨 – 미색인」에 쌓인다(agenwiki 에서 실제로 112편 중 48편이 그랬다).
  // 여기서는 링크 정본 두 곳만 본다 — 탭(TABS)과 전 페이지 레이아웃(로고·푸터).
  // 본문 링크는 세지 않는다. 세면 통과 기준이 글 내용에 흔들려 경보가 시끄러워진다.
  const layout = readFileSync(join(ROOT, "app", "layout.js"), "utf8");
  const layoutLinks = [...layout.matchAll(/href="(\/[a-z0-9/-]*)"/g)].map((m) => m[1]);
  const reachable = new Set([...TABS.map((t) => t.href), ...layoutLinks]);

  const orphans = SITE_PAGES.map((p) => p.path).filter((p) => !reachable.has(p));
  check(
    `사이트맵 ${SITE_PAGES.length}개 전부 도달 가능${orphans.length ? " — 고아: " + orphans.join(", ") : ""}`,
    orphans.length === 0
  );

  // 탭이 사이트맵에 없는 곳을 가리키면, 그 페이지는 링크는 받는데 색인 후보가 아니다.
  // (/backup 은 의도적으로 그렇다 — noindex 이면서 탭에 있다. 그래서 제외 목록까지 합쳐서 본다.)
  const tabsNowhere = TABS.map((t) => t.href).filter((h) => !listed.includes(h));
  check(
    `탭이 가리키는 곳이 전부 등록돼 있음${tabsNowhere.length ? " — " + tabsNowhere.join(", ") : ""}`,
    tabsNowhere.length === 0
  );
}

console.log(`\n${"─".repeat(46)}`);
if (fails.length) {
  console.error(`❌ ${fails.length}건 실패`);
  fails.forEach((f) => console.error(`   ${f}`));
  process.exit(1);
}
console.log(`✅ ${pass}개 전부 통과`);
