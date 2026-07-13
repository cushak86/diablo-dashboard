"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/terror-zone", label: "공역" },
  { href: "/new-items", label: "신규 아이템 (트레더리)" },
  { href: "/runewords", label: "룬워드" },
  { href: "/grail", label: "홀리 그레일" },
  { href: "/farming", label: "파밍 체크" },
  { href: "/prices", label: "시세 지수" },
  { href: "/cube", label: "호라드릭 큐브" },
  { href: "/breakpoints", label: "프레임 기준" },
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
