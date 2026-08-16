// 개인정보처리방침이 **사이트가 실제로 하는 일**과 어긋나지 않는지 본다.
//
// 왜 (2026-08-14):
//   2026-08-09 에 쿠팡 제휴 광고를 붙였는데 방침은 그대로 두었다. 그 결과
//   **"현재 서비스에는 광고가 없습니다"라고 적힌 페이지 오른쪽에 광고 4개가 떠 있었다.**
//   닷새 동안 라이브였고, 애드센스 신청을 준비하다 발견했다.
//
//   심사자는 개인정보처리방침을 반드시 본다. 광고에 대한 거짓은 누락보다 나쁘다.
//   그리고 이건 화면을 봐도 안 보인다 — 방침 페이지와 광고가 같은 화면에 있는데도
//   둘을 나란히 읽어야만 모순이 드러난다.
//
// 규칙은 하나다: **광고 데이터가 비어 있지 않으면 방침이 광고를 인정해야 한다.**

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { activeSideAds } from "../lib/side-ad.js";
import { activeProducts } from "../lib/affiliate.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0;
const fails = [];
const check = (name, ok) => {
  if (ok) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name}`); fails.push(name); }
};

const src = readFileSync(join(ROOT, "app", "privacy", "page.js"), "utf8");
/** 주석은 걷어낸다 — 경고문이 본문으로 잡히면 안 된다(오늘까지 이걸로 세 번 헛짚었다). */
const body = src.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

const 광고있음 = activeSideAds().length > 0 || activeProducts().length > 0;

console.log(`\n[방침 ↔ 실제] 지금 광고 ${광고있음 ? "있음" : "없음"} (사이드 ${activeSideAds().length} · 카드 ${activeProducts().length})`);

{
  // ★ 이 검사의 존재 이유. 광고가 있는데 "광고가 없다"고 적혀 있으면 안 된다.
  const 없다고적음 = /광고가\s*없습니다|광고를\s*게재하지\s*않습니다|광고는\s*없습니다/.test(body);
  check(
    광고있음 ? '"광고가 없습니다" 라고 적혀 있지 않다' : "(광고 없음 — 이 항목은 해당 없음)",
    광고있음 ? !없다고적음 : true
  );
}

{
  // 제3자 추적 쿠키를 단정적으로 부인하면 애드센스 도입 시 즉시 거짓이 된다.
  const 부인 = /제3자\s*추적\s*쿠키는?\s*사용하지\s*않습니다/.test(body);
  check("제3자 추적 쿠키를 단정적으로 부인하지 않는다", !부인);
}

if (광고있음) {
  console.log("\n[방침] 광고를 싣는 사이트가 밝혀야 하는 것");
  check("쿠팡 파트너스 수수료를 밝힌다", /쿠팡\s*파트너스/.test(body) && /수수료/.test(body));
  // 애드센스 필수 고지 3종 — 심사 전에 갖춰야 한다.
  check("제3자 공급업체의 쿠키 사용을 밝힌다", /제3자[^<]{0,20}(공급업체|업체)[\s\S]{0,80}쿠키/.test(body));
  check("방문 기록 기반 광고임을 밝힌다", /방문한?\s*기록|방문 기록/.test(body));
  check(
    "맞춤 광고 해제 경로를 안내한다(google.com/settings/ads)",
    /google\.com\/settings\/ads/.test(body)
  );
}

console.log("\n[ads.txt] 게시자 선언");
{
  let txt = "";
  try { txt = readFileSync(join(ROOT, "public", "ads.txt"), "utf8"); } catch { /* 없음 */ }
  // 형식: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
  check(
    "public/ads.txt 가 있고 형식이 맞다",
    /^google\.com,\s*pub-\d{16},\s*DIRECT,\s*f08c47fec0942fa0\s*$/m.test(txt)
  );
}

console.log(`\n${"─".repeat(46)}`);
if (fails.length) {
  console.error(`❌ ${fails.length}건 실패`);
  fails.forEach((f) => console.error(`   ${f}`));
  console.error("\n   → 광고를 붙이거나 뗐으면 app/privacy/page.js 7항을 같이 고쳐라.");
  process.exit(1);
}
console.log(`✅ ${pass}개 전부 통과`);
