// cushaks.mycafe24.com(워드프레스)의 디아2 글을 이 사이트의 /blog 로 **옮겨 온다**.
//
// 왜 (2026-10-11 사장님 결정 「d2r로 이전」): 디아2 글의 원본을 이 도메인으로 삼는다. 그래서 런타임에 cafe24 를
//   읽지 않고, 본문·이미지를 이 저장소로 가져와 커밋한다 — cafe24 가 사라져도 글은 남는다.
//   cafe24 쪽 옛 글은 이 스크립트가 만드는 리다이렉트 목록으로 /blog/<slug> 에 301 시킨다(사장님/워드프레스 쪽 작업).
//
// 하는 일:
//   1) REST API 로 「게임」 카테고리 글을 전부 받아 디아2 글만 고른다(lib/blog-sanitize.js 의 isD2Title — 디아4 제외)
//   2) 본문을 허용목록으로 정리(sanitize) — 같은 블로그의 다른 디아2 글 링크는 /blog/<slug> 로 바꾼다
//   3) 본문 이미지를 받아 WebP(최대 폭 960, q72)로 줄여 public/blog-img/ 에 둔다(이미 있으면 건너뜀 — 재실행 안전)
//   4) lib/blog-meta.js(목록·사이트맵용, 가볍게) · lib/blog-content.js(본문, 글 페이지만 import) 생성
//   5) work/blog-import/cafe24-redirects.csv — cafe24 「Redirection」 플러그인에 넣을 옛 주소 → 새 주소 목록
//
// 쓰는 법:  node scripts/sync-cafe24-blog.mjs          (새 글이 생기면 다시 돌리고 커밋·배포)
// 의존: sharp — next 가 이미 깔아 둔 것을 쓴다(선언 의존성 아님). 없으면 원본 JPG 를 그대로 복사한다.

import fs from "node:fs";
import path from "node:path";
import { sanitize, plainText, isD2Title } from "../lib/blog-sanitize.js";
import { BASE } from "../lib/site-pages.js";

const CAFE = "cushaks.mycafe24.com";
const API = `https://${CAFE}/wp-json/wp/v2`;
const GAME_CATEGORY = 7; // 「게임」
const ROOT = process.cwd();
const IMG_DIR = path.join(ROOT, "public", "blog-img");
const WORK_DIR = path.join(ROOT, "work", "blog-import");

let sharp = null;
try { sharp = (await import("sharp")).default; } catch { console.warn("⚠️ sharp 없음 — 원본 이미지를 그대로 복사한다"); }

async function getJson(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return { json: await r.json(), pages: Number(r.headers.get("x-wp-totalpages") || 1) };
}

// 1) 글 목록
const FIELDS = "id,date,modified,slug,link,title,content,excerpt";
const first = await getJson(`${API}/posts?categories=${GAME_CATEGORY}&per_page=100&page=1&_fields=${FIELDS}`);
let posts = first.json;
for (let p = 2; p <= first.pages; p++) posts = posts.concat((await getJson(`${API}/posts?categories=${GAME_CATEGORY}&per_page=100&page=${p}&_fields=${FIELDS}`)).json);
const d2 = posts.filter((p) => isD2Title(plainText(p.title.rendered)));
console.log(`게임 카테고리 ${posts.length}편 중 디아2 ${d2.length}편`);

const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const slugById = new Map(d2.map((p) => [p.id, decode(p.slug)]));
const slugByPath = new Map(d2.map((p) => [decode(new URL(p.link).pathname).replace(/\/+$/, ""), decode(p.slug)]));
const slugOfPath = (p) => slugByPath.get(p.replace(/\/+$/, "")) ?? null;

