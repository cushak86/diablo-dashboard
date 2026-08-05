// 페이지 하단 해설 블록. **서버 컴포넌트**다 — 프리렌더 HTML에 본문이 그대로 박힌다.
//
// 왜 필요했나: 도구 페이지들이 클라이언트 렌더라 **서버 렌더 본문이 거의 비어 있었다.**
//   2026-08-05 실측 — /terror-zone 341자(노출 125로 최다 유입 페이지인데 가장 얇았다) ·
//   /rune-plan 829자 · /farming 868자 · 홈 912자. 검색·심사 크롤러에는 빈 페이지로 보인다.
//
// 왜 하단인가: 이 페이지들의 주인공은 도구다. 위에 글을 쌓으면 사용자가 도구까지 스크롤해야 한다.
//   상단은 기존 짧은 소개(seo-intro)로 두고, 설명·FAQ는 도구를 쓴 뒤 읽도록 아래에 놓는다.
//
// 구조는 CLAUDE.md §15(GEO)를 따른다: 앤서 캡슐(두괄식 요약) → 대화형 H2(질문형) → FAQ Q&A.
// **가상의 전문가·통계는 넣지 않는다**(§15 단서·§7) — 아래 내용은 전부 이 저장소 데이터 실측값이거나
// 페이지가 실제로 하는 동작이다.
//
// 새 CSS를 만들지 않았다 — 기존 .wrap/.card/.eyebrow/.zen/.note/ul.info 를 그대로 쓴다.
export default function PageGuide({ eyebrow, capsule, sections = [], faq = [] }) {
  return (
    <div className="wrap" style={{ paddingBottom: 24 }}>
      <div className="card">
        {eyebrow && <div className="eyebrow gold">{eyebrow}</div>}
        {/* 앤서 캡슐 — 두괄식 요약. 인사말·서론 없이 결론부터. */}
        <p className="zen" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.75 }}>{capsule}</p>

        {sections.map((s) => (
          <section key={s.h}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--parch)", margin: "18px 0 6px", wordBreak: "keep-all" }}>
              {s.h}
            </h2>
            <p className="zen" style={{ lineHeight: 1.75 }}>{s.p}</p>
            {s.list && (
              <ul className="info" style={{ marginTop: 8 }}>
                {s.list.map((li) => (
                  <li key={li.k}><b>{li.k}</b><span>{li.v}</span></li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {faq.length > 0 && (
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--parch)", margin: "20px 0 6px" }}>자주 묻는 질문</h2>
            {faq.map((f) => (
              <div className="note" key={f.q}>
                <b style={{ color: "var(--parch)" }}>Q. {f.q}</b>
                <br />
                {f.a}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
