import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "../../components/Markdown";
import { getAllPosts, getPost } from "../../../lib/blog";

const BASE = "https://diablo-dashboard-phi.vercel.app";

// 빌드 시 모든 글을 정적 생성(SSG). 색인 가능(noindex 없음) — 도메인 권위 축적이 목적.
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "글을 찾을 수 없음", robots: { index: false, follow: true } };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      url: `${BASE}/blog/${slug}`,
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  // Article 구조화 데이터 — 실재하는 값만(제목·설명·발행일·URL). 지어낸 저자/이미지 필드는 넣지 않는다.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    inLanguage: "ko",
    url: `${BASE}/blog/${slug}`,
    mainEntityOfPage: `${BASE}/blog/${slug}`,
    ...(post.date ? { datePublished: post.date, dateModified: post.date } : {}),
    publisher: { "@type": "Organization", name: "D2R 대시보드" },
  };

  return (
    <main>
      {/* `<`를 <로 이스케이프 — frontmatter에 </script>가 들어와도 태그를 못 닫게(저장형 XSS 방어). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">블로그</div>
          <h1 className="zname">{post.title}</h1>
          {post.date && <div className="blog-date">{post.date}</div>}
        </div>
        <div className="card md-body">
          <Markdown>{post.body}</Markdown>
        </div>
        <div className="card">
          <Link href="/blog" className="ti-btn alt">← 블로그 목록</Link>
        </div>
      </div>
    </main>
  );
}
