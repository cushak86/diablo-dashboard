export const metadata = {
  title: "룬워드 조합 · 룬 순서/소켓/베이스 (신규 3.x 포함)",
  description:
    "디아블로2 레저렉션(D2R) 룬워드 조합법. 룬 순서·소켓 수·베이스 아이템·요구 레벨을 정확히 정리. 악마술사의 군림(패치 3.0~3.2) 신규 룬워드(권위·마녀단·공허·경계·의식) 포함. 한글·영문·룬 검색 지원.",
  alternates: { canonical: "/runewords" },
  openGraph: {
    url: "https://diablo-dashboard-phi.vercel.app/runewords",
    title: "룬워드 조합 검색 (신규 3.x 포함) | D2R 대시보드",
    description:
      "룬 순서·소켓·베이스·요구 레벨. 악마술사의 군림 신규 룬워드 포함. 한글·영문·룬 검색.",
  },
};

export default function RunewordsLayout({ children }) {
  return children;
}
