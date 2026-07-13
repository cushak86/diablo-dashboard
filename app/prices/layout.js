export const metadata = {
  title: "아이템 시세 지수 · 익명 제보 (룬워드 · 고유 · 룬)",
  description:
    "디아블로2 레저렉션(D2R) 주요 룬워드·고유 아이템·고룬의 시세 참고 지수와 익명 거래가 제보. 스탠다드/래더 기준선과 유저 제보 중앙값을 함께 확인하세요. 비공식·참고용이며 실시간이 아닙니다.",
  alternates: { canonical: "/prices" },
  openGraph: {
    url: "https://diablo-dashboard-phi.vercel.app/prices",
    title: "아이템 시세 지수 · 익명 제보 | D2R 대시보드",
    description:
      "D2R 룬워드·고유·고룬 시세 참고 지수 + 익명 제보 중앙값. 비공식·참고용.",
  },
};

export default function PricesLayout({ children }) {
  return children;
}
