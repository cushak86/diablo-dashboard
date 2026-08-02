// robots.txt — AI 크롤러 정책을 **명시**한다. 결과는 종전과 같은 "전부 허용"이지만, 침묵과 명시는 다르다:
// 침묵이면 나중에 누가 `*` 규칙을 건드렸을 때 무엇이 의도였는지 알 수 없다.
//
// 정책 = **전부 허용** (2026-08-02 사장님 확정). 노출 0·백링크 0인 지금은 막을 때가 아니라 알려야 할 때다.
// CLAUDE.md §15가 "모든 글을 생성형 AI 검색에 인용되기 쉽게 쓴다"고 정한 것과 같은 방향이다.
//
// 토큰 구분이 핵심이다 — 1차 출처 확인(2026-08-02, OpenAI/Anthropic/Google 공식 문서):
//   · 검색·인용   OAI-SearchBot · Claude-SearchBot · PerplexityBot
//                 → 막으면 ChatGPT·Claude 검색 결과에서 사라진다. **유입 경로다.**
//   · 사용자 요청 ChatGPT-User · Claude-User → 사용자가 링크를 붙여넣어 읽힐 때.
//                 (OpenAI 문서: 사용자 개시 동작에는 robots.txt 규칙이 적용되지 않을 수 있다)
//   · 학습       GPTBot · ClaudeBot · CCBot · Google-Extended
//                 → 막아도 검색 노출엔 영향 없다(Google 공식: Google-Extended는 검색 포함·순위에 영향 없음).
// **흔한 사고:** GPTBot(학습)을 막으면 ChatGPT 검색이 끊긴다고 오해하는 것. ChatGPT 검색은 OAI-SearchBot이다.
// 나중에 "학습 거부·인용 환영"으로 바꾸려면 AI_TRAINING 그룹만 `disallow: "/"` 로 뒤집으면 된다.
//
// /admin·/backup·/docs 를 Disallow 하지 않는 이유: 막으면 크롤러가 페이지를 못 읽어 noindex 지시 자체를 못 본다.
// 색인 배제는 각 layout.js 의 noindex 가 담당한다(지금도 그렇게 돼 있다).
import { BASE } from "../lib/site-pages";

const AI_SEARCH = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot", "ChatGPT-User", "Claude-User"];
const AI_TRAINING = ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended"];

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_SEARCH, allow: "/" },
      { userAgent: AI_TRAINING, allow: "/" },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
