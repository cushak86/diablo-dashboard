// :145-146 일일=매일 자정(KST) 초기화 / 주간=매주 월요일(KST) 초기화.
export const metadata = {
  title: "일일 · 주간 파밍 체크리스트 · KST 자동 초기화",
  description:
    "디아블로2 레저렉션(D2R) 일일·주간 파밍 루틴 체크리스트. 일일은 매일 자정(KST), 주간은 매주 월요일(KST) 자동 초기화. 오늘 뭘 돌아야 하는지 한눈에 확인하고 진행 상황을 브라우저에 저장하세요.",
  alternates: { canonical: "/farming" },
  openGraph: {
    url: "https://diablo-dashboard-phi.vercel.app/farming",
    title: "일일 · 주간 파밍 체크리스트 | D2R 대시보드",
    description:
      "D2R 일일·주간 파밍 루틴 체크. KST 기준 자동 초기화 + 진행률 저장.",
  },
};

export default function FarmingLayout({ children }) {
  return children;
}
