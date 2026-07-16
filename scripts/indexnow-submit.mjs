// IndexNow 색인 요청 — 라이브 sitemap.xml의 URL을 Bing·Naver·Yandex·Seznam에 일괄 제출.
// 구글은 IndexNow 미지원(2026-07 기준) — GSC URL 검사로 수동 요청해야 한다.
// 사용: node scripts/indexnow-submit.mjs [--dry]
//
// 키 파일이 라이브에 200으로 서빙된 뒤에만 제출이 검증된다(배포 선행 필수).

const BASE = "https://diablo-dashboard-phi.vercel.app";
const KEY = "bb9aac3c09324870990c4392d2a1bca1";
const KEY_LOCATION = `${BASE}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";

const dry = process.argv.includes("--dry");

async function main() {
  const keyRes = await fetch(KEY_LOCATION);
  const keyBody = keyRes.ok ? (await keyRes.text()).trim() : "";
  if (!keyRes.ok || keyBody !== KEY) {
    console.error(`[중단] 키 파일 미검증: ${KEY_LOCATION} → HTTP ${keyRes.status}, 본문 일치=${keyBody === KEY}`);
    console.error("배포가 선행돼야 한다. 키 파일이 라이브 200이 아니면 제출해도 거부된다.");
    process.exit(1);
  }
  console.log(`키 파일 검증: ${KEY_LOCATION} → HTTP 200, 본문 일치 ✅`);

  const smRes = await fetch(`${BASE}/sitemap.xml`);
  if (!smRes.ok) {
    console.error(`[중단] sitemap.xml → HTTP ${smRes.status}`);
    process.exit(1);
  }
  const urlList = [...(await smRes.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urlList.length === 0) {
    console.error("[중단] sitemap에서 URL을 못 찾음");
    process.exit(1);
  }
  console.log(`제출 대상 ${urlList.length}개:`);
  urlList.forEach((u) => console.log(`  - ${u}`));

  const payload = { host: new URL(BASE).host, key: KEY, keyLocation: KEY_LOCATION, urlList };
  if (dry) {
    console.log("\n[--dry] 실제 제출 안 함. 페이로드:");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log(`\n제출 결과: HTTP ${res.status} ${res.statusText}`);
  if (text) console.log(`응답 본문: ${text}`);
  // 200=수락, 202=수락(키 검증 대기). 그 외는 실패로 본다.
  if (res.status !== 200 && res.status !== 202) process.exit(1);
}

main().catch((e) => {
  console.error(`[에러] ${e.message}`);
  process.exit(1);
});
