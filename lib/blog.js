// 블로그 포스트 로더 — content/blog/*.md 를 빌드 시점에 읽어 정적 생성(SSG)한다.
// 의존성 없이 최소 frontmatter만 파싱한다(gray-matter 미도입). 서버(빌드) 전용 — 클라 번들에 안 들어간다.
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "content", "blog");

// frontmatter: 파일 맨 위 `---\nkey: value\n---\n본문`. 값의 감싼 큰따옴표는 벗긴다.
function parse(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    meta[k] = v;
  }
  return { meta, body: m[2] };
}

export function getPostSlugs() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
}

export function getPost(slug) {
  if (!/^[a-z0-9-]+$/.test(String(slug || ""))) return null; // 경로 조작 차단
  const fp = path.join(DIR, `${slug}.md`);
  if (!fs.existsSync(fp)) return null;
  const { meta, body } = parse(fs.readFileSync(fp, "utf8"));
  // 권위 필드(slug 등)는 spread 뒤에 둔다 — frontmatter의 rogue `slug:`가 파일명 slug를 덮지 못하게.
  return { ...meta, slug, title: meta.title || slug, description: meta.description || "", date: meta.date || "", body };
}

// 최신순(date 내림차순). date는 YYYY-MM-DD 문자열이라 사전순 = 시간순.
export function getAllPosts() {
  return getPostSlugs()
    .map(getPost)
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
