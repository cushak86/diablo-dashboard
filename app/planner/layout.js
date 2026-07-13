export const metadata = {
  title: "룬 재고 시뮬레이터 · 내 룬으로 만들 수 있는 룬워드",
  description:
    "디아블로2 레저렉션(D2R) 룬 재고를 넣으면 룬워드 99종을 즉시 제작·큐브로 가능·부족으로 판정합니다. 호라드릭 큐브 승급(하위 룬+보석 → 상위 룬)까지 계산해 등급이 섞인 재고도 그대로 판정합니다.",
  alternates: { canonical: "/planner" },
  openGraph: {
    url: "https://diablo-dashboard-phi.vercel.app/planner",
    title: "룬 재고 시뮬레이터 | D2R 대시보드",
    description: "내 룬으로 만들 수 있는 룬워드를 큐브 승급까지 계산해 판정합니다.",
  },
};

export default function PlannerLayout({ children }) {
  return children;
}
