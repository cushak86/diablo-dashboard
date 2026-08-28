import ProductStrip from "./ProductStrip";

/**
 * 제휴(쿠팡 파트너스) 카드 — 홈 하단과 /about 하단에만 쓴다(test/affiliate.test.mjs 가 자리를 강제).
 *
 * 2026-08-27 부터 상품은 쿠팡 파트너스 API 에서 온다(ProductStrip). 전에는 lib/affiliate.js 의 손으로 고른
 * 4개였고 영원히 같았다. 정적 4개는 API 가 없을 때의 폴백으로 남는다.
 * 고지·rel·"없으면 안 그린다" 규칙은 ProductStrip 안에 있다.
 */
export default function AffiliateCards() {
  return (
    <div className="card">
      <ProductStrip
        count={8}
        seed="showcase"
        intro="게임 데이터와 무관한 실물 주변기기입니다. 이 사이트는 제품을 직접 시험해 보지 않았고, 이 게임의 조작 방식(클릭·단축키가 많다)과 관련이 있다고 판단한 검색 결과입니다."
      />
    </div>
  );
}
