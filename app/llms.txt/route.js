// /llms.txt — AI 에이전트용 사이트 목차(llmstxt.org 관례).
//
// ⚠ 기대치 정직하게 — **Google Search는 이 파일을 무시한다.** 구글 공식 가이드(2026-05-15)와
//    Gary Illyes(Search Central Live) 확인: "지원하지 않으며 계획 없음. 순위·노출에 도움도 해도 되지 않는다."
//    OpenAI의 OAI-SearchBot 문서도 robots.txt만 언급하고 llms.txt는 언급하지 않는다.
//    즉 이 파일은 **검색 색인 대책이 아니다**(우리 색인 정체의 원인은 백링크 부재 — work/learnings.md 참조).
//    관례를 읽는 도구·에이전트가 있을 때만 쓰이는 저비용 보조 수단으로 두고, 성과를 기대해 예산을 쓰지 말 것.
//
// 내용은 `lib/site-pages.js` 한 표에서 생성한다 — 손으로 쓰면 페이지가 늘 때마다 낡아서
// AI에게 없는 페이지를 알려주거나 새 페이지를 감춘다. 낡은 llms.txt는 없느니만 못하다.
import { BASE, SITE_PAGES } from "../../lib/site-pages";

export const dynamic = "force-static";

export function GET() {
  const lines = [
    "# D2R 대시보드 (디아블로2 레저렉션 통합 대시보드)",
    "",
    "> 디아블로2 레저렉션(D2R)의 공포의 영역 시간표, 룬워드·룬 계산, 드롭 위치, 시세를 한국어로 제공하는 도구 모음입니다.",
    "> 게임 데이터 덤프에서 직접 추출한 값을 쓰며, 개인 진행 상황(수집·파밍·룬 재고)은 서버가 아니라 브라우저에 저장합니다.",
    "",
    "패치 3.2(악마술사의 군림) 기준. 시세는 비공식·참고용이며 실시간이 아닙니다.",
    "",
    "## 페이지",
    "",
    ...SITE_PAGES.map((p) => `- [${p.title}](${BASE}${p.path}): ${p.summary}`),
    "",
    "## 참고",
    "",
    `- [사이트맵](${BASE}/sitemap.xml): 색인 대상 URL 전체`,
    "- 룬·아이템의 한글 표기는 게임 클라이언트 실측 확정본을 씁니다(커뮤니티 통용명 노선).",
    "- 비공개 경로(/admin·/docs)와 개인 데이터 도구(/backup)는 이 목록에 없습니다.",
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
