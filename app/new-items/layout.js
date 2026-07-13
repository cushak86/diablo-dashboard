export const metadata = {
  title: "신규 아이템 · 트레더리(Traderie) 한→영 검색",
  description:
    "디아블로2 레저렉션 악마술사의 군림(패치 3.0+) 신규 아이템의 한글명→영문명 변환과 트레더리(Traderie) 거래 링크. 룬워드·고유·세트·파괴 부적·마법서 베이스 등 한글/초성/영문 검색 지원.",
  alternates: { canonical: "/new-items" },
  openGraph: {
    url: "https://diablo-dashboard-phi.vercel.app/new-items",
    title: "신규 아이템 · 트레더리 한→영 검색 | D2R 대시보드",
    description:
      "악마술사의 군림 신규 아이템 한글→영문 변환 + 트레더리 거래 링크. 한글·초성·영문 검색.",
  },
};

export default function NewItemsLayout({ children }) {
  return children;
}