// 3) 이미지
fs.mkdirSync(IMG_DIR, { recursive: true });
const imgCache = new Map(); // 원본 URL → {src,w,h} | null
async function fetchImage(rawSrc) {
  const url = rawSrc.replace(/^http:/, "https:").split("?")[0];
  if (imgCache.has(url)) return;
  if (!url.includes(`${CAFE}/wp-content/uploads/`)) { imgCache.set(url, null); return; } // 남의 서버 이미지는 싣지 않는다
  const base = decode(path.basename(new URL(url).pathname)).replace(/\.[a-z0-9]+$/i, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  const outName = sharp ? `${base}.webp` : path.basename(new URL(url).pathname);
  const outPath = path.join(IMG_DIR, outName);
  try {
    if (!fs.existsSync(outPath)) {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      const buf = Buffer.from(await r.arrayBuffer());
      if (sharp) await sharp(buf).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 72 }).toFile(outPath);
      else fs.writeFileSync(outPath, buf);
    }
    let w = 960, h = 540;
    if (sharp) { const m = await sharp(outPath).metadata(); w = m.width; h = m.height; }
    imgCache.set(url, { src: `/blog-img/${outName}`, w, h });
  } catch (e) {
    console.warn(`  ⚠️ 이미지 실패 ${url}: ${e.message}`);
    imgCache.set(url, null);
  }
}
for (const p of d2) for (const m of p.content.rendered.matchAll(/<img[^>]+src="([^"]+)"/g)) await fetchImage(m[1].replace(/&amp;/g, "&"));
const imageFor = (src) => imgCache.get(src.replace(/^http:/, "https:").split("?")[0]) ?? null;

// 2)+4) 본문·메타
const ymd = (s) => String(s).slice(0, 10);
const meta = [];
const content = {};
for (const p of d2.sort((a, b) => b.date.localeCompare(a.date))) {
  const slug = slugById.get(p.id);
  const body = sanitize(p.content.rendered, { cafeHost: CAFE, slugOfPath, imageFor });
  const firstImg = /<img src="([^"]+)" alt="[^"]*" width="(\d+)" height="(\d+)"/.exec(body);
  let excerpt = plainText(p.excerpt.rendered);
  if (excerpt.length > 150) excerpt = excerpt.slice(0, 148).replace(/\s\S*$/, "") + "…";
  meta.push({
    slug,
    wpId: p.id,
    title: plainText(p.title.rendered),
    date: ymd(p.date),
    modified: ymd(p.modified),
    excerpt,
    thumb: firstImg ? { src: firstImg[1], w: Number(firstImg[2]), h: Number(firstImg[3]) } : null,
    from: p.link, // 옛 주소(리다이렉트 원점·추적용)
  });
  content[slug] = body;
}

const HEAD = (what) => `// 자동 생성 — 직접 수정하지 마라. \`node scripts/sync-cafe24-blog.mjs\` 로 다시 만든다.
// 출처: ${CAFE} (워드프레스 REST, 「게임」 카테고리 중 디아2 글) · 생성 ${new Date().toISOString()}
// ${what}
`;
fs.writeFileSync(path.join(ROOT, "lib", "blog-meta.js"),
  HEAD("목록·사이트맵용 메타(가볍게 유지 — 본문은 lib/blog-content.js). 2026-10-11 「d2r로 이전」: 이 사이트가 원본이다.") +
  `export const BLOG_META = ${JSON.stringify(meta, null, 1)};\n`);
fs.writeFileSync(path.join(ROOT, "lib", "blog-content.js"),
  HEAD("본문 HTML(lib/blog-sanitize.js 로 정리됨). app/blog/[slug] 서버 컴포넌트만 import 한다 — 클라이언트 번들에 들어가면 안 된다.") +
  `export const BLOG_CONTENT = ${JSON.stringify(content)};\n`);

// 5) cafe24 리다이렉트 목록 (Redirection 플러그인 CSV 가져오기 형식: source,target,regex,code)
fs.mkdirSync(WORK_DIR, { recursive: true });
const csv = ["source,target,regex,code", ...meta.map((m) => `${new URL(m.from).pathname},${BASE}/blog/${encodeURIComponent(m.slug)},0,301`)].join("\n");
fs.writeFileSync(path.join(WORK_DIR, "cafe24-redirects.csv"), csv + "\n");

const imgs = [...imgCache.values()].filter(Boolean).length;
const bytes = fs.readdirSync(IMG_DIR).reduce((a, f) => a + fs.statSync(path.join(IMG_DIR, f)).size, 0);
console.log(`글 ${meta.length}편 · 이미지 ${imgs}장(실패 ${[...imgCache.values()].filter((v) => v === null).length}) · public/blog-img ${(bytes / 1024 / 1024).toFixed(1)}MB`);
console.log(`→ lib/blog-meta.js · lib/blog-content.js · work/blog-import/cafe24-redirects.csv`);
