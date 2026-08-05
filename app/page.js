import Link from "next/link";
import PageGuide from "./components/PageGuide";
import { RW } from "../lib/runewords";
import { RUNES } from "../lib/cube";
import { TERROR_ZONES } from "../lib/zones";
import { BASE, SITE_PAGES } from "../lib/site-pages";

// 루트(/)는 실제 랜딩 페이지다(2026-07-18 사장님 확정). 이전엔 /terror-zone으로 리다이렉트했으나,
// 홈이 자체 색인·랭킹되고 전 탭으로 가는 내부 링크 허브가 되도록 실물 페이지로 전환했다.
export const metadata = {
  title: "디아블로2 레저렉션 통합 대시보드 (D2R) — 테러존·빌드·룬워드·아이템·파밍",
  description:
    "디아블로2 레저렉션(D2R) 올인원 대시보드. 공포의 영역(테러존) 실시간 시간표, 직업별 빌드 가이드, 룬워드·홀리그레일·신규 아이템, 파밍 체크·드롭 위치, 프레임(FCR/FHR) 기준, 호라드릭 큐브 조합법, 룬 재고 계산까지 한 곳에서.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "디아블로2 레저렉션 통합 대시보드 (D2R)",
    description:
      "공포의 영역 시간표 · 빌드 가이드 · 룬워드 · 홀리그레일 · 파밍 · 프레임 · 큐브를 한 곳에서.",
  },
};

// 홈 허브 — 내부 링크로 전 탭을 잇는다(크롤 발견성 + 사용자 진입). label은 TabNav 정본과 일치.
const HUB = [
  { href: "/terror-zone", label: "공포의 영역", desc: "실시간 테러존 시간표 · 정각 카운트다운 · 음성 알림 · 우버 디아 진행도" },
  { href: "/build", label: "빌드 가이드", desc: "8직업 대표 빌드 — 스킬·스탯·티어·플레이어/용병 장비" },
  { href: "/breakpoints", label: "프레임 기준", desc: "시전(FCR)·타격 회복(FHR)·막기·이동 브레이크포인트 표" },
  { href: "/grail", label: "아이템 (연대기)", desc: "홀리 그레일 수집 추적 — 고유·세트·룬워드 진행도" },
  { href: "/runewords", label: "룬워드", desc: "전 룬워드 검색·필터·즐겨찾기" },
  { href: "/new-items", label: "신규 아이템", desc: "3.x 신규 고유/세트 · 트레더리 시세 검색" },
  { href: "/farming", label: "파밍 체크", desc: "지역·보스별 파밍 체크리스트" },
  { href: "/drops", label: "드롭 위치", desc: "아이템별 드롭 지역(트레저 클래스 기반)" },
  { href: "/prices", label: "시세 지수", desc: "룬·주요 아이템 시세 지수" },
  { href: "/cube", label: "호라드릭 큐브", desc: "큐브 조합법 검색" },
  { href: "/planner", label: "룬 재고", desc: "룬워드 제작에 필요한 룬 재고 계산" },
  { href: "/rune-plan", label: "룬 추천", desc: "내 룬으로 완성에 가까운 룬워드 추천 · 룬별 역참조" },
  { href: "/backup", label: "백업", desc: "개인 진행 데이터 JSON 내보내기·복원" },
];

// WebSite 구조화 데이터(JSON-LD). SearchAction(사이트링크 검색박스)은 `?q=` 검색 결과 URL이
// 실제로 없어서 넣지 않는다(유효하지 않은 마크업은 해가 된다). Organization 로고도 정사각 로고
// 자산이 없어 생략 — 실재하는 것만 표기한다.
const LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "디아블로2 레저렉션 통합 대시보드",
  alternateName: "D2R 대시보드",
  url: `${BASE}/`,
  description:
    "디아블로2 레저렉션(D2R) 올인원 대시보드 — 공포의 영역 시간표, 빌드 가이드, 룬워드·홀리그레일·신규 아이템, 파밍·드롭 위치, 프레임 기준, 큐브, 룬 재고.",
  inLanguage: "ko",
};

