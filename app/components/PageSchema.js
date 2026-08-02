// 페이지별 JSON-LD(구조화 데이터). 서버 컴포넌트다 — 프리렌더 HTML에 그대로 박히고 JS 번들엔 안 실린다.
//
// ⚠ 기대치 정직하게 — **이 마크업으로 검색 리치 결과는 나오지 않는다.**
//    2026년 현재 구글이 리치 결과를 주는 타입은 Article·Product·Review·BreadcrumbList·Video·Event뿐이고
//    (FAQ는 2026-05-07, HowTo는 2023 폐기), SoftwareApplication 리치 결과는 aggregateRating을 요구한다.
//    **우리는 실제 평점이 없으므로 넣지 않는다** — 리치 결과를 얻으려고 평점을 지어내는 것은 CLAUDE.md §7
//    정면 위반이다. 이 파일의 목적은 SERP가 아니라 **AI·에이전트가 각 페이지가 무엇인지 이해하는 것**이다
//    (CLAUDE.md §15 GEO 방향). 검색 순위 효과를 기대하지 말 것.
//
// 원칙은 app/page.js 의 WebSite LD와 같다: **실재하는 것만 표기한다.**
//    · aggregateRating — 없음 → 생략
//    · Organization/logo — 정사각 로고 자산 없음 → 생략
//    · SearchAction — `?q=` 결과 URL 없음 → 생략
// 값은 lib/site-pages.js 한 표에서 온다(사이트맵·llms.txt와 같은 출처 — 셋이 갈라지지 않는다).
import { BASE, SITE_PAGES } from "../../lib/site-pages";

// 이 사이트의 페이지는 전부 브라우저에서 도는 대화형 도구다(검색·필터·계산·localStorage 저장).
// 그래서 WebPage가 아니라 WebApplication이다 — WebPage는 어차피 아무 기능도 하지 않는 타입이다.
export default function PageSchema({ path }) {
  const page = SITE_PAGES.find((p) => p.path === path);
  // 조용히 건너뛰지 않고 던진다. 빌드 때 터지므로 사용자에겐 도달하지 않고, 목록에 없는 페이지에
  // 스키마만 붙는(= 사이트맵·llms.txt엔 없는데 스키마엔 있는) 어긋남을 만들지 않는다.
  if (!page) throw new Error(`PageSchema: lib/site-pages.js에 없는 경로다: ${path}`);

  const ld = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: page.title,
    url: `${BASE}${page.path}`,
    description: page.summary,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: "ko",
    isAccessibleForFree: true,
    // 도메인을 명시한다 — "이 도구가 무엇에 관한 것인가"가 AI에게 가장 쓸모 있는 한 줄이다.
    about: { "@type": "VideoGame", name: "Diablo II: Resurrected", alternateName: "디아블로2 레저렉션" },
    isPartOf: { "@type": "WebSite", name: "D2R 대시보드", url: `${BASE}/` },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
