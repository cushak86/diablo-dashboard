"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { activeSideAds, pickForPath } from "../../lib/side-ad";
import { pickN, won } from "../../lib/coupang";
import { useCoupangProducts } from "./useCoupang";

/**
 * 좁은 화면용 하단 고정 광고 — **사이드 레일이 안 뜨는 모든 폭**을 덮는다.
 *
 * 왜 만들었나 (2026-08-09): 레일을 1360px 이상에서만 켜 놓으니 **모바일·태블릿에는 광고가 0** 이었다.
 * 사장님 지시는 "모든 페이지에 계속 노출"인데 폭 조건 때문에 절반이 비어 있었다.
 * globals.css 의 `.bottom-ad` 는 1359px **이하**에서만 뜬다 — 레일과 정확히 상보적이고,
 * test/side-ad.test.mjs 가 두 브레이크포인트가 어긋나지 않는지 본다.
 *
 * 2026-08-27 부터 상품은 /api/coupang(쿠팡 파트너스 Open API)에서 온다. 첫 렌더와 API 실패 시엔
 * 정적 배너(lib/side-ad.js) — SideRail 과 같은 폴백 규칙이다.
 *
 * 이 사이트에서 특히 조심할 것: /terror-zone 은 정각 직전에 **급히 보는** 화면이다.
 * 그래서 (1) position:fixed 로 문서 흐름 밖에 두어 카운트다운을 밀지 않고,
 * (2) 높이를 한 줄로 묶고, (3) **닫을 수 있게** 했다. 급한 사람에게 안 닫히는 배너는 최악이다.
 *
 * 지키는 것:
 *  1. **고지가 상품명보다 위.** 좁아서 줄이되 "쿠팡 파트너스"와 "수수료"는 남긴다 —
 *     공정위가 요구하는 것은 존재가 아니라 소비자가 쉽게 인식할 수 있는 위치·크기다.
 *  2. **rel="sponsored nofollow noopener"**.
 *  3. **닫으면 그 세션 동안 안 뜬다.** localStorage 로 영구히 하면 광고가 영영 안 뜬다 —
 *     그건 끄는 게 아니라 없애는 것이다.
 *  4. **한 번에 하나만.** 경로 해시로 고르므로 페이지마다 다른 상품이 나오고,
 *     서버·클라이언트가 같은 값을 낸다(랜덤은 하이드레이션이 깨진다).
 */
const KEY = "d2r-bottomad-closed";
let listeners = [];

function subscribe(cb) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
function isClosed() {
  try {
    return typeof window !== "undefined" && window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
/** 서버에는 sessionStorage 가 없다. false 로 고정해야 하이드레이션이 어긋나지 않는다. */
function serverClosed() {
  return false;
}
function closeIt() {
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* 사생활 모드에서 실패해도 무해 — 이번 렌더에선 사라진다 */
  }
  listeners.forEach((l) => l());
}

export default function BottomAd() {
  const closed = useSyncExternalStore(subscribe, isClosed, serverClosed);
  const pathname = usePathname();
  const products = useCoupangProducts();
  const statics = activeSideAds();

  // 자동 회전(2026-08-27 "공격적 노출"): API 상품이 2개 이상이면 8초마다 다음 상품. 마운트 뒤에만 도니
  // 서버·첫 렌더는 여전히 경로 해시 하나로 고정이다(하이드레이션 안전). 닫기는 그대로 세션 동안 유지.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (products.length < 2) return;
    const id = setInterval(() => setTick((t) => t + 1), 8000);
    return () => clearInterval(id);
  }, [products.length]);

  if (statics.length === 0 && products.length === 0) return null;
  if (closed) return null;

  const order = products.length ? pickN(products, pathname ?? "/", products.length) : [];
  const p = order.length ? order[tick % order.length] : null;
  const ad = p
    ? { url: p.url, image: p.image, w: 44, h: 44, name: `${p.name} · ${won(p.price)}`, lazy: true }
    : pickForPath(statics, pathname ?? "/");

  return (
    <aside className="bottom-ad" aria-label="광고">
      <a
        className="bottom-ad-link"
        href={ad.url}
        rel="sponsored nofollow noopener"
        target="_blank"
        referrerPolicy="no-referrer"
      >
        {ad.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- 정적 배너는 레일과 같은 로컬 파일, API 상품은 쿠팡 광고 서버 원본. CSS 가 44px 로 고정.
          <img src={ad.image} alt="" width={ad.w} height={ad.h} loading={ad.lazy ? "lazy" : undefined} />
        ) : null}
        <span className="bottom-ad-text">
          {/* ★ 고지가 상품명보다 위. 순서를 바꾸지 마라. */}
          <em>광고 · 쿠팡 파트너스 수수료를 받습니다</em>
          <strong>{ad.name}</strong>
        </span>
        <span className="bottom-ad-go" aria-hidden="true">
          →
        </span>
      </a>
      <button type="button" className="bottom-ad-x" onClick={closeIt} aria-label="광고 닫기">
        ×
      </button>
    </aside>
  );
}
