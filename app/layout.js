import "./globals.css";
import Link from "next/link";
import { BASE } from "../lib/site-pages";
import TabNav from "./components/TabNav";
import DonationButton from "./components/DonationButton";
import PageTracker from "./components/PageTracker";
import SyncBootstrap from "./components/SyncBootstrap";

export const metadata = {
  // 사이트 주소 정본은 lib/site-pages.js 의 BASE 하나다 — 커스텀 도메인으로 옮길 때 그 한 줄만 고치면
  // 사이트맵·llms.txt·JSON-LD·robots·전 페이지 openGraph 가 함께 따라온다(각 layout 의 og:url 은 상대 경로).
  metadataBase: new URL(BASE),
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
    // url 을 여기 두지 않는다(2026-08-09 제거). Next 는 자식이 openGraph 를 재선언하지 않으면
    // 부모 것을 그대로 물려주는데, /privacy·/backup 은 재선언이 없어 **자기 주소가 아니라
    // /terror-zone 을 og:url 로 신고하고 있었다.** 같은 페이지가 두 주소를 주장하는 상태다
    // (canonical 은 각자 자기 자신을 가리킨다). 형제 저장소 budget-planner 에서 똑같은 결함을
    // 2026-08-08 에 고쳤는데 여기만 남아 있었다 — 값을 빼면 소비자가 요청 URL 로 폴백해 저절로 맞는다.
    // 탭 레이아웃들은 각자 url 을 선언하므로 영향 없다.
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
  // 검색엔진 소유확인 — 네이버 서치어드바이저(신 도메인 `d2r-dashboard.online`, 2026-08-08 등록).
  // 구글은 `public/google13864aadd13454d3.html` 파일 방식이라 여기 없다(둘 다 유효, 방식만 다름).
  // ⚠️ 지우면 네이버 소유확인이 풀린다 — 사이트가 확인된 뒤에도 태그는 유지해야 한다.
  verification: {
    other: { "naver-site-verification": "733019f1113bdb71b1b45f79d875d442f86fdb89" },
  },
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
