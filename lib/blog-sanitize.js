// 워드프레스(cushaks.mycafe24.com) 본문 HTML → 이 사이트에 실을 HTML. 순수 함수 — scripts/sync-cafe24-blog.mjs 가 쓰고
// test/blog.test.mjs 가 지킨다.
//
// 왜 손으로 짠 허용목록인가: 입력은 사장님 소유 블로그의 글이고, 결과는 git 에 커밋돼 사람이 diff 로 본다
// (런타임에 남의 HTML 을 받는 구조가 아니다). 그래도 dangerouslySetInnerHTML 로 그리므로 **허용한 태그·속성 외에는
// 전부 버린다** — on* 핸들러·style·class·script·iframe·광고 코드(<ins>) 모두. 새 의존성은 들이지 않았다.

export const ALLOWED = {
  p: [], br: [], hr: [], h2: [], h3: [], h4: [],
  ul: [], ol: [], li: [],
  strong: [], b: [], em: [], i: [], code: [], pre: [], blockquote: [],
  a: ["href"], img: ["src", "alt"],
  figure: [], figcaption: [],
  table: [], thead: [], tbody: [], tr: [], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"],
};
// 감싸기만 하는 태그 — 태그는 버리고 안의 내용은 남긴다.
const UNWRAP = new Set(["div", "span", "section", "article", "font", "u", "small", "sup", "sub", "mark"]);
// 통째로(내용까지) 버리는 블록.
const DROP_BLOCKS = ["script", "style", "iframe", "ins", "noscript", "object", "embed", "form", "svg", "video", "audio"];

import { BASE } from "./site-pages.js";

// 이 사이트의 신·구 주소 — 도메인 정본은 lib/site-pages.js 의 BASE 하나다(test/nav 가 하드코딩을 막는다).
const OLD_SITE_HOSTS = [new URL(BASE).hostname, "diablo-dashboard-phi.vercel.app"];

const escAttr = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function parseAttrs(s) {
  const out = {};
  for (const m of s.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
    out[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? "";
  }
  return out;
}

/** 엔티티를 일부 풀어 URL 비교를 정확히 한다(속성값에만 쓴다). */
const unent = (s) => s.replace(/&amp;/g, "&").replace(/&#0*38;/g, "&").replace(/&quot;/g, '"').replace(/&#0*39;|&#x27;/gi, "'");

/**
 * 링크 재작성.
 *  - javascript:/data:/vbscript: → 버림(null)
 *  - cafe24 의 디아2 글 → /blog/<slug>   (slugOfPath: 디코딩된 경로 → 우리 slug, 없으면 null)
 *  - 이 사이트(신·구 주소) → 상대 경로
 *  - 그 밖 → https 로 올린 절대 주소(외부)
 */
export function rewriteHref(raw, { cafeHost, slugOfPath }) {
  const href = unent(raw).trim();
  if (!href || /^(javascript|data|vbscript):/i.test(href)) return null;
  if (href.startsWith("#") || href.startsWith("/")) return { href, external: false };
  let u;
  try { u = new URL(href); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:" && u.protocol !== "mailto:") return null;
  if (u.hostname === cafeHost) {
    let path = u.pathname;
    try { path = decodeURIComponent(path); } catch {}
    const slug = slugOfPath(path.replace(/\/+$/, "")); // 워드프레스 고유주소는 끝에 / 가 붙는다
    if (slug) return { href: `/blog/${slug}${u.hash}`, external: false };
    u.protocol = "https:";
    return { href: u.toString(), external: true };
  }
  if (OLD_SITE_HOSTS.includes(u.hostname)) return { href: `${u.pathname}${u.search}${u.hash}` || "/", external: false };
  if (u.protocol === "http:") u.protocol = "https:";
  return { href: u.toString(), external: true };
}

/**
 * @param {string} html  워드프레스 content.rendered
 * @param {{cafeHost:string, slugOfPath:(p:string)=>string|null, imageFor:(src:string)=>{src:string,w:number,h:number}|null}} ctx
 */
export function sanitize(html, ctx) {
  let s = String(html).replace(/<!--[\s\S]*?-->/g, "");
  for (const tag of DROP_BLOCKS) {
    s = s.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, "gi"), "");
    s = s.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), ""); // 닫는 태그 없는 꼴
  }
  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (full, rawTag, rest) => {
    let tag = rawTag.toLowerCase();
    const closing = full.startsWith("</");
    if (tag === "h1") tag = "h2"; // 본문 h1 은 제목과 겹친다
    if (UNWRAP.has(tag)) return "";
    if (!(tag in ALLOWED)) return "";
    if (closing) return tag === "br" || tag === "hr" || tag === "img" ? "" : `</${tag}>`;

    const attrs = parseAttrs(rest);
    if (tag === "img") {
      const img = ctx.imageFor(unent(attrs.src || ""));
      if (!img) return ""; // 내려받지 못한 이미지는 버린다(깨진 그림을 싣지 않는다)
      return `<img src="${escAttr(img.src)}" alt="${escAttr(attrs.alt || "")}" width="${img.w}" height="${img.h}" loading="lazy" decoding="async">`;
    }
    if (tag === "a") {
      const r = attrs.href ? rewriteHref(attrs.href, ctx) : null;
      if (!r) return "<a>";
      return r.external
        ? `<a href="${escAttr(r.href)}" target="_blank" rel="noopener">`
        : `<a href="${escAttr(r.href)}">`;
    }
    const keep = ALLOWED[tag].filter((k) => attrs[k] != null && /^\d{1,2}$/.test(attrs[k])); // colspan·rowspan 은 숫자만
    return `<${tag}${keep.map((k) => ` ${k}="${attrs[k]}"`).join("")}>`;
  });
  // 비어 버린 문단(공백·&nbsp;·<br> 만 남은 것)과 연속 줄바꿈 정리 — 워드프레스 글 머리에 <p><br>×4</p> 가 흔하다
  return s.replace(/<p>(?:\s|&nbsp;| |<br>)*<\/p>/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

/** 제목·요약용 — 태그 제거 + 흔한 엔티티 풀기. */
export function plainText(html) {
  return String(html)
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&hellip;/g, "…").replace(/\[…\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 디아2 글인가 — 제목 기준. 디아블로4 는 이 사이트 주제가 아니다(같은 블로그에 섞여 있다). */
export function isD2Title(t) {
  // "래더 14" 처럼 띄어 쓴 제목이 있다(2026-10-11 실측 — 처음 규칙이 정손용딘 글을 놓쳐 링크 4개가 외부로 남았다)
  return /디아\s?2|디아블로\s?2|D2R|레저렉션|래더\s?1[0-9]/i.test(t) && !/디아블로\s?4|디아\s?4/i.test(t);
}
