import Link from "next/link";

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
  { href: "/backup", label: "백업", desc: "개인 진행 데이터 JSON 내보내기·복원" },
];

export default function HomePage() {
  return (
    <main>
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
          외부 실시간 데이터(테러존·시세)는 공개 API를 프록시하며, 개인 데이터는 서버에 저장하지 않습니다.
          문의·오류 제보는 각 페이지의 제보 기능을 이용해 주세요.
        </div>
      </div>
    </main>
  );
}
