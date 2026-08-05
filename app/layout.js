import "./globals.css";
import Link from "next/link";
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
        {/* 전역 푸터 — 소개·정책·연락처는 **모든 페이지에서 한 번에 닿아야** 한다.
            탭 내비게이션은 이미 13개라 여기에 더 넣으면 도구 탭이 묻힌다. globals.css:81의
            footer 스타일이 원래 있었는데 정작 <footer> 요소가 없었다(2026-08-05 확인). */}
        <footer>
          <Link href="/about" style={{ color: "#8a8a8a" }}>사이트 소개</Link>
          {" · "}
          <Link href="/privacy" style={{ color: "#8a8a8a" }}>개인정보처리방침</Link>
          {" · "}
          <a href="mailto:cushak@icloud.com" style={{ color: "#8a8a8a" }}>문의</a>
          <div style={{ marginTop: 6, fontSize: 11, color: "#4a4a4a" }}>
            비공식 팬 사이트 · Diablo II: Resurrected는 Blizzard Entertainment, Inc.의 상표입니다.
          </div>
        </footer>
        <PageTracker />
      </body>
    </html>
  );
}
