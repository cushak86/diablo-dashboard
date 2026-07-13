export const metadata = {
  title: "공포의 영역 시간표 · 테러존 추적기",
  description:
    "디아블로2 레저렉션(D2R) 공포의 영역(테러존)을 실시간으로 추적합니다. 현재 지역과 다음 지역, 정각까지 남은 시간(카운트다운), 음성·사운드 알림, 우버 디아블로(클론 디아) 진행도를 함께 확인하세요.",
  alternates: { canonical: "/terror-zone" },
  openGraph: {
    url: "https://diablo-dashboard-phi.vercel.app/terror-zone",
    title: "공포의 영역 시간표 · 테러존 추적기 | D2R 대시보드",
    description:
      "디아블로2 레저렉션 실시간 공포의 영역 추적 · 현재/다음 지역 · 정각 카운트다운 · 음성 알림 · 우버 디아 진행도.",
  },
};

export default function TerrorZoneLayout({ children }) {
  // 서버 렌더 시점에 항상 노출되는 정적 소개(검색봇/첫 방문자용).
  // 클라이언트 대시보드(page.js)는 마운트 후 아래에서 실시간 데이터를 그린다.
  return (
    <>
      <section className="seo-intro" aria-label="페이지 소개">
        <div className="wrap">
          <h1 className="seo-h1">디아블로2 레저렉션 공포의 영역(테러존) 실시간 추적기</h1>
          <p className="seo-p">
            디아블로2 레저렉션(D2R)의 <b>공포의 영역</b>을 실시간으로 확인하세요. 현재 지역과 다음 지역,
            정각까지 남은 시간 카운트다운, 정각 변경 10·5·1분 전 음성·사운드 알림, 그리고 우버 디아블로
            (클론 디아) 진행도를 한 화면에서 제공합니다.
          </p>
        </div>
      </section>
      {children}
    </>
  );
}
