"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// {path, dwellMs} 전송 — sendBeacon 우선, 미지원/실패 시 keepalive fetch 폴백.
function sendDwell(path, dwellMs) {
  try {
    const body = JSON.stringify({ path, dwellMs });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/track", blob)) return;
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // 전송 실패는 통계 손실일 뿐 — 무시
  }
}

// 라우트 변경·탭 이탈 시 이전 경로의 체류시간을 1회 전송.
// "이탈당 1 beacon" 모델: 조회수 중복 집계 없음(첫 hide 또는 다음 내비게이션 중 먼저 오는 것).
export default function PageTracker() {
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const startRef = useRef(Date.now());
  const sentRef = useRef(false);

  function flush() {
    if (sentRef.current) return; // 이 방문에 대해 이미 전송함(중복 방지)
    sentRef.current = true;
    sendDwell(pathRef.current, Date.now() - startRef.current);
  }

  // 경로 변경: 이전 경로 flush 후 새 경로로 타이머 리셋. 최초 마운트는 flush 안 함.
  useEffect(() => {
    if (pathRef.current !== pathname) {
      flush();
      pathRef.current = pathname;
      startRef.current = Date.now();
      sentRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 탭 숨김·언로드 시 flush(리스너는 ref만 읽으므로 1회 등록으로 충분).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onPageHide = () => flush();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
