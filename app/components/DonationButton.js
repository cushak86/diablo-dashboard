"use client";

import { useEffect, useState } from "react";

const ACCOUNT_NUMBER = "100218713216";

export default function DonationButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAccount = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(ACCOUNT_NUMBER);
      } else {
        // 구형 브라우저·비보안 컨텍스트 폴백
        const ta = document.createElement("textarea");
        ta.value = ACCOUNT_NUMBER;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 복사 실패 시 조용히 무시 — 사용자는 번호를 직접 선택해 복사할 수 있음 */
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button className="donate-btn" onClick={() => { setCopied(false); setOpen(true); }}>
        ♥ 후원하기
      </button>

      {open && (
        <div className="donate-overlay" onClick={() => setOpen(false)}>
          <div
            className="donate-modal"
            role="dialog"
            aria-modal="true"
            aria-label="후원하기"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="donate-close"
              onClick={() => setOpen(false)}
              aria-label="닫기"
            >
              ×
            </button>

            <div className="donate-eyebrow">♥ SUPPORT</div>
            <p className="donate-lead">
              이 대시보드가 사냥에 조금이나마 보탬이 되셨나요?
            </p>
            <p className="donate-sub">
              커피 한 잔의 응원이 다음 기능으로 돌아옵니다. 함께해 주셔서 감사합니다.
            </p>

            <div className="donate-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/donation-qr.png" alt="후원 QR 코드" width={220} height={220} />
            </div>

            <div className="donate-account">
              <span className="donate-bank">토스뱅크</span>
              <span className="donate-num">{ACCOUNT_NUMBER}</span>
              <span className="donate-name">이*훈</span>
              <button
                type="button"
                className="donate-copy"
                onClick={copyAccount}
                aria-label="계좌번호 복사"
              >
                {copied ? "✓ 복사됨" : "복사"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
