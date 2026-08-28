import "./globals.css";
import Link from "next/link";
import { BASE } from "../lib/site-pages";
import { ADSENSE_CLIENT } from "../lib/adsense";
import TabNav from "./components/TabNav";
import DonationButton from "./components/DonationButton";
import PageTracker from "./components/PageTracker";
import SyncBootstrap from "./components/SyncBootstrap";
import SideRail from "./components/SideRail";
import BottomAd from "./components/BottomAd";
import ProductStrip from "./components/ProductStrip";

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
  // 애드센스 사이트 소유권 확인용 meta (2026-08-14 신청 준비).
  // 서버 렌더 HTML 의 <head> 에 그대로 나가므로 심사 로봇이 확실히 찾는다.
  // 게시자 ID 는 공개 값이다(lib/adsense.js 머리말) — 비밀이 아니라 커밋해도 된다.
  other: { "google-adsense-account": ADSENSE_CLIENT },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/*
          애드센스 로더 — **원본 HTML <head> 에 실제 <script> 로** 넣는다 (2026-08-14).
          next/script 로 감싸면 원본 HTML 에 안 남아 심사의 "코드 스니펫" 확인이 실패한다
          (형제 사이트 budget-planner 가 그렇게 한 번 겪었고 그 주석이 거기 남아 있다).

          ⚠️ Auto ads 는 애드센스 콘솔에서 켜는 것이라 **코드로는 못 막는다.** 켜면 이 스크립트가
             우리가 정한 자리 밖에도 광고를 주입한다 — /terror-zone 처럼 정각 직전에 급히 보는
             화면이 흔들릴 수 있으니, 승인 후 콘솔에서 Auto ads 를 켤지 따로 판단해야 한다.
             (형제 사이트는 그 이유로 볼트 화면에서 로더 자체를 뺐다. 여기는 볼트가 없다.)
        */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <header>
          <div className="wrap hd">
            {/* 로고는 **홈으로 가는 링크**여야 한다 (2026-08-09 수정).
                전에는 <div> 라서 홈으로 돌아갈 방법이 사이트 어디에도 없었다 —
                탭 13개에 홈이 없고 푸터에도 없다. 로고를 누르면 홈으로 간다는 것은
                웹에서 거의 유일하게 배우지 않아도 되는 규약이고, 없으면 주소창을 직접 고쳐야 한다.
                test/nav.test.mjs 가 홈 링크가 남아 있는지 지킨다. */}
            <Link href="/" className="logo" aria-label="D2R 대시보드 홈">
              <div className="mk">D2</div>
              <div>
                <div className="t1">디아블로2 레저렉션 대시보드</div>
                <div className="t2">D2R Dashboard</div>
              </div>
            </Link>
            <DonationButton />
          </div>
          <TabNav />
        </header>
        <SyncBootstrap />
        {children}
        {/* 본문 끝 상품 스트립 — 모든 페이지(사장님 지시 2026-08-27 "공격적 노출"). 도구 **다음**이라 조작을 막지
            않고, 카드 높이가 CSS 로 고정돼 API 상품 도착 시 아무것도 안 움직인다. 홈·/about 은 본문 안에
            AffiliateCards(8개)가 따로 있어 여기 것과 다른 상품이 걸린다(seed 가 다르다). */}
        <div className="wrap"><ProductStrip /></div>
        {/* 사이드 배너 — **모든 페이지**에 한 번만 붙인다(사장님 지시 2026-08-09).
            position:fixed 라 여기 둬도 화면 위치는 CSS 가 정하고, 문서 흐름은 안 건드린다.
            본문 뒤인 이유: 도구가 먼저 읽히고 광고가 나중에 오는 것이 스크린리더 순서로도 맞다.
            2026-08-27 부터 상품은 쿠팡 파트너스 API 에서 오고 정적 배너는 폴백이다. */}
        <SideRail />
        {/* 왼쪽 레일 — 1680px 이상에서만(2026-08-27). 오른쪽과 다른 상품을 고른다. */}
        <SideRail side="left" />
        {/* 좁은 화면(1359px 이하)용 하단 바 — 레일과 상보적이라 동시에 뜨지 않는다. 8초마다 자동 회전. */}
        <BottomAd />
        {/* 전역 푸터 — 소개·정책·연락처는 **모든 페이지에서 한 번에 닿아야** 한다.
            탭 내비게이션은 이미 13개라 여기에 더 넣으면 도구 탭이 묻힌다. globals.css:81의
            footer 스타일이 원래 있었는데 정작 <footer> 요소가 없었다(2026-08-05 확인). */}
        <footer>
          <Link href="/about" style={{ color: "#8a8a8a" }}>사이트 소개</Link>
          {" · "}
          <Link href="/privacy" style={{ color: "#8a8a8a" }}>개인정보처리방침</Link>
          {" · "}
          <a href="mailto:cushak@icloud.com" style={{ color: "#8a8a8a" }}>문의</a>
          {/* 면책은 가장 흐리면 안 되는 줄인데 #4a4a4a 라 대비 2.13:1 이었다(요구 4.5).
              푸터 링크와 같은 #8a8a8a 로 맞춘다 — #111 위에서 5.47:1. */}
          <div style={{ marginTop: 6, fontSize: 11, color: "#8a8a8a" }}>
            비공식 팬 사이트 · Diablo II: Resurrected는 Blizzard Entertainment, Inc.의 상표입니다.
          </div>
        </footer>
        <PageTracker />
      </body>
    </html>
  );
}
