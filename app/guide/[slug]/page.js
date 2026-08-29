import Link from "next/link";
import { notFound } from "next/navigation";
import { BASE, OG_IMAGE } from "../../../lib/site-pages";
import { GUIDES, guideBySlug } from "../../../lib/guides";
import { PATH_LABELS } from "../../../lib/pages";

// 가이드 본문 — 서버 컴포넌트. 전부 정적으로 생성된다(generateStaticParams). 글 정본은 lib/guides.js.
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const g = guideBySlug(slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.summary,
    alternates: { canonical: `/guide/${g.slug}` },
    openGraph: { images: OG_IMAGE, url: `/guide/${g.slug}`, title: `${g.title} | D2R 대시보드`, description: g.summary, type: "article" },
  };
}

const H2 = { fontSize: 17, fontWeight: 800, color: "var(--parch)", margin: "22px 0 8px", wordBreak: "keep-all" };
const P = { lineHeight: 1.8, margin: "8px 0" };
const TH = { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--line)", color: "var(--parch)", fontSize: 13, whiteSpace: "nowrap" };
const TD = { padding: "6px 8px", borderBottom: "1px solid var(--line)", fontSize: 13, verticalAlign: "top" };

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const g = guideBySlug(slug);
  if (!g) notFound();

  // Article JSON-LD — 실재하는 값만(작성일·제목·요약·작성자). 평점·이미지 갤러리 같은 없는 것은 넣지 않는다.
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.summary,
    datePublished: g.date,
    dateModified: g.date,
    inLanguage: "ko",
    author: { "@type": "Person", name: "cushak" },
    publisher: { "@type": "Organization", name: "D2R 대시보드" },
    mainEntityOfPage: `${BASE}/guide/${g.slug}`,
    about: { "@type": "VideoGame", name: "Diablo II: Resurrected", alternateName: "디아블로2 레저렉션" },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <article className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">
            <Link href="/guide" style={{ color: "inherit" }}>가이드</Link> · {g.date}
          </div>
          <h1 className="zname" style={{ wordBreak: "keep-all" }}>{g.title}</h1>
          {/* 앤서 캡슐 — 두괄식 요약(CLAUDE.md §15). */}
          <p className="zen" style={{ ...P, fontSize: 14 }}>{g.summary}</p>

          {g.sections.map((s) => (
            <section key={s.h}>
              <h2 style={H2}>{s.h}</h2>
              {s.p.map((t, i) => <p key={i} className="zen" style={P}>{t}</p>)}
              {s.list && (
                <ul className="info" style={{ marginTop: 8 }}>
                  {s.list.map(([k, v]) => <li key={k}><b>{k}</b><span>{v}</span></li>)}
                </ul>
              )}
              {s.table && (
                <div style={{ overflowX: "auto", marginTop: 8 }}>
                  <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead><tr>{s.table.head.map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>{s.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={TD}>{c}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
              {s.p2?.map((t, i) => <p key={`p2-${i}`} className="zen" style={P}>{t}</p>)}
            </section>
          ))}

          {g.faq?.length > 0 && (
            <section>
              <h2 style={H2}>자주 묻는 질문</h2>
              {g.faq.map((f) => (
                <div className="note" key={f.q}><b style={{ color: "var(--parch)" }}>Q. {f.q}</b><br />{f.a}</div>
              ))}
            </section>
          )}
        </div>

        <div className="card">
          <div className="eyebrow gold">이 글과 함께 쓰는 도구</div>
          <ul className="chips" style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
            {g.related.map((href) => (
              <li key={href}><Link href={href} className="chip" style={{ display: "inline-block" }}>{PATH_LABELS[href] ?? href}</Link></li>
            ))}
          </ul>
          <p className="zen" style={{ marginTop: 10, fontSize: 12 }}>
            다른 글: {GUIDES.filter((x) => x.slug !== g.slug).map((x, i) => (
              <span key={x.slug}>{i > 0 && " · "}<Link href={`/guide/${x.slug}`} style={{ color: "var(--gold)" }}>{x.title}</Link></span>
            ))}
          </p>
        </div>
      </article>
    </main>
  );
}
