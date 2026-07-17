"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 순서·명칭은 사장님 확정(2026-07-17). 근거:
//   - 공역 → **공포의 영역**: 사이트 안에서 "공포의 영역" 46회 vs "공역" 9회(사실상 이 탭뿐)였고,
//     정작 이 탭의 메타 제목이 "공포의 영역 시간표"다. 탭만 혼자 다른 말을 썼다. ("공역"은 항공 용어와도 겹친다)
//   - 홀리 그레일 → **아이템 (연대기)**: 연대기(Chronicle)는 D2R 인게임 수집 기록 기능의 이름이다
//     (게임 데이터에도 `disableChronicle` 열로 존재). 커뮤니티 음차보다 게임이 쓰는 말이 낫다.
//   - 신규 아이템 (트레더리) → **신규 아이템**: 트레더리(Traderie)는 외부 사이트 이름이다.
//     구현 사정이 내비게이션에 샐 이유가 없다 — 페이지 안에 이미 설명돼 있다.
// 묶음: 지금뭐하지(공포의영역) → 공략(빌드·프레임) → 아이템(연대기·룬워드·신규) → 도구·기록
//   아이템 3탭을 붙인 건 의도적이다 — 내부를 한 엔진으로 합칠 대상이라 겉도 한 가족으로 보여야 한다
//   (docs/plans/2026-07-17-아이템탭-통합-설계.md).
const TABS = [
  { href: "/terror-zone", label: "공포의 영역" },
  { href: "/build", label: "빌드 가이드" },
  { href: "/breakpoints", label: "프레임 기준" },
  { href: "/grail", label: "아이템 (연대기)" },
  { href: "/runewords", label: "룬워드" },
  { href: "/new-items", label: "신규 아이템" },
  { href: "/farming", label: "파밍 체크" },
  { href: "/drops", label: "드롭 위치" },
  { href: "/prices", label: "시세 지수" },
  { href: "/cube", label: "호라드릭 큐브" },
  { href: "/planner", label: "룬 재고" },
  { href: "/backup", label: "백업" },
];

export default function TabNav() {
  const pathname = usePathname();
  return (
    <nav className="tabnav">
      <div className="wrap tabnav-inner">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`tab ${pathname === t.href ? "tab-active" : ""}`}
          >
            {t.label}
          </Link>
        ))}
        <Link
          href="/admin"
          className={`tab ${pathname === "/admin" ? "tab-active" : ""}`}
          style={{ marginLeft: "auto", border: "1px solid var(--gold)" }}
        >
          관리자모드
        </Link>
      </div>
    </nav>
  );
}
