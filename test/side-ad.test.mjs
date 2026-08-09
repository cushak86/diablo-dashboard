// 사이드 배너(SideRail) 규칙 — **레이아웃을 안 건드린다**는 전제를 기계가 지킨다.
//
// 왜 (2026-08-09):
//   lib/affiliate.js 의 카드는 "안 놓는 곳" 목록이 길다 — /terror-zone, /prices, /grail …
//   근거는 도구 화면 한가운데를 상품이 가로막는다는 것이었다.
//   사이드 배너를 **모든 페이지**에 띄우면서도 그 목록과 모순되지 않는 이유는 딱 하나다:
//   **position:fixed 라 문서 흐름 밖이고, 좁으면 아예 안 뜬다.**
//
//   /terror-zone 은 정각 직전에 급히 보는 화면이고, CLS 를 0.387 → 0.041 로 줄이려고
//   `.tz-shell` 에 높이를 예약해 뒀다. 레일이 흐름에 참여하는 순간 그 작업이 무너진다.
//   전제가 조용히 무너지는 것을 막는 것이 이 파일의 일이다.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SIDE_ADS, activeSideAds } from "../lib/side-ad.js";
import { AFFILIATE_PRODUCTS } from "../lib/affiliate.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0;
const fails = [];
function check(name, ok) {
  if (ok) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name}`); fails.push(name); }
}

const rail = readFileSync(join(ROOT, "app", "components", "SideRail.js"), "utf8");
const layout = readFileSync(join(ROOT, "app", "layout.js"), "utf8");
const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");

console.log("\n[사이드 배너] 레이아웃을 안 건드린다");

{
  // ★ 이 검사가 이 파일의 존재 이유다. fixed 가 아니면 본문을 밀고, 그러면 CLS 작업이 무너진다.
  check(
    "넓은 화면에서 position:fixed 로 뜬다",
    /@media[^{]*min-width:\s*1360px[\s\S]{0,400}?position:\s*fixed/.test(css)
  );
}

{
  // 기본이 none 이어야 좁은 화면에서 본문을 덮지 않는다. "기본은 꺼져 있고 넓을 때만 켠다"여야
  // 규칙 순서가 뒤집혀도 안전하다.
  check(".side-rail 기본값이 display:none", /\.side-rail\{display:none\}/.test(css));
}

{
  // 1360 = .wrap 의 960 + 한쪽 200 * 2. 본문 폭이 바뀌면 이 숫자도 바뀌어야 한다.
  check("본문 폭이 여전히 960px(1360px 기준의 근거)", /\.wrap\{max-width:960px/.test(css));
}

console.log("\n[사이드 배너] 무게·안전");

{
  // 전 페이지에 붙는 물건이라 무게가 그대로 곱해진다.
  //
  // ⚠️ **주석을 먼저 걷어낸다.** 안 걷으면 "여기에 <script> 를 넣지 마라"는 경고문 자체가
  //    <script> 로 잡혀 실패한다(형제 저장소 budget-planner 에서 오늘 실제로 그렇게 실패했다).
  //    금지 대상을 설명하는 글과 금지 대상 자체를 구분 못 하는 검사는, 반대로 진짜를 놓칠 때도
  //    이유를 못 댄다. 블록 주석 먼저, 그다음 줄 주석 — "https://" 가 잘리지 않게 앞이 ':' 이 아닐 때만.
  const code = rail.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  check(
    "SideRail 에 <script>·<iframe>·dangerouslySetInnerHTML 이 없다",
    !/<script|<iframe|dangerouslySetInnerHTML/.test(code)
  );
}

{
  // 외부 이미지 URL 은 전 페이지에서 서드파티 요청을 만든다. 로컬 정적 파일만 쓴다.
  // 이미지는 선택이라(쿠팡이 크롤링을 막는다) **있는 것만** 본다 — 없는 것을 실패로 세면
  // "지금 광고가 안 뜬다"와 "규칙을 어겼다"를 구분 못 하게 된다.
  const external = SIDE_ADS.filter((a) => a.image && !String(a.image).startsWith("/ads/")).map((a) => a.image);
  check(
    `이미지가 전부 로컬 /ads/ 파일${external.length ? " — " + external.join(", ") : ""}`,
    external.length === 0
  );
}

{
  // 이미지가 있으면 w·h 가 함께 있어야 한다. 없으면 도착할 때 레일 안에서 리플로가 난다.
  const noSize = SIDE_ADS.filter((a) => a.image && !(Number(a.w) > 0 && Number(a.h) > 0)).map((a) => a.name);
  check(`이미지가 있으면 w·h 도 있다${noSize.length ? " — " + noSize.join(", ") : ""}`, noSize.length === 0);
}

{
  // 같은 상품의 링크가 두 파일에 나뉘어 있다 — 한쪽만 고치면 다른 쪽에 죽은 링크가 남는다.
  // 링크 점검(MA/scripts/check-affiliate-links.mjs)은 lib/affiliate.js 만 읽으므로,
  // 사이드 배너에만 있는 링크는 **아무도 살아 있는지 안 본다.**
  const known = new Set(AFFILIATE_PRODUCTS.map((p) => p.url));
  const orphan = SIDE_ADS.filter((a) => !known.has(a.url)).map((a) => a.name);
  check(
    `사이드 배너 링크가 전부 lib/affiliate.js 에도 있다${orphan.length ? " — " + orphan.join(", ") : ""}`,
    orphan.length === 0
  );
}

{
  // 레일이 160px 다. 한 줄 설명이 길면 카드가 늘어져 아래 배너를 화면 밖으로 민다.
  const longText = SIDE_ADS.filter((a) => a.text.length > 24).map((a) => `${a.name}(${a.text.length}자)`);
  check(`한 줄 설명이 24자 이하${longText.length ? " — " + longText.join(", ") : ""}`, longText.length === 0);
}

console.log("\n[사이드 배너] 표시 규칙");

{
  // 고지가 배너보다 **위**여야 한다. 공정위가 요구하는 것은 존재가 아니라 인식 가능한 위치다.
  const disc = rail.indexOf("side-rail-disc");
  const item = rail.indexOf("side-rail-item");
  check("고지가 배너 링크보다 위에 있다", disc > 0 && item > 0 && disc < item);
}

{
  check(
    'rel="sponsored nofollow noopener" 가 걸려 있다',
    rail.includes('rel="sponsored nofollow noopener"')
  );
}

{
  check("배너가 없으면 아무것도 안 그린다", rail.includes("if (ads.length === 0) return null"));
  check("url 이 빈 항목은 렌더 대상이 아니다", activeSideAds().every((a) => String(a.url).trim().length > 0));
}

{
  check("모든 페이지에 붙어 있다(app/layout.js)", /<SideRail\s*\/>/.test(layout));
}

console.log(`\n${"─".repeat(46)}`);
if (fails.length) {
  console.error(`❌ ${fails.length}건 실패`);
  fails.forEach((f) => console.error(`   ${f}`));
  process.exit(1);
}
console.log(`✅ ${pass}개 전부 통과`);
