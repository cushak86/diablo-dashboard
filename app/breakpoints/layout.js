export const metadata = {
  title: "프레임 기준 · FCR/FHR 브레이크포인트 (전 직업)",
  description:
    "디아블로2 레저렉션(D2R) 직업별 시전 속도(FCR)·타격 회복 속도(FHR) 프레임 브레이크포인트 표. 아마존·어쌔신·바바리안·드루이드·네크로맨서·팔라딘·소서리스·악마술사(Warlock) 전 직업. 최신 3.2 패치 기준.",
  alternates: { canonical: "/breakpoints" },
  openGraph: {
    url: "https://diablo-dashboard-phi.vercel.app/breakpoints",
    title: "FCR/FHR 브레이크포인트 (전 직업) | D2R 대시보드",
    description:
      "직업별 시전 속도(FCR)·타격 회복 속도(FHR) 프레임 구간표. 악마술사 포함 8개 직업.",
  },
};

export default function BreakpointsLayout({ children }) {
  return children;
}
