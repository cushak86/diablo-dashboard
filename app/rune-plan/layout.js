export const metadata = {
  title: "룬 추천 · 내 룬으로 완성에 가까운 룬워드",
  description:
    "디아블로2 레저렉션(D2R) 내 룬 재고로 완성에 가까운 룬워드를 추천합니다. 룬을 누르면 그 룬을 쓰는 룬워드만 골라 볼 수 있어(역참조) '이 룬 어디 써?'를 바로 확인합니다. 재고는 룬 재고 탭과 공유됩니다.",
  alternates: { canonical: "/rune-plan" },
  openGraph: {
    url: "https://diablo-dashboard-phi.vercel.app/rune-plan",
    title: "룬 추천 | D2R 대시보드",
    description: "내 룬으로 완성에 가까운 룬워드 추천 + 룬별 역참조.",
  },
};

export default function RunePlanLayout({ children }) {
  return children;
}
