"use client";

import { useEffect } from "react";
import { pullIfNewer } from "../../lib/sync";

// 앱 마운트 시 1회: 다른 기기가 서버 상태를 갱신했으면 당겨와 반영하고 화면을 새로 그린다.
// 렌더링 출력은 없다(로직 전용). 코드가 연결돼 있지 않으면 아무 일도 하지 않는다.
export default function SyncBootstrap() {
  useEffect(() => {
    let cancelled = false;
    pullIfNewer().then((changed) => {
      if (changed && !cancelled) window.location.reload();
    });
    return () => { cancelled = true; };
  }, []);
  return null;
}