export default function HomePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }}
      />
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">디아블로2 레저렉션 통합 대시보드</div>
          <h1 className="zname">D2R에 필요한 도구를 한 곳에서</h1>
          <p className="zen">
            공포의 영역(테러존) 시간표부터 직업별 빌드, 룬워드·홀리그레일·신규 아이템, 파밍·드롭 위치,
            프레임 기준, 큐브 조합법, 룬 재고까지 — 디아블로2 레저렉션 플레이에 필요한 정보와 도구를 모았습니다.
            개인 진행(그레일·파밍·즐겨찾기·룬 재고)은 <b>브라우저에 로컬 저장</b>되며 <Link href="/backup" style={{ color: "var(--gold)" }}>백업</Link>에서
            내보내고 복원할 수 있습니다.
          </p>
        </div>

        <div className="card">
          <div className="eyebrow gold">바로가기</div>
          <div className="home-grid">
            {HUB.map((t) => (
              <Link key={t.href} href={t.href} className="home-card">
                <div className="home-card-t">{t.label}</div>
                <div className="home-card-d">{t.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="note">
          외부 실시간 데이터(테러존·시세)는 공개 API를 프록시하며, 개인 진행 데이터는 브라우저에 로컬 저장됩니다.
          자세한 내용은 <Link href="/privacy" style={{ color: "var(--gold)" }}>개인정보처리방침</Link>을 참고하세요.
          문의·오류 제보는 각 페이지의 제보 기능을 이용해 주세요.
        </div>
      </div>
      <PageGuide
        eyebrow="사이트 안내"
        capsule={`디아블로2 레저렉션(D2R) 플레이에 필요한 도구 ${SITE_PAGES.length - 1}개를 한 곳에 모은 한국어 대시보드입니다. 공포의 영역 ${TERROR_ZONES.length}개 묶음의 실시간 시간표, 룬워드 ${RW.length}종과 룬 ${RUNES.length}종의 조합·재고 계산, 드롭 위치, 시세 지수를 제공합니다. 계정 없이 바로 쓸 수 있고, 진행 상황은 서버가 아니라 브라우저에 저장됩니다.`}
        sections={[
          {
            h: "무엇을 할 수 있나요?",
            p: "크게 세 갈래입니다 — 지금 뭘 할지 정하는 도구, 아이템을 찾고 계산하는 도구, 내 진행을 기록하는 도구.",
            list: [
              { k: "지금 뭐하지", v: "공포의 영역 실시간 시간표 · 일일/주간 파밍 체크" },
              { k: "찾고 계산하기", v: `룬워드 ${RW.length}종 조합 · 호라드릭 큐브 승급 · 룬 재고 판정 · 드롭 위치 · 시세 지수 · 프레임 기준` },
              { k: "기록하기", v: "아이템 수집(연대기) 트래커 · 즐겨찾기 · 백업 내보내기/복원" },
            ],
          },
          {
            h: "데이터는 어디서 오나요?",
            p: "아이템·룬워드·드롭 위치는 게임 데이터에서 직접 추출해 한국어로 정리했습니다. 공포의 영역과 우버 디아블로 진행도는 공개 API를 중계하며, 시세는 정적 기준선과 이용자 익명 제보를 함께 보여줍니다. 시세는 비공식·참고용이며 실시간이 아닙니다.",
          },
          {
            h: "내 기록은 서버에 저장되나요?",
            p: "아니요. 수집 진행·파밍 체크·즐겨찾기·룬 재고는 모두 이 브라우저에만 저장되며 계정도 로그인도 없습니다. 기기를 옮기려면 백업 탭에서 JSON으로 내보낸 뒤 다른 기기에서 가져오면 됩니다.",
          },
        ]}
        faq={[
          { q: "모바일에서도 되나요?", a: "됩니다. 별도 앱 설치 없이 브라우저에서 그대로 쓰도록 만들었습니다." },
          { q: "어느 패치 기준인가요?", a: "패치 3.2(악마술사의 군림) 기준입니다. 3.0~3.2 신규 룬워드와 신규 아이템도 포함하되, 아직 비공식인 정보는 화면에 ‘검증 필요’로 표시합니다." },
          { q: "정보가 틀렸습니다.", a: "게임 클라이언트 실측이 정본입니다. 다른 표기나 수치를 발견하시면 알려주시면 확인해 고칩니다 — 실제로 룬 한글 표기 6건이 그렇게 정정됐습니다." },
        ]}
      />
    </main>
  );
}
