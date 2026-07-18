const BASE = "https://diablo-dashboard-phi.vercel.app";

// lastModified는 페이지별 실제 변경일 상수다. `new Date()`를 쓰면 이 라우트가 빌드 시점에 정적
// 생성되면서 배포할 때마다 전 URL이 "방금 변경됨"으로 신고된다 — CSS만 고쳐도 그렇다. 구글은
// lastmod가 일관되게 부정확하면 그 신호를 무시하므로 없느니만 못한 값이 된다.
// **페이지 내용을 고치면 그 줄의 날짜도 함께 갱신할 것.** (초기값: 2026-07-16 git 이력 실측)
export default function sitemap() {
  return [
    { url: `${BASE}/`, lastModified: "2026-07-18", changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/terror-zone`, lastModified: "2026-07-12", changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/new-items`, lastModified: "2026-07-14", changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/prices`, lastModified: "2026-07-17", changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/runewords`, lastModified: "2026-07-17", changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/build`, lastModified: "2026-07-18", changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/breakpoints`, lastModified: "2026-07-12", changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/cube`, lastModified: "2026-07-12", changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/grail`, lastModified: "2026-07-17", changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/farming`, lastModified: "2026-07-14", changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/drops`, lastModified: "2026-07-17", changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/planner`, lastModified: "2026-07-14", changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: "2026-07-18", changeFrequency: "yearly", priority: 0.2 },
  ];
  // 제외: /backup(개인 데이터 도구, layout.js에서 noindex) · /admin·/docs(비공개)
}
