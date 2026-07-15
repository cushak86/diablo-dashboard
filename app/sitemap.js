const BASE = "https://diablo-dashboard-phi.vercel.app";

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${BASE}/terror-zone`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/new-items`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/prices`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/runewords`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/breakpoints`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/cube`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/grail`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/farming`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/planner`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
  // 제외: /backup(개인 데이터 도구, layout.js에서 noindex) · /admin·/docs(비공개)
}
