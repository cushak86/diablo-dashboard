import { OG_IMAGE } from "../../lib/site-pages";
import Link from "next/link";
import PageGuide from "../components/PageGuide";
import PageSchema from "../components/PageSchema";
import { PATH_LABELS } from "../../lib/pages";
import { TERROR_ZONES } from "../../lib/zones";

// 액트별 지역 묶음 수는 데이터에서 센다 — 손으로 적으면 zones.js가 늘 때 조용히 틀린 숫자가 남는다.
const ACT_COUNT = TERROR_ZONES.reduce((m, z) => ({ ...m, [z.act]: (m[z.act] || 0) + 1 }), {});
const ACTS = [1, 2, 3, 4, 5].filter((a) => ACT_COUNT[a]);

// 여기서 나가는 문맥 링크. **page.js 가 아니라 이 레이아웃에 두는 이유**가 있다 —
// page.js 는 `if (!mounted || !data)` 로딩 게이트 아래라서 서버 렌더 HTML 에 실리지 않는다.
// 사람에겐 보이지만 크롤러의 내부 링크 그래프엔 안 잡힌다. 레이아웃은 서버 컴포넌트라 둘 다 얻는다.
// 라벨은 lib/pages.js 에서 가져온다 — 같은 곳을 탭마다 다른 말로 부르지 않는다(손으로 베끼지도 않는다).
const RELATED = [
  ["/drops", "지금 이 지역에서 뭐가 나오나"],
  ["/farming", "오늘 돌 곳 체크 — 자정에 자동 초기화"],
  ["/rune-plan", "주운 룬으로 뭘 만들까"],
];

