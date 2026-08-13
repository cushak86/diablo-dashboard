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

  /**
   * 전송 헤더 (2026-08-13 신설, 18회차 감사).
   *
   * 실측: 네 사이트 전부 응답 헤더가 HSTS 하나뿐이었고 **프레임 방어가 0** 이었다.
   * 여기에는 /admin·/admin/stats 라는 운영 화면이 있다(noindex 지만 주소는 알려질 수 있다).
   * 프레임 방어가 없으면 그 화면을 남의 페이지 안에 담아 투명 레이어로 덮을 수 있다.
   * 사용자 데이터가 브라우저에만 있는 사이트라 더 그렇다 — 그 브라우저가 공격 지점이다.
   *
   * frame-ancestors 'self' 가 현대 브라우저용 정본, X-Frame-Options 는 옛 브라우저용 보조다.
   * 하나만 두면 한쪽 브라우저에서 방어가 통째로 없다.
   *
   * ⚠️ **CSP 전체(script-src 등)는 일부러 넣지 않았다.** 이 사이트는 쿠팡 제휴 이미지와 외부
   *    시세 데이터를 다룬다. 허용 목록을 잘못 잡으면 조용히 죽는데 화면으로는 티가 안 난다.
   *    frame-ancestors 는 스크립트 로딩에 관여하지 않아 그 위험이 없다.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
