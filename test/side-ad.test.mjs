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

import { readFileSync, existsSync } from "node:fs";
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

/**
 * 소스에서 **주석을 걷어낸다.**
 *
 * 2026-08-09 하루에 이걸로 **세 번** 틀렸다. "여기에 <script> 를 넣지 마라",
 * "localStorage 로 영구히 하면 안 된다" 같은 **경고문 자체**가 금지 대상으로 잡혀 실패했다.
 * 금지 대상을 설명하는 글과 금지 대상 자체를 구분 못 하는 검사는, 반대로 진짜를 놓칠 때도
 * 이유를 못 댄다. 그래서 매번 인라인으로 걷지 말고 **여기 한 곳**을 쓴다.
 *
 * 블록 주석 먼저, 그다음 줄 주석 — "https://" 가 잘리지 않게 앞 문자가 ':' 이 아닐 때만.
 */
function codeOf(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
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
  // 주석을 걷어낸 코드만 본다 — 이유는 codeOf() 머리말.
  const code = codeOf(rail);
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
  // ★ 경로 **형식**만 보면 오타 한 글자를 못 잡는다. 파일이 실제로 있는지 디스크에서 확인한다.
  //   빌드는 통과하고 배포도 되지만 방문자에겐 깨진 이미지가 나간다 — 화면은 멀쩡해 보이는 쪽의 실패다.
  //   선언한 w·h 가 파일의 실제 크기와 같은지도 본다(다르면 브라우저가 잡아 둔 자리가 틀려 리플로가 난다).
  //   형제 저장소(budget-planner)에서 파일명 오타와 크기 오선언을 실제로 심어 둘 다 잡히는 것을 확인했다.
  const bad = [];
  for (const a of SIDE_ADS) {
    if (!a.image) continue;
    const p = join(ROOT, "public", String(a.image).replace(/^\//, ""));
    if (!existsSync(p)) { bad.push(`${a.name}: ${a.image} 파일 없음`); continue; }
    const buf = readFileSync(p);
    // WebP 손실 포맷(VP8 )만 크기를 읽는다. VP8X·VP8L 은 배치가 달라 건너뛴다(존재 확인은 이미 했다).
    if (buf.subarray(12, 16).toString("latin1") !== "VP8 ") continue;
    const w = buf.readUInt16LE(26) & 0x3fff, h = buf.readUInt16LE(28) & 0x3fff;
    if (w !== a.w || h !== a.h) bad.push(`${a.name}: 선언 ${a.w}×${a.h} ≠ 실제 ${w}×${h}`);
  }
  check(`이미지 파일이 실제로 있고 크기가 선언과 같다${bad.length ? " — " + bad.join(" / ") : ""}`, bad.length === 0);
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

console.log("\n[하단 바] 좁은 화면 — 레일과 상보적이어야 한다");

const bottom = readFileSync(join(ROOT, "app", "components", "BottomAd.js"), "utf8");

{
  // ★ 이 검사가 이 절의 존재 이유다.
  //   레일은 min-width N 에서, 하단 바는 max-width M 에서 뜬다. **M + 1 === N** 이어야
  //   광고가 없는 구간도, 둘이 겹치는 구간도 없다.
  //   2026-08-09 에 레일만 만들어 두었다가 모바일·태블릿에 광고가 0 이었던 것이 이 검사의 계기다.
  //   한쪽 숫자만 고치면 그 구멍이 소리 없이 돌아온다.
  const railBp = Number(/@media\s*\(min-width:\s*(\d+)px\)\s*\{\s*\.side-rail\s*\{/.exec(css)?.[1]);
  const barBp = Number(/@media\s*\(max-width:\s*(\d+)px\)\s*\{\s*\.bottom-ad\s*\{/.exec(css)?.[1]);
  check(
    `레일(≥${railBp}px)과 하단 바(≤${barBp}px)가 빈틈없이 이어진다`,
    Number.isFinite(railBp) && Number.isFinite(barBp) && barBp + 1 === railBp
  );
}

{
  check(".bottom-ad 기본값이 display:none", /\.bottom-ad\{display:none\}/.test(css));
  check("모든 페이지에 붙어 있다(app/layout.js)", /<BottomAd\s*\/>/.test(layout));
}

{
  // 좁아서 줄이더라도 "쿠팡 파트너스"와 "수수료"는 남아야 한다. 그리고 상품명보다 **위**.
  const disc = bottom.indexOf("쿠팡 파트너스 수수료를 받습니다");
  const name = bottom.indexOf("{ad.name}");
  check("고지에 「쿠팡 파트너스」·「수수료」가 있고 상품명보다 위", disc > 0 && name > 0 && disc < name);
}

{
  check(
    'rel="sponsored nofollow noopener" 가 걸려 있다',
    bottom.includes('rel="sponsored nofollow noopener"')
  );
}

{
  // /terror-zone 은 정각 직전에 급히 보는 화면이다. 안 닫히는 배너는 최악이다.
  // 그리고 **세션 동안만** 기억해야 한다 — localStorage 면 광고가 영영 안 뜬다.
  check("닫기 버튼이 있다", /aria-label="광고 닫기"/.test(bottom));
  check(
    "닫힘을 sessionStorage 에 저장한다(localStorage 아님)",
    codeOf(bottom).includes("sessionStorage") && !codeOf(bottom).includes("localStorage")
  );
}

{
  // 랜덤이면 서버·클라이언트가 다른 값을 내 하이드레이션이 깨진다.
  check(
    "상품 선택이 결정적이다(Math.random·Date 없음)",
    codeOf(bottom).includes("pickForPath") && !/Math\.random|new Date|Date\.now/.test(codeOf(bottom))
  );
}

{
  // 토스트(.ti-toast)가 하단 바에 가리면 사용자가 동작 결과를 못 본다.
  const toastZ = Number(/\.ti-toast\{[\s\S]*?z-index:\s*(\d+)/.exec(css)?.[1]);
  const barZ = Number(/\.bottom-ad\{[\s\S]*?z-index:\s*(\d+)/.exec(css)?.[1]);
  check(`토스트 z-index(${toastZ})가 하단 바(${barZ})보다 높다`, toastZ > barZ);
  check("좁은 화면에서 토스트를 바 위로 올린다", /max-width:\s*1359px\)\{\.ti-toast\{bottom:\s*\d+px\}/.test(css));
}

console.log(`\n${"─".repeat(46)}`);
if (fails.length) {
  console.error(`❌ ${fails.length}건 실패`);
  fails.forEach((f) => console.error(`   ${f}`));
  process.exit(1);
}
console.log(`✅ ${pass}개 전부 통과`);
