import { activeProducts } from "../../lib/affiliate";

/**
 * 제휴(쿠팡 파트너스) 카드 — 홈 하단과 /about 하단에만 쓴다.
 *
 * 지키는 것:
 *  1. **고지가 카드보다 위.** 공정위 추천·보증 심사지침이 요구하는 것은 '존재'가 아니라
 *     소비자가 쉽게 인식할 수 있는 **위치와 크기**다. 링크를 누르기 전에 읽히는 자리.
 *     형제 사이트 강냥에서 이걸 아래에 뒀다가 2026-08-08 에 고쳤다. 다시 내리지 마라.
 *  2. **rel="sponsored nofollow noopener"** — 하나라도 빠지면 광고를 추천으로 넘기는 셈이다.
 *  3. **링크가 없으면 아무것도 안 그린다.** "준비 중" 같은 빈 자리를 남기지 않는다.
 *  4. **도구 화면에는 쓰지 않는다.** 어디에 놓고 어디에 안 놓는지는 lib/affiliate.js 머리말에 있고,
 *     test/affiliate.test.mjs 가 그 목록을 강제한다.
 */
export default function AffiliateCards() {
  const products = activeProducts();
  if (products.length === 0) return null;

  return (
    <div className="card">
      <div className="eyebrow gold">이 게임을 오래 하는 사람들이 쓰는 것</div>

      {/* ★ 고지는 반드시 카드보다 위. 내리지 마라. */}
      <p className="zen" style={{ marginTop: 8 }}>
        이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
        게임 데이터와 무관한 실물 주변기기입니다. 이 사이트는 제품을 직접 시험해 보지 않았고,
        아래는 이 게임의 조작 방식과 관련이 있다고 판단한 예시입니다.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {products.map((p) => (
          <div key={p.url} style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            <div style={{ fontWeight: 700, color: "var(--parch)" }}>{p.name}</div>
            <div className="zen" style={{ marginTop: 2 }}>{p.note}</div>
            <a
              className="ti-btn alt"
              href={p.url}
              rel="sponsored nofollow noopener"
              target="_blank"
              style={{ marginTop: 8 }}
            >
              쿠팡에서 보기 →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
