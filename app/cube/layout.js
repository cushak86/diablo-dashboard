export const metadata = {
  title: "호라드릭 큐브 · 룬 업그레이드 레시피 & 룬 조합기",
  description:
    "디아블로2 레저렉션(D2R) 호라드릭 큐브 룬 업그레이드 레시피(엘→조드) 전체 표와 룬 조합기. 목표 룬을 만드는 데 필요한 하위 룬 개수·보석을 자동 계산. 룬워드용 룬 파밍 실전 가이드.",
  alternates: { canonical: "/cube" },
  openGraph: {
    url: "https://diablo-dashboard-phi.vercel.app/cube",
    title: "호라드릭 큐브 룬 조합기 | D2R 대시보드",
    description:
      "룬 업그레이드 레시피 전체표 + 목표 룬 조합 계산기(하위 룬·보석 자동 계산).",
  },
};

export default function CubeLayout({ children }) {
  return children;
}
