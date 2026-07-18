import Link from "next/link";
import { getAllPosts } from "../../lib/blog";

export const metadata = {
  title: "블로그 — D2R 공략·데이터 가이드",
  description:
    "디아블로2 레저렉션(D2R) 파밍·룬워드·드롭 위치 공략을 게임 데이터 근거로 정리합니다. 통념이 아니라 드롭 표·룬워드 데이터로 확인한 가이드.",
  alternates: { canonical: "/blog" },
  openGraph: {
    url: "https://diablo-dashboard-phi.vercel.app/blog",
    title: "블로그 | D2R 대시보드",
    description: "게임 데이터 근거로 정리한 D2R 파밍·공략 가이드.",
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();
  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">블로그</div>
          <h1 className="zname">D2R 공략·데이터 가이드</h1>
          <p className="zen">
            게임 데이터 근거로 정리한 디아블로2 레저렉션 파밍·룬워드·드롭 위치 공략입니다. 통념이 아니라 드롭
            표·룬워드 데이터로 확인한 내용만 싣습니다.
          </p>
        </div>

        {posts.length === 0 && (
          <div className="card">
            <p className="zen">아직 발행된 글이 없습니다.</p>
          </div>
        )}

        <div className="stack">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="card blog-card">
              {p.date && <div className="blog-date">{p.date}</div>}
              <div className="blog-title">{p.title}</div>
              {p.description && <div className="blog-excerpt">{p.description}</div>}
              <div className="rw-more">글 읽기 ▸</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
