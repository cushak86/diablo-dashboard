"use client";

import { useEffect, useRef } from "react";

// 아이템 상세 팝업의 **껍데기** — `/grail`·`/runewords` 가 함께 쓴다.
//
// 왜 껍데기만 뽑았나: 두 탭의 팝업은 바깥(오버레이·닫기·ESC·포커스)이 같고 **속만 다르다.**
//   /runewords 는 룬 조합·큐브 파밍 난이도가 있고, /grail 은 베이스·옵션만 있다.
//   속까지 하나로 만들면 그 고유 기능을 잃거나 조건문 범벅이 된다 → children 으로 받는다.
//
// 접근성이 여기 모인다(예전엔 /runewords 에만 있었다):
//   - ESC 로 닫기
//   - 열릴 때 팝업에 포커스, 닫힐 때 **연 버튼으로 되돌림**(키보드 사용자가 목록의 자리를 잃지 않는다)
//   - 오버레이 클릭은 닫기, 안쪽 클릭은 통과 금지
//
// CSS 는 `.rw-tip*` 를 그대로 쓴다 — 이름이 rw- 로 시작하지만 이미 두 탭이 공유하던 것이라
// 새 이름을 만들면 CSS 만 중복된다(2026-07-17: 새 디자인 언어를 만들지 않는다는 규율).
export default function ItemTip({ open, onClose, title, subtitle, type, children, footer }) {
  const dialogRef = useRef(null);
  const lastFocusRef = useRef(null);

  useEffect(() => {
    if (open) {
      lastFocusRef.current = document.activeElement;
      const onKey = (e) => { if (e.key === "Escape") onClose(); };
      document.addEventListener("keydown", onKey);
      dialogRef.current?.focus();
      return () => document.removeEventListener("keydown", onKey);
    }
    // 닫힐 때: 연 버튼으로 포커스 복귀
    if (lastFocusRef.current?.focus) {
      lastFocusRef.current.focus();
      lastFocusRef.current = null;
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="rw-tip-overlay" onClick={onClose}>
      <div
        className="rw-tip"
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="rw-tip-close" aria-label="닫기" onClick={onClose}>
          ×
        </button>
        <div className="rw-tip-name">{title}</div>
        {subtitle && <div className="rw-tip-kr">{subtitle}</div>}
        {type && <div className="rw-tip-type">{type}</div>}
        {children}
        {footer && <div className="rw-tip-req">{footer}</div>}
      </div>
    </div>
  );
}

/** 옵션 줄 목록 — mdb 가 렌더한 `text` 를 그대로 낸다(우리가 조립하지 않는다). */
export function StatList({ lines }) {
  if (!lines?.length) return null;
  return (
    <ul className="rw-tip-stats">
      {lines.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  );
}
