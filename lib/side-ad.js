// 사이드 배너(쿠팡 파트너스) **정본** — 화면 오른쪽 여백에 고정 노출되는 광고.
//
// 사장님 지시(2026-08-09): D2R 대시보드와 예산플래너는 **오른쪽/왼쪽 빈 공간에 광고가 계속 노출**되게 한다.
//
// ── 이건 lib/affiliate.js 의 카드와 **다른 물건**이다
//
//   lib/affiliate.js 의 카드는 "안 놓는 곳" 목록이 길다 — /terror-zone, /prices, /grail …
//   근거는 **도구 화면 한가운데를 상품이 가로막는다**는 것이었다.
//   사이드 배너는 가운데가 아니라 **여백**에 뜨고 position:fixed 라 문서 흐름 밖이다.
//   즉 도구를 밀지도, 흔들지도 않는다 — /terror-zone 의 CLS 를 0.387 → 0.041 로 줄이려고
//   `.tz-shell` 에 예약해 둔 높이는 그대로다(레일은 레이아웃에 참여하지 않는다).
//   ⚠️ 그래서 이 파일엔 "안 놓는 곳" 목록이 없다. 대신 **흐름 밖**이라는 전제를 지켜야 한다 —
//      test/side-ad.test.mjs 가 position:fixed 와 기본 display:none 을 강제한다.
//
// ── 이미지가 왜 아직 없나 (2026-08-09 실측)
//
//   "링크 가서 이미지 크롤링해서 붙여라"는 지시로 세 경로를 다 시도했고 전부 막혔다:
//     · fetch + 브라우저 UA        → 403 Access Denied
//     · 실제 크롬(claude-in-chrome) → 도메인 제한으로 차단
//     · 헤드리스 크롬 + UA 위장     → 403 Access Denied
//   쿠팡 상품 페이지는 봇을 막는다(제휴 링크 자체는 302 로 멀쩡하다 — 별개 문제이고
//   MA/scripts/check-affiliate-links.mjs 머리말에 적어 뒀다).
//
//   상품 사진을 지어내지 않는다. AI 로 "마우스 비슷한 그림"을 만들어 실제 파는 물건인 양 걸면
//   그건 광고가 아니라 거짓말이다.
//
//   ⇒ 그래서 **이미지는 선택 사항**이고, 없으면 글자 카드로 뜬다. 지금 바로 켜진다.
//      이미지는 `public/ads/` 에 저장하고 아래 항목에 image·w·h 만 채우면 사진 카드로 바뀐다.
//      **로컬 파일만** — 쿠팡이 주는 <iframe>·CDN 주소를 쓰면 전 페이지에 서드파티 요청이 붙는다.
//      test/side-ad.test.mjs 가 "/ads/" 로 시작하는지 강제한다.
//
// ── 주제
//   lib/affiliate.js 와 같다 — 디아블로2는 클릭이 많은 게임이라 마우스·패드·키보드가 실제로 관련 있다.
//   ⛔ 게임 소프트웨어·아이템 거래는 절대 금지. 약관 위반이고 여기는 비공식 팬 사이트다.

/**
 * url 은 lib/affiliate.js 의 것과 **같은 링크를 쓴다**(같은 상품이니까).
 * test/side-ad.test.mjs 가 두 목록의 링크를 대조한다 — 한쪽만 고쳐서 죽은 링크가 남는 것을 막는다.
 *
 * 필드: name · text(한 줄, 레일이 160px 라 20자 안팎) · url · image?(=/ads/…) · w? · h?
 */
export const SIDE_ADS = [
  {
    name: "람주 프리플로우 MAYA X 8K",
    text: "클릭이 많은 게임, 손목 부담이 준다",
    url: "https://link.coupang.com/a/f39YgJH2B2",
    image: "/ads/mouse.webp",
    w: 320,
    h: 298,
  },
  {
    name: "조위 e스포츠 마우스 패드",
    text: "낮은 감도로 넓게 쓰는 조작에 맞다",
    url: "https://link.coupang.com/a/f392ndWWQe",
    image: "/ads/mousepad.webp",
    w: 320,
    h: 299,
  },
  {
    name: "에이티케이 래피드 트리거 8K",
    text: "스킬·물약 단축키를 오래 누른다",
    url: "https://link.coupang.com/a/f397sjx7Qr",
    image: "/ads/keyboard.webp",
    w: 320,
    h: 310,
  },
  {
    name: "손목 받침",
    text: "파밍은 한 자리에 오래 앉는 일이다",
    url: "https://link.coupang.com/a/f398Vw77yC",
    image: "/ads/wrist-rest.webp",
    w: 320,
    h: 328,
  },

  // ⚠️ 늘리기 전에: 레일은 화면 높이가 정해져 있다. 4개가 이미 꽉 찬 편이고,
  //    넘치면 레일 안에서 스크롤되는데 그건 아무도 안 본다는 뜻이다.
  //    클릭이 0인 항목은 빼는 것이 갱신이다(MA/docs/제휴-광고-전략.md 5절).
];

/** 링크가 실제로 있는 배너만. */
export function activeSideAds() {
  return SIDE_ADS.filter((a) => String(a.url).trim().length > 0);
}
