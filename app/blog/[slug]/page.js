import Link from "next/link";
import { notFound } from "next/navigation";
import { BASE, OG_IMAGE } from "../../../lib/site-pages";
import { PATH_LABELS } from "../../../lib/pages";
import { BLOG_META } from "../../../lib/blog-meta";
import { BLOG_CONTENT } from "../../../lib/blog-content";

// 블로그 글 — 서버 컴포넌트, 전부 정적 생성. 본문은 lib/blog-sanitize.js 허용목록을 통과한 HTML 이라
// dangerouslySetInnerHTML 로 그린다(태그·속성 허용목록 밖은 동기화 단계에서 이미 버려졌다 — test/blog.test.mjs).
export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_META.map((p) => ({ slug: p.slug }));
}

// Next 가 한글 세그먼트를 인코딩된 채로 넘기는 경우가 있어 양쪽 다 받는다.
function find(raw) {
  let s = raw;
  try { s = decodeURIComponent(raw); } catch {}
  return BLOG_META.find((p) => p.slug === s || p.slug === raw);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = find(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: {
      type: "article",
      url: `/blog/${p.slug}`,
      title: `${p.title} | D2R 대시보드`,
      description: p.excerpt,
      images: p.thumb ? [p.thumb.src] : OG_IMAGE,
      publishedTime: p.date,
      modifiedTime: p.modified,
    },
  };
}

// 제목 낱말 → 이 사이트 도구. 글을 읽다 수치를 직접 계산해 볼 곳으로 잇는다(손으로 이은 문맥 링크).
const TOOL_HINTS = [
  [/룬워드|룬 /, "/runewords"],
  [/룬조합|큐브|승급/, "/cube"],
  [/패캐|공속|구간표|프레임|타격 회복/, "/breakpoints"],
  [/스킬트리|빌드|세팅|육성/, "/build"],
  [/파밍|드랍|드롭|카운테스|매찬/, "/drops"],
  [/테러존|공포의 영역/, "/terror-zone"],
];

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const p = find(slug);
  if (!p) notFound();

  const idx = BLOG_META.indexOf(p);
  const newer = BLOG_META[idx - 1];
  const older = BLOG_META[idx + 1];
  const tools = [...new Set(TOOL_HINTS.filter(([re]) => re.test(p.title)).map(([, href]) => href))].slice(0, 3);

  // Article JSON-LD — 실재하는 값만(제목·요약·작성/수정일·대표 이미지·작성자).
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.excerpt,
    datePublished: p.date,
    dateModified: p.modified,
    inLanguage: "ko",
    author: { "@type": "Person", name: "cushak" },
    publisher: { "@type": "Organization", name: "D2R 대시보드" },
    mainEntityOfPage: `${BASE}/blog/${encodeURIComponent(p.slug)}`,
    ...(p.thumb ? { image: `${BASE}${p.thumb.src}` } : {}),
    about: { "@type": "VideoGame", name: "Diablo II: Resurrected", alternateName: "디아블로2 레저렉션" },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <article className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">
            <Link href="/blog" style={{ color: "inherit" }}>블로그</Link> · {p.date}
            {p.modified !== p.date && <> · 수정 {p.modified}</>}
          </div>
          <h1 className="zname" style={{ wordBreak: "keep-all" }}>{p.title}</h1>
          <div className="post-body" dangerouslySetInnerHTML={{ __html: BLOG_CONTENT[p.slug] }} />
        </div>

        <div className="card">
          {tools.length > 0 && (
            <>
              <div className="eyebrow gold">이 글과 함께 쓰는 도구</div>
              <ul className="chips" style={{ listStyle: "none", margin: "8px 0 14px", padding: 0 }}>
                {tools.map((href) => (
                  <li key={href}><Link href={href} className="chip" style={{ display: "inline-block" }}>{PATH_LABELS[href] ?? href}</Link></li>
                ))}
              </ul>
            </>
          )}
          <div className="eyebrow gold">다른 글</div>
          <ul className="info" style={{ marginTop: 8 }}>
            {newer && <li><b>다음 글</b><span><Link href={`/blog/${newer.slug}`} style={{ color: "var(--gold)" }}>{newer.title}</Link></span></li>}
            {older && <li><b>이전 글</b><span><Link href={`/blog/${older.slug}`} style={{ color: "var(--gold)" }}>{older.title}</Link></span></li>}
            <li><b>전체</b><span><Link href="/blog" style={{ color: "var(--gold)" }}>블로그 글 {BLOG_META.length}편 모두 보기</Link></span></li>
          </ul>
        </div>
      </article>
    </main>
  );
}
