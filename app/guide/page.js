import Link from "next/link";
import { OG_IMAGE } from "../../lib/site-pages";
import { GUIDES } from "../../lib/guides";

// 가이드 목차 — 서버 컴포넌트. 글 정본은 lib/guides.js.
export const metadata = {
  title: "D2R 가이드 — 게임 데이터로 확인한 디아블로2 레저렉션 글",
  description:
    `디아블로2 레저렉션(D2R) 가이드 ${GUIDES.length}편. 고룬 드롭 위치, 카운테스 룬 파밍, 룬워드 완성 조건, 공포의 영역 원리를 게임 데이터의 드롭 표·룬워드 표에서 직접 확인해 한국어로 정리했습니다.`,
  alternates: { canonical: "/guide" },
  openGraph: { images: OG_IMAGE, url: "/guide", title: "D2R 가이드 | D2R 대시보드", description: "게임 데이터로 확인한 디아블로2 레저렉션 글 모음." },
};

export default function GuideIndex() {
  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">가이드</div>
          <h1 className="zname">게임 데이터로 확인한 D2R 글</h1>
          <p className="zen" style={{ marginTop: 8, lineHeight: 1.75 }}>
            소문이나 경험담이 아니라 게임 데이터(드롭 표·룬워드 표·지역 목록)에서 확인한 것만 씁니다. 숫자와 목록은
            이 사이트의 도구가 쓰는 같은 데이터에서 계산하며, 확률처럼 데이터에 없는 것은 없다고 밝힙니다.
          </p>
        </div>
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guide/${g.slug}`} className="card" style={{ display: "block", textDecoration: "none" }}>
            <div className="eyebrow gold">{g.date}</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--parch)", margin: "6px 0", wordBreak: "keep-all" }}>{g.title}</h2>
            <p className="zen" style={{ lineHeight: 1.7 }}>{g.summary}</p>
            <span style={{ color: "var(--gold)", fontSize: 13 }}>읽기 →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
