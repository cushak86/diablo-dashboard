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
        destination: "https://d2r-dashboard.online/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
