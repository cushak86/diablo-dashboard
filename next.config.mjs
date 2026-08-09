// 주소 정본은 lib/site-pages.js 의 BASE 하나다. 여기서 문자열을 다시 적으면
// **"그 한 줄만 고치면 된다"는 저장소의 약속이 거짓이 된다** — 도메인을 옮길 때 이 파일이 남아
// 옛 주소로 308 을 계속 쏘게 되고, 그건 사이트 전체가 죽은 주소로 넘어간다는 뜻이다.
// test/nav.test.mjs 가 코드에 도메인이 하드코딩되지 않았는지 지킨다.
import { BASE } from "./lib/site-pages.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // 호스트 정규화 — 옛 vercel.app 별칭 접속을 정식 도메인으로 308.
      // Vercel은 커스텀 도메인을 붙여도 `<project>.vercel.app`을 200으로 계속 서빙한다(형제 사이트 agenwiki
      // 2026-08-03 실측). canonical 태그만으로는 중복 호스트 색인을 막지 못하므로 호스트 단에서 끊는다.
      // 옛 주소엔 승계할 색인 자산이 있다(2026-08-05 GSC 실측: /terror-zone 노출 125 · 평균 6.3위).
      //
      // ⚠️ 이 규칙은 신 도메인이 Vercel에 붙어 SSL까지 뜬 뒤에 배포해야 한다. 먼저 배포하면
      //    라이브 트래픽 전체가 아직 파킹 상태인 도메인으로 넘어가 사이트가 죽는다.
      {
        source: "/:path*",
        has: [{ type: "host", value: "diablo-dashboard-phi.vercel.app" }],
        destination: `${BASE}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
