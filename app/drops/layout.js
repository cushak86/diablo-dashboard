export const metadata = {
  title: "D2R 드롭 위치 — 이 아이템 어디서 나오나 (한글 검색)",
  description:
    "디아블로2 레저렉션(D2R) 드롭 위치 가이드. 베르·자·이스트 룬, 수수께끼(Enigma)·정신(Spirit)·소집(CTA) 등 룬워드 재료, 조던의 돌(SoJ)이 어느 몬스터·지역에서 나올 수 있는지 게임 데이터의 드롭 표에서 직접 추출해 한글로 정리. 한글명·초성·영문명 검색. 공포의 영역에서만 열리는 경로도 구분해 표시. 지옥(Hell) 기준.",
  alternates: { canonical: "/drops" },
  openGraph: {
    url: "https://diablo-dashboard-phi.vercel.app/drops",
    title: "D2R 드롭 위치 — 이 아이템 어디서 나오나 | D2R 대시보드",
    description:
      "고룬·룬워드 재료·인기 고유 아이템이 어디서 나오는지 한글로 검색. 근거는 통념이 아니라 게임 데이터의 드롭 표.",
  },
};

export default function DropsLayout({ children }) {
  return children;
}
