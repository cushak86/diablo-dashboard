import { activeSideAds } from "../../lib/side-ad";

/**
 * 오른쪽 여백에 고정으로 붙는 사이드 배너 — **모든 페이지**(app/layout.js 에서 한 번 붙인다).
 *
 * 지키는 것:
 *  1. **고지가 배너보다 위.** 공정위 추천·보증 심사지침이 요구하는 것은 '존재'가 아니라 소비자가
 *     쉽게 인식할 수 있는 위치·크기다. 누르기 전에 읽히는 자리여야 한다.
 *     형제 사이트 강냥에서 이걸 아래에 뒀다가 2026-08-08 에 고쳤다. 다시 내리지 마라.
 *  2. **rel="sponsored nofollow noopener"** — 하나라도 빠지면 광고를 추천으로 넘기는 셈이다.
 *  3. **링크가 없으면 아무것도 안 그린다.** "준비 중" 같은 빈 자리를 남기지 않는다.
 *
 * 이미지는 **선택**이다 — 쿠팡이 상품 페이지 크롤링을 막아서(lib/side-ad.js 머리말) 사진을 아직 못 넣는다.
 * 없으면 글자 카드로 뜨고, `public/ads/` 에 파일을 넣고 image·w·h 를 채우면 사진 카드가 된다.
 * **두 경우 다 지금 동작한다** — 이미지를 기다리느라 광고가 안 뜨는 상태를 만들지 않는다.
 *
 * 왜 position:fixed 인가 — 문서 흐름 밖이라 본문 폭·순서를 건드리지 않는다. 이 사이트에서는 그게
 * 특히 중요하다: /terror-zone 은 정각 직전에 급히 보는 화면이고, CLS 를 0.387 → 0.041 로 줄이려고
 * `.tz-shell` 에 높이를 예약해 뒀다. 레일이 흐름에 참여하면 그 작업이 무너진다.
 * 좁은 화면에서는 CSS 한 줄로 사라진다(globals.css 의 `.side-rail`).
 *
 * ⚠️ 여기에 스크립트나 프레임 요소를 넣지 마라. 전 페이지에 붙는 물건이라 무게가 그대로 곱해진다.
 *    test/side-ad.test.mjs 가 막는다(주석은 걷어내고 코드만 본다).
 */
export default function SideRail() {
  const ads = activeSideAds();
  if (ads.length === 0) return null;

  return (
    <aside className="side-rail" aria-label="광고">
      {/* ★ 고지는 반드시 배너보다 위. 내리지 마라. */}
      <p className="side-rail-disc">쿠팡 파트너스 활동의 일환으로 수수료를 제공받습니다.</p>

      {ads.map((ad) => (
        <a
          key={ad.url}
          href={ad.url}
          rel="sponsored nofollow noopener"
          target="_blank"
          referrerPolicy="no-referrer"
          className="side-rail-item"
        >
          {ad.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- 로컬 정적 배너. 이미 최종 크기로
            // 저장하므로 next/image 로 감싸 최적화 요청을 한 번 더 낼 이유가 없다.
            <img src={ad.image} alt={ad.name} width={ad.w} height={ad.h} />
          ) : null}
          <strong>{ad.name}</strong>
          <span>{ad.text}</span>
          <em>쿠팡에서 보기 →</em>
        </a>
      ))}
    </aside>
  );
}
