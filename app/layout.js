import "./globals.css";
import TabNav from "./components/TabNav";
import DonationButton from "./components/DonationButton";
import PageTracker from "./components/PageTracker";
import SyncBootstrap from "./components/SyncBootstrap";

export const metadata = {
  metadataBase: new URL("https://diablo-dashboard-phi.vercel.app"),
  title: {
    default: "D2R 대시보드 | 공포의 영역 시간표 · 테러존 추적기",
    template: "%s | D2R 대시보드",
  },
  description:
    "디아블로2 레저렉션(D2R) 실시간 공포의 영역(테러존) 시간표·추적기. 현재/다음 지역, 정각 카운트다운, 음성 알림, 우버 디아블로(클론 디아) 진행도, 신규 아이템 트레더리(Traderie) 검색을 한 곳에서.",
  keywords: [
    "디아블로2", "디아블로2 레저렉션", "D2R", "공포의 영역", "테러존", "terror zone",
    "공포의 영역 시간표", "테러존 추적기", "테러존 시간표", "우버 디아블로", "클론 디아", "디아 클론",
    "룬워드", "프레임", "FCR", "FHR", "트레더리", "traderie",
  ],
  openGraph: {
    type: "website",
    siteName: "D2R 대시보드",
    locale: "ko_KR",
    url: "https://diablo-dashboard-phi.vercel.app/terror-zone",
    title: "D2R 대시보드 | 공포의 영역 시간표 · 테러존 추적기",
    description:
      "디아블로2 레저렉션 실시간 공포의 영역(테러존) 추적 · 정각 카운트다운 · 음성 알림 · 우버 디아 진행도.",
  },
  twitter: {
    card: "summary_large_image",
    title: "D2R 대시보드 | 공포의 영역 시간표",
    description: "디아블로2 레저렉션 실시간 테러존 추적기 · 우버 디아 진행도 · 트레더리 검색.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <header>
          <div className="wrap hd">
            <div className="logo">
              <div className="mk">D2</div>
              <div>
                <div className="t1">디아블로2 레저렉션 대시보드</div>
                <div className="t2">D2R Dashboard</div>
              </div>
            </div>
            <DonationButton />
          </div>
          <TabNav />
        </header>
        <SyncBootstrap />
        {children}
        <PageTracker />
      </body>
    </html>
  );
}
