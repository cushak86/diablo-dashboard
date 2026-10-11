import Link from "next/link";
import { OG_IMAGE } from "../../lib/site-pages";
import { BLOG_META } from "../../lib/blog-meta";

// 블로그 목차 — 서버 컴포넌트. 글은 scripts/sync-cafe24-blog.mjs 가 cushaks 블로그에서 옮겨 온 디아2 글이다
// (2026-10-11 「d2r로 이전」 — 이 사이트가 원본). 목록·사이트맵은 가벼운 lib/blog-meta.js 만 본다.
export const metadata = {
  title: "D2R 블로그 — 디아블로2 레저렉션 빌드·룬워드·육성 글",
  description: `디아블로2 레저렉션(D2R) 블로그 ${BLOG_META.length}편. 래더 시즌별 직업 빌드 세팅·스킬트리·룬워드·용병·맨땅 육성 루트를 정리한 글 모음.`,
  alternates: { canonical: "/blog" },
  openGraph: { images: OG_IMAGE, url: "/blog", title: "D2R 블로그 | D2R 대시보드", description: "디아블로2 레저렉션 빌드·룬워드·육성 글 모음." },
};

export default function BlogIndex() {
  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">블로그</div>
          <h1 className="zname">디아블로2 레저렉션 블로그</h1>
          <p className="zen" style={{ marginTop: 8, lineHeight: 1.75 }}>
            직업별 빌드 세팅과 스킬트리, 룬워드 고르는 법, 용병, 맨땅 육성 루트를 래더 시즌 기준으로 정리한 글 {BLOG_META.length}편입니다.
            최신 글이 위에 있습니다. 룬워드 조합·프레임 구간·드롭 위치 같은 수치는 위쪽 탭의 도구에서 바로 계산해 볼 수 있습니다.
          </p>
        </div>
        <ul className="blog-list">
          {BLOG_META.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="blog-card">
                {p.thumb && (
                  // eslint-disable-next-line @next/next/no-img-element -- 로컬 WebP, 크기 고정(CSS) — 최적화 요청을 한 번 더 낼 이유가 없다
                  <img src={p.thumb.src} alt="" width={p.thumb.w} height={p.thumb.h} loading="lazy" decoding="async" />
                )}
                <span className="blog-card-text">
                  <span className="blog-card-date">{p.date}</span>
                  <strong>{p.title}</strong>
                  <span className="blog-card-ex">{p.excerpt}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
