"use client";

import { usePathname } from "next/navigation";
import { activeSideAds } from "../../lib/side-ad";
import { pickN, won } from "../../lib/coupang";
import { useCoupangProducts } from "./useCoupang";

/**
 * 여백에 고정으로 붙는 사이드 배너 — **모든 페이지**(app/layout.js 에서 붙인다).
 *   · 오른쪽(기본): ≥1360px.   · 왼쪽(`side="left"`): ≥1680px — 2026-08-27 "공격적 노출" 지시로 추가.
 *   두 레일은 다른 상품을 고른다(경로 해시에 side 를 섞는다).
 *
 * 2026-08-27 부터 두 겹이다:
 *   · 서버 렌더·첫 화면: lib/side-ad.js 의 정적 배너 4개(로컬 이미지) — 지금까지와 같다.
 *   · 마운트 후: /api/coupang 이 준 상품(쿠팡 파트너스 Open API) 중 경로별로 4개를 골라 같은 자리에 넣는다.
 *     API 가 없거나(키 미설정) 실패하면 정적 배너가 그대로 남는다 — **광고가 비는 상태는 없다.**
 *   교체는 position:fixed 안에서만 일어나 본문을 밀지 않는다. 이미지 칸 높이는 CSS 가 84px 로 고정한다.
 *
 * 지키는 것:
 *  1. **고지가 배너보다 위.** 공정위 추천·보증 심사지침이 요구하는 것은 '존재'가 아니라 소비자가
 *     쉽게 인식할 수 있는 위치·크기다. 누르기 전에 읽히는 자리여야 한다.
 *     형제 사이트 강냥에서 이걸 아래에 뒀다가 2026-08-08 에 고쳤다. 다시 내리지 마라.
 *  2. **rel="sponsored nofollow noopener"** — 하나라도 빠지면 광고를 추천으로 넘기는 셈이다.
 *  3. **링크가 없으면 아무것도 안 그린다.** "준비 중" 같은 빈 자리를 남기지 않는다.
 *
 * 왜 position:fixed 인가 — 문서 흐름 밖이라 본문 폭·순서를 건드리지 않는다. 이 사이트에서는 그게
 * 특히 중요하다: /terror-zone 은 정각 직전에 급히 보는 화면이고, CLS 를 0.387 → 0.041 로 줄이려고
 * `.tz-shell` 에 높이를 예약해 뒀다. 레일이 흐름에 참여하면 그 작업이 무너진다.
 * 좁은 화면에서는 CSS 한 줄로 사라진다(globals.css 의 `.side-rail`).
 *
 * API 상품 사진은 쿠팡 광고 서버(ads-partners.coupang.com)에서 온다 — 전 페이지에 서드파티 이미지 요청이
 * 생긴다는 뜻이고 개인정보처리방침 7항이 그 사실을 적는다(2026-08-27). 정적 배너 이미지는 여전히 로컬이다.
 *
 * ⚠️ 여기에 스크립트나 프레임 요소를 넣지 마라. 전 페이지에 붙는 물건이라 무게가 그대로 곱해진다.
 *    test/side-ad.test.mjs 가 막는다(주석은 걷어내고 코드만 본다).
 */
export default function SideRail({ side = "right" }) {
  const pathname = usePathname();
  const products = useCoupangProducts();
  const api = pickN(products, `${pathname ?? "/"}#${side}`, 4);
  const ads = api.length
    ? api.map((p) => ({ key: p.id, url: p.url, image: p.image, w: 140, h: 84, name: p.name, text: `${won(p.price)}${p.rocket ? " · 로켓배송" : ""}`, lazy: true }))
    : activeSideAds().map((a) => ({ key: a.url, ...a }));
  if (ads.length === 0) return null;

  return (
    <aside className={side === "left" ? "side-rail left" : "side-rail"} aria-label="광고">
      {/* ★ 고지는 반드시 배너보다 위. 내리지 마라. */}
      <p className="side-rail-disc">쿠팡 파트너스 활동의 일환으로 수수료를 제공받습니다.</p>

      {ads.map((ad) => (
        <a
          key={ad.key}
          href={ad.url}
          rel="sponsored nofollow noopener"
          target="_blank"
          referrerPolicy="no-referrer"
          className="side-rail-item"
        >
          {ad.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- 정적 배너는 로컬 최종 크기, API 상품은 쿠팡 광고 서버 원본.
            // 둘 다 CSS 가 84px 칸에 contain 으로 맞추므로 next/image 최적화 요청을 한 번 더 낼 이유가 없다.
            <img src={ad.image} alt={ad.name} width={ad.w} height={ad.h} loading={ad.lazy ? "lazy" : undefined} />
          ) : null}
          <strong>{ad.name}</strong>
          <span>{ad.text}</span>
          <em>쿠팡에서 보기 →</em>
        </a>
      ))}
    </aside>
  );
}