export const metadata = {
  title: "공포의 영역 시간표 · 테러존 추적기",
  description:
    "디아블로2 레저렉션(D2R) 공포의 영역(테러존)을 실시간으로 추적합니다. 현재 지역과 다음 지역, 정각까지 남은 시간(카운트다운), 음성·사운드 알림, 우버 디아블로(클론 디아) 진행도를 함께 확인하세요.",
  alternates: { canonical: "/terror-zone" },
  openGraph: {
    images: OG_IMAGE,
    url: "/terror-zone",
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
      <PageSchema path="/terror-zone" />
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
      {/*
        서버 렌더되는 본문. 여기가 왜 필요한가 —
        이 페이지는 사이트 노출의 대부분을 혼자 받는데(구 속성 4주 노출 248·클릭 7·평균 6.8위),
        page.js 는 마운트 전까지 스켈레톤만 반환하므로 크롤러가 받는 HTML 에는 소개 문단 하나뿐이었다.
        지역 이름이 한 글자도 실리지 않아, '잊힌 탑'·'카오스 생츄어리' 같은 롱테일 질의에 걸릴 표면이 없었다.
        아래 표는 새 데이터가 아니라 lib/zones.js 를 한 번 더 map 한 것이다.
      */}
      <section className="wrap" aria-label="공포의 영역 전체 지역 목록" style={{ marginTop: 20 }}>
        <div className="card">
          <h2 className="seo-h1" style={{ fontSize: 16 }}>
            공포의 영역 전체 지역 목록 — {TERROR_ZONES.length}개 묶음
          </h2>
          <p className="seo-p" style={{ marginBottom: 12 }}>
            D2R은 <b>지금 열린 지역과 다음 지역만</b> 공개합니다. 하루치·일주일치 시간표는 게임이 내주지 않으므로
            어디에도 존재할 수 없습니다 — 이 페이지가 정각마다 갱신되는 이유입니다. 아래는 순환에 등장하는
            전체 지역 묶음이고, 위쪽 추적기가 그중 지금 열린 곳을 보여줍니다.
          </p>
          {ACTS.map((act) => (
            <div key={act} style={{ marginTop: 12 }}>
              <h3 className="seo-p" style={{ color: "var(--parch)", fontWeight: 700, marginBottom: 6 }}>
                {act}막 · {ACT_COUNT[act]}개 묶음
              </h3>
              <ul className="chips" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {TERROR_ZONES.filter((z) => z.act === act).map((z) => (
                  <li key={z.en} className="chip">
                    {z.kr} <span className="en">{z.en}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {/* lib/zones.js:4-15 가 kr 표기의 출처가 불명이라고 못박아 뒀다. 그 목록을 최다 유입 페이지에
              정적 표로 올리는 이상, 미확인 표기를 SEO 로 증폭하지 않도록 고지를 표 옆에 붙인다. */}
          <p className="seo-p" style={{ marginTop: 14 }}>
            ※ 일부 지역의 한글 표기는 게임 클라이언트와 다를 수 있습니다. 확인되는 대로 고치고 있으니 다른 표기를
            발견하시면 알려주세요. 영문명은 원문 그대로입니다.
          </p>
        </div>
      </section>
      <section className="wrap" aria-label="이어서 볼 페이지" style={{ marginTop: 20 }}>
        <div className="card">
          <h2 className="seo-h1" style={{ fontSize: 16 }}>이어서 보기</h2>
          <ul className="chips" style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
            {RELATED.map(([href, why]) => (
              <li key={href}>
                <Link href={href} className="chip" style={{ display: "inline-block" }}>
                  {PATH_LABELS[href]} <span className="en">{why}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <PageGuide
        eyebrow="공포의 영역 안내"
        capsule={`공포의 영역(테러존)은 매시 정각에 바뀌는 순환 사냥터입니다. 이 페이지는 지금 열린 지역과 다음 지역, 정각까지 남은 시간을 실시간으로 보여주고, 변경 10·5·1분 전에 음성으로 알려줍니다. 수록된 지역 묶음은 ${TERROR_ZONES.length}개이며, 관심 지역을 별표로 저장하면 그 지역이 열릴 때만 따로 알림을 받을 수 있습니다.`}
        sections={[
          {
            h: "공포의 영역은 얼마나 자주 바뀌나요?",
            p: "매시 정각에 한 번 바뀝니다. 이 페이지의 카운트다운은 그 정각을 기준으로 남은 시간을 계산하며, 데이터는 60초마다 갱신됩니다. 알림은 정각 10분 전·5분 전·1분 전 세 번 울립니다.",
          },
          {
            h: "어느 액트에 몇 개가 있나요?",
            p: `현재 이 사이트에 수록된 지역 묶음은 총 ${TERROR_ZONES.length}개이고, 액트별 분포는 아래와 같습니다. 한 묶음이 여러 지역으로 이뤄진 경우도 있습니다(예: 매장지·묘실·영묘).`,
            list: [1, 2, 3, 4, 5].map((a) => ({ k: `${a}막`, v: `${ACT_COUNT[a] || 0}개 묶음` })),
          },
          {
            h: "우버 디아블로(클론 디아) 진행도는 왜 같이 보나요?",
            p: "우버 디아블로는 서버에서 조던의 돌이 일정량 팔릴 때 등장하는 별도 이벤트라, 공역 순환과 함께 확인하면 사냥 계획을 한 화면에서 세울 수 있습니다. 진행도는 외부 공개 데이터를 그대로 중계합니다.",
          },
        ]}
        faq={[
          { q: "알림이 안 울립니다.", a: "브라우저가 소리를 막고 있을 수 있습니다. 페이지를 한 번 클릭해 상호작용을 준 뒤 알림을 켜 주세요. 탭이 백그라운드에 있어도 동작하지만, 절전 모드로 들어간 기기에서는 지연될 수 있습니다." },
          { q: "관심 지역만 알림 받을 수 있나요?", a: "지역 옆 별표를 누르면 관심 목록에 저장되고, ‘관심만 알림’을 켜면 그 지역이 열릴 때만 알립니다. 저장은 이 브라우저에만 남으며 서버로 전송되지 않습니다." },
          { q: "지역 한글 이름이 게임과 다릅니다.", a: "일부 지역명은 게임 클라이언트 표기와 다를 수 있습니다. 확인되는 대로 고치고 있으니 다른 표기를 발견하시면 알려주세요." },
        ]}
      />
    </>
  );
}
