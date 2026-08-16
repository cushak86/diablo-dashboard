// 전송 헤더 검사 — 운영 화면(/admin)이 있는 사이트가 남의 iframe 안에 들어갈 수 있는가.
//
// 왜 (2026-08-13 18회차에서 헤더를 넣었고, 2026-08-14 에 **검사가 없다는 것**을 발견했다):
//   네 사이트가 같은 날 프레임 방어를 넣었는데 회귀를 막는 검사는 예산플래너에만 있었다.
//   설정은 지워지기 쉽다 — 특히 next.config.mjs 는 리다이렉트를 손볼 때마다 열리는 파일이다.
//   고친 것을 지키는 검사가 없으면 그 수정은 "한 번 고쳤다"로 끝난다.
//
//   이 사이트가 특히 그렇다: /admin·/admin/stats 라는 운영 화면이 있고(noindex 지만 주소는 알려질 수 있다),
//   사용자 데이터가 브라우저에만 있다 — 그 브라우저가 공격 지점이다.
//
// 목록을 베끼지 않는다 — **실제 next.config.mjs 의 headers() 를 불러서** 그 결과를 센다.
// 사본을 두면 설정을 고칠 때 검사만 옛 값을 지키게 된다(형제 저장소 budget-planner 의 설계를 그대로 따랐다).
//
// 사용: node test/headers.test.mjs   (실패하면 종료코드 1)

import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { default: config } = await import(pathToFileURL(join(ROOT, "next.config.mjs")).href);

let pass = 0;
const fails = [];
const check = (name, cond, detail = "") => {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fails.push(name + (detail ? " — " + detail : "")); console.log("  ✗ " + name + (detail ? "  " + detail : "")); }
};

if (typeof config.headers !== "function") {
  console.error("\n❌ next.config.mjs 에 headers() 가 없다 — 프레임 방어가 통째로 빠졌다.");
  process.exit(1);
}

const rules = await config.headers();
const all = rules.filter((r) => r.source === "/:path*");
const of = (key) =>
  all.flatMap((r) => r.headers).find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;

console.log(`\n[적용범위] 전 경로에 붙는다 (규칙 ${rules.length}개)`);
check("모든 경로(/:path*) 규칙이 있다", all.length > 0);

console.log("\n[클릭재킹] 운영 화면이 남의 iframe 에 들어가지 않는다");
{
  // 현대 브라우저는 CSP frame-ancestors 를, 옛 브라우저는 X-Frame-Options 를 본다.
  // 하나만 두면 한쪽 브라우저에서 방어가 통째로 없다 — 둘 다 요구한다.
  const csp = of("Content-Security-Policy") ?? "";
  check("CSP frame-ancestors 'self'", /frame-ancestors\s+'self'/.test(csp), csp || "(헤더 없음)");
  check(
    "X-Frame-Options SAMEORIGIN(구형 브라우저 보조)",
    of("X-Frame-Options") === "SAMEORIGIN",
    of("X-Frame-Options") ?? "(헤더 없음)"
  );

  // ⚠️ CSP 는 frame-ancestors 만 담는다. script-src 등을 여기 넣으면 쿠팡 제휴 이미지·외부 시세 데이터가
  //    조용히 죽는데 화면으로는 티가 안 난다. 넣으려면 별도 작업으로, 실측과 함께.
  const 지시어 = csp.split(";").map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
  check(
    "CSP 가 frame-ancestors 만 담는다(외부 스크립트를 조용히 죽이지 않게)",
    지시어.length === 1 && 지시어[0] === "frame-ancestors",
    지시어.join(", ") || "(비어 있음)"
  );
}

{
  // ★ 같은 헤더가 두 번 선언되면 안 된다.
  //
  //   2026-08-14 에 이 검사를 만들면서 **내가 직접 만들어 본 결함**이다. 반증 실험 중
  //   제거 단계는 실패하고 복원 단계만 먹어서 CSP 줄이 두 개가 됐는데, 그 상태로
  //   **이 검사가 6/6 통과했다.** find() 가 첫 항목만 보기 때문이다.
  //
  //   왜 문제인가: Next 는 같은 키를 두 번 내보낼 수 있고, 값이 서로 다르면 브라우저가
  //   어느 쪽을 따르는지 예측하기 어렵다. CSP 는 특히 그렇다 — 중복 선언은 더 엄격한 쪽이
  //   이기기도 하고 무시되기도 한다. 값이 같아도 지금 우연히 같을 뿐이고,
  //   한쪽만 고치는 순간 갈라진다.
  const 키들 = all.flatMap((r) => r.headers).map((h) => h.key.toLowerCase());
  const 중복 = [...new Set(키들.filter((k, i) => 키들.indexOf(k) !== i))];
  check(
    `같은 헤더가 두 번 선언되지 않았다${중복.length ? " — " + 중복.join(", ") : ""}`,
    중복.length === 0
  );
}

console.log("\n[기타] 브라우저 기본값에 기대지 않는다");
check("X-Content-Type-Options nosniff", of("X-Content-Type-Options") === "nosniff", of("X-Content-Type-Options") ?? "(헤더 없음)");
check(
  "Referrer-Policy 가 선언돼 있다",
  (of("Referrer-Policy") ?? "").length > 0,
  of("Referrer-Policy") ?? "(헤더 없음)"
);

console.log(`\n${"─".repeat(46)}`);
if (fails.length) {
  console.error(`❌ ${fails.length}건 실패`);
  fails.forEach((f) => console.error(`   ${f}`));
  process.exit(1);
}
console.log(`✅ ${pass}개 전부 통과`);
