// 길 찾기(내비게이션) 검사 — **홈으로 돌아갈 수 있는가**, 그리고 문서가 실제와 맞는가.
//
// 왜 (2026-08-09 설계 감사):
//   사이트 로고가 <div> 였다. 탭 13개에 홈이 없고 푸터에도 없어서, **홈으로 돌아갈 방법이
//   사이트 어디에도 없었다.** 로고를 누르면 홈으로 간다는 것은 웹에서 거의 유일하게
//   배우지 않아도 되는 규약이고, 그게 없으면 사용자는 주소창을 직접 고쳐야 한다.
//   화면은 멀쩡해 보였다 — 이런 결함은 "없는 것"이라 눈에 안 띈다.
//
//   같은 감사에서 README 가 "상단 탭 10개"라고 적고 있었다. 실제는 13개다.
//   탭이 늘 때 README 를 같이 고칠 사람은 없으므로, **숫자를 여기서 대조한다.**

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TABS } from "../lib/pages.js";
import { BASE } from "../lib/site-pages.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0;
const fails = [];
function check(name, ok) {
  if (ok) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name}`); fails.push(name); }
}

const layout = readFileSync(join(ROOT, "app", "layout.js"), "utf8");
const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
const readme = readFileSync(join(ROOT, "README.md"), "utf8");

console.log("\n[길 찾기] 홈으로 돌아갈 수 있다");

{
  // ★ 이 검사가 이 파일의 존재 이유다.
  check('로고가 홈 링크다(<Link href="/">)', /<Link\s+href="\/"\s+className="logo"/.test(layout));
}

{
  // 탭에도 푸터에도 홈이 없다 — 로고가 유일한 홈 경로다. 그래서 접근성 이름이 있어야 한다
  // (로고 안은 "D2" 같은 조각 글자라 스크린리더로는 어디로 가는 링크인지 알 수 없다).
  check("로고 링크에 aria-label 이 있다", /className="logo"[^>]*aria-label="[^"]+"/.test(layout));
}

{
  // <a> 기본 스타일(밑줄·금색)이 로고에 붙으면 디자인이 깨진다.
  check(".logo 가 밑줄·색 상속을 끈다", /\.logo\{[^}]*text-decoration:\s*none/.test(css));
}

{
  const tabHrefs = new Set(TABS.map((t) => t.href));
  check("탭 목록에는 홈이 없다(그래서 로고가 유일한 경로다)", !tabHrefs.has("/"));
}

console.log("\n[문서] 실제와 어긋나지 않는다");

{
  // README 의 탭 개수 vs 정본(lib/pages.js). 탭이 늘 때 README 를 같이 고칠 사람은 없다.
  const m = /상단 탭 \*\*(\d+)개\*\*/.exec(readme);
  const said = m ? Number(m[1]) : NaN;
  check(
    `README 의 탭 개수(${said})가 정본과 같다(실제 ${TABS.length})`,
    said === TABS.length
  );
}

{
  // 탭 링크가 실재하는 경로여야 한다 — 오타 하나면 404 탭이 상시 노출된다.
  const bad = TABS.filter((t) => !/^\/[a-z0-9-]+$/.test(t.href)).map((t) => t.href);
  check(`탭 경로 형식이 전부 정상${bad.length ? " — " + bad.join(", ") : ""}`, bad.length === 0);
  const dup = TABS.map((t) => t.href);
  check("탭 경로에 중복이 없다", new Set(dup).size === dup.length);
}

console.log("\n[주소] 정본이 한 곳이다");

{
  // lib/site-pages.js 는 "커스텀 도메인으로 옮길 때 그 한 줄만 고치면 사이트맵·llms.txt·JSON-LD·
  // robots·전 페이지 openGraph 가 함께 따라온다" 고 적는다. **그게 참인지 센다.**
  //
  // 2026-08-09 실측: 코드 두 곳이 그 약속을 깨고 있었다 —
  //   · next.config.mjs 의 호스트 정규화 destination (도메인을 옮기면 사이트 전체가 죽은 주소로 308)
  //   · scripts/indexnow-submit.mjs 의 폴백 (이 스크립트만 옛 주소로 색인 제출을 계속)
  // 둘 다 404 를 내지 않는다 — 옮기는 날에야 드러나고, 그날은 이미 늦다.
  //
  // 문서(*.md)는 세지 않는다. 산문이 도메인을 언급하는 것은 정상이고, 그것까지 금지하면
  // 검사가 시끄러워져 무시당한다. **빌드·실행에 들어가는 코드**만 본다.
  const CODE_DIRS = ["app", "lib", "scripts", "next.config.mjs"];
  const host = BASE.replace(/^https?:\/\//, "");
  const hits = [];
  const scan = (p) => {
    let st;
    try { st = statSync(p); } catch { return; }
    if (st.isDirectory()) { for (const e of readdirSync(p)) scan(join(p, e)); return; }
    if (!/\.(js|mjs|jsx|ts|tsx)$/.test(p)) return;
    const rel = p.slice(ROOT.length + 1).replace(/\\/g, "/");
    if (rel === "lib/site-pages.js") return; // 여기가 정본이다
    const src = readFileSync(p, "utf8");
    // 주석은 걷어낸다 — "신 도메인 d2r-dashboard.online 등록" 같은 설명은 위반이 아니다.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    if (code.includes(host)) hits.push(rel);
  };
  CODE_DIRS.forEach((d) => scan(join(ROOT, d)));
  check(
    `코드에 도메인이 하드코딩돼 있지 않다(정본: lib/site-pages.js)${hits.length ? " — " + hits.join(", ") : ""}`,
    hits.length === 0
  );
}

console.log(`\n${"─".repeat(46)}`);
if (fails.length) {
  console.error(`❌ ${fails.length}건 실패`);
  fails.forEach((f) => console.error(`   ${f}`));
  process.exit(1);
}
console.log(`✅ ${pass}개 전부 통과`);
