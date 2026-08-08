"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 탭 목록의 정본은 lib/pages.js 다. 여기에 두 번째 사본을 만들지 마라 —
// 전에 그렇게 갈라져서 홈 포함 6개 경로가 통계에서 통째로 빠져 있었다(2026-08-08 수정).
// 순서·명칭의 확정 근거도 그 파일 주석에 있다.
import { TABS } from "../../lib/pages";

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
