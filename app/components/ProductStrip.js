"use client";

import { usePathname } from "next/navigation";
import { activeSideAds } from "../../lib/side-ad";
import { pickN, won } from "../../lib/coupang";
import { useCoupangProducts } from "./useCoupang";

/**
 * 상품 스트립(쿠팡 파트너스) — 본문 **아래**에 놓는 광고. 두 곳에서 쓴다:
 *   · app/layout.js: 모든 페이지의 본문 끝(푸터 위) — 사장님 지시 2026-08-27 "조금 더 공격적인 노출".
 *   · AffiliateCards(홈·/about): 같은 것을 더 큰 묶음으로.
 *
 * 도구를 막지 않는 이유: 도구(카운트다운·판정기·검색) **다음**에 온다. 스크롤하지 않으면 안 보이고,
 * 스크롤하면 도구는 이미 다 쓴 뒤다. 도구 위·중간에는 여전히 안 놓는다(lib/affiliate.js 머리말).
 * /terror-zone 도 예외가 아니다 — 대신 카드 높이를 CSS 로 고정해(`.pstrip-item`) API 상품이 도착해도
 * 아무것도 움직이지 않는다(CLS 0). 첫 렌더는 정적 배너(lib/side-ad.js)라 서버 HTML 에도 상품이 있다.
 *
 * 지키는 것(다른 광고 컴포넌트와 같다):
 *  1. 고지가 링크보다 **위**. 2. rel="sponsored nofollow noopener". 3. 상품이 없으면 아무것도 안 그린다.
 */
export default function ProductStrip({ count = 6, seed = "strip", title = "이 게임을 오래 하는 사람들이 쓰는 것", intro }) {
  const pathname = usePathname();
  const products = useCoupangProducts();
  const api = pickN(products, `${pathname ?? "/"}#${seed}`, count);
  const items = api.length
    ? api.map((p) => ({ key: p.id, url: p.url, image: p.image, name: p.name, sub: `${won(p.price)}${p.rocket ? " · 로켓배송" : ""}`, lazy: true }))
    : activeSideAds().slice(0, count).map((a) => ({ key: a.url, url: a.url, image: a.image, name: a.name, sub: a.text }));
  if (items.length === 0) return null;

  return (
    <section className="pstrip" aria-label="광고">
      <div className="eyebrow gold">{title}</div>
      {/* ★ 고지는 반드시 카드보다 위. 내리지 마라. */}
      <p className="zen pstrip-disc">
        이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
        {intro ? ` ${intro}` : ""}
      </p>
      <div className="pstrip-row">
        {items.map((p) => (
          <a key={p.key} className="pstrip-item" href={p.url} rel="sponsored nofollow noopener" target="_blank" referrerPolicy="no-referrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- 정적 배너는 로컬, API 상품은 쿠팡 광고 서버. CSS 가 칸을 고정한다. */}
            <img src={p.image} alt="" width={120} height={120} loading={p.lazy ? "lazy" : undefined} />
            <strong>{p.name}</strong>
            <span>{p.sub}</span>
            <em>쿠팡에서 보기 →</em>
          </a>
        ))}
      </div>
    </section>
  );
}
