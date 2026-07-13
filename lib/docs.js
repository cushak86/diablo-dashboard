import { randomUUID } from "crypto";

// 문서 id 새니타이즈: 소문자 영숫자·하이픈만, 최대 60자
export function sanitizeId(id) {
  return String(id || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// 제목 → slug (비-ASCII 제거). 비면 "doc" 폴백 + 랜덤 접미사로 충돌 방지
export function makeId(title) {
  const slug =
    String(title || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "doc";
  // 충돌 확률 낮은 랜덤 접미사 (route.js의 SET NX가 최종 방어)
  return `${slug}-${randomUUID().slice(0, 8)}`;
}

// 경로 세그먼트 1개 새니타이즈: 유니코드 정규화 → 제어·포맷 문자 제거 → 구분자 제거 → 점 세그먼트 차단.
// NFKC를 먼저 적용해 fullwidth dot/slash(．／) 등을 ASCII로 접은 뒤 점·구분자 검사를 하므로 위장 우회 불가.
// \p{C}(제어·포맷·bidi·zero-width 등)를 제거해 표시 spoofing 차단.
function sanitizePathSegment(seg) {
  return String(seg)
    .normalize("NFKC") // fullwidth·호환 문자 → ASCII로 접기(점·구분자 위장 방지)
    .replace(/\p{C}/gu, "") // 제어·포맷·bidi·zero-width 문자 제거
    .replace(/[/\\]/g, "") // 세그먼트 내부 구분자 제거(정규화로 생긴 것 포함)
    .replace(/^\.+$/, "") // ".", "..", "..." → 제거(정규화 후 재검사, traversal 차단)
    .trim()
    .slice(0, 100);
}

// 업로드 상대경로 새니타이즈: path traversal(../)·절대경로·제어문자 차단.
// 반환값은 "폴더 경로"(파일명 제외 아님 — 호출부가 dir만 넘김) 용도의 안전한 상대경로 문자열.
// 빈 문자열이면 루트 취급. Redis 키에는 절대 쓰지 않고 표시/그룹핑 필드로만 저장.
// 계약: 부정한 입력을 "거절"하지 않고 안전한 문자열로 "재작성"한다(예: /etc/passwd → etc/passwd).
// path가 키·파일시스템에 전혀 쓰이지 않으므로 재작성만으로 충분하며, 표시/그룹핑 용도에 적합.
export function sanitizePath(rawPath) {
  const parts = String(rawPath || "")
    .replace(/\\/g, "/") // 윈도우 구분자 정규화
    .split("/")
    .map(sanitizePathSegment)
    .filter(Boolean); // 빈 세그먼트 제거 → 선행 "/"(절대경로) 무력화
  return parts.slice(0, 20).join("/").slice(0, 300);
}

export const MAX_DOC_BYTES = 256 * 1024; // 256KB 상한

export const MAX_SUMMARY = 200; // 요약 길이 상한(순수 텍스트 문자 수)

// 마크다운 라인 판정용 정규식 (선행 공백 0~3칸 허용 = CommonMark 관용)
const FENCE_RE = /^\s{0,3}(`{3,}|~{3,})/; // 코드펜스 경계(3칸 이상)
const HEADING_RE = /^\s{0,3}#{1,6}\s+/; // ATX 헤딩
const H1_RE = /^\s{0,3}#\s+/; // H1
// Goal/목표 섹션 헤딩. \b는 한글 뒤에서 경계로 동작하지 않으므로 lookahead로 토큰 경계 판정
// (뒤가 문자·숫자가 아니면 매칭 → "Goals"/"목표들"은 제외, "목표"·"Goal:"·줄끝은 매칭)
const GOAL_RE = /^\s{0,3}#{1,6}\s+(goal|목표)(?=$|[^\p{L}\p{N}])/iu;
const IMG_ONLY_RE = /^\s*!\[[^\]]*\]\([^)]*\)\s*$/; // 이미지만 있는 줄
const LINK_ONLY_RE = /^\s*\[[^\]]*\]\([^)]*\)\s*$/; // 링크만 있는 줄
const URL_ONLY_RE = /^\s*<?https?:\/\/\S+>?\s*$/; // 순수 URL 줄
const COMMENT_RE = /^\s*<!--/; // HTML 주석 줄
const BLANK_RE = /^\s*$/; // 빈 줄

// 인라인 마크업·제어문자·과도 공백 정리 → 순수 텍스트. 상한 초과 시 … 로 절단.
function toText(s) {
  const t = String(s || "")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "") // HTML 태그 제거(태그명은 문자로 시작 — "a < b" 비교식은 보존)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // 이미지 → alt
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 링크 → 표시 텍스트
    .replace(/`+/g, "") // 인라인 코드 백틱
    .replace(/(\*\*|__|~~|\*|_)/g, "") // 강조 마크업
    .replace(/^#{1,6}\s+/, "") // 혹시 남은 선행 헤딩 기호
    .replace(/\p{C}/gu, " ") // 제어문자 → 공백
    .replace(/\s+/g, " ") // 과도 공백 축소
    .trim();
  if (t.length <= MAX_SUMMARY) return t;
  return t.slice(0, MAX_SUMMARY - 1).trimEnd() + "…";
}

// 코드펜스 내부(+경계) 라인 마스크 — 펜스 안의 헤딩/텍스트를 오탐하지 않도록.
// 열린 fence의 marker 문자(`/~)와 길이를 추적: 닫힘은 같은 문자·opener 이상 길이만 인정.
// fence 내부의 다른 marker 라인은 콘텐츠로 마스크(오조기 종료 방지).
function fenceMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let fence = null; // { ch, len } | null
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(FENCE_RE);
    if (m) {
      const marker = m[1];
      const ch = marker[0];
      const len = marker.length;
      if (!fence) {
        fence = { ch, len }; // opener
      } else if (ch === fence.ch && len >= fence.len) {
        fence = null; // closer
      }
      mask[i] = true; // 경계·내부 marker 라인 모두 스킵
      continue;
    }
    mask[i] = fence !== null;
  }
  return mask;
}

// from 이후 첫 "문단"(연속 콘텐츠 줄)을 공백 결합해 반환.
// 시작 탐색 중 빈줄·이미지·링크·주석·펜스는 건너뜀.
// stopAtHeading=true(섹션 추출): 콘텐츠 전에 헤딩을 만나면 빈 섹션으로 보고 "" 반환.
// stopAtHeading=false(폴백): 헤딩도 건너뛰며 첫 콘텐츠 문단을 계속 탐색.
// 수집 단계에서는 항상 빈줄·헤딩·펜스에서 문단 종료.
function firstParagraph(lines, mask, from, stopAtHeading) {
  let i = from;
  while (i < lines.length) {
    const l = lines[i];
    if (
      mask[i] ||
      BLANK_RE.test(l) ||
      COMMENT_RE.test(l) ||
      IMG_ONLY_RE.test(l) ||
      LINK_ONLY_RE.test(l) ||
      URL_ONLY_RE.test(l)
    ) {
      i++;
      continue;
    }
    if (HEADING_RE.test(l)) {
      if (stopAtHeading) return "";
      i++;
      continue;
    }
    break; // 콘텐츠 줄 발견
  }
  const buf = [];
  while (i < lines.length && !mask[i]) {
    const l = lines[i];
    if (BLANK_RE.test(l) || HEADING_RE.test(l)) break;
    buf.push(l.trim());
    i++;
  }
  return buf.join(" ");
}

// 문서 content에서 요약 추출.
// 1) `## Goal`/`## 목표` 섹션의 첫 문단, 2) 폴백: 첫 H1 이후(없으면 처음부터) 첫 비제목 문단.
// 없으면 "". 반환은 순수 텍스트(마크업·제어문자 정리, MAX_SUMMARY 상한 절단).
// title: 예약 파라미터(현재 미사용) — task.md 판정은 본문(Goal 섹션) 기반이라 제목 불필요.
export function extractSummary(content, title) {
  const src = String(content || "");
  if (!src.trim()) return "";
  const lines = src.split(/\r?\n/);
  const mask = fenceMask(lines);

  // 1) Goal/목표 섹션 첫 문단
  let para = "";
  const goalIdx = lines.findIndex((l, i) => !mask[i] && GOAL_RE.test(l));
  if (goalIdx >= 0) para = firstParagraph(lines, mask, goalIdx + 1, true);

  // 2) 폴백: 첫 H1 이후(없으면 문서 처음부터) 첫 비제목 문단
  if (!para) {
    const h1Idx = lines.findIndex((l, i) => !mask[i] && H1_RE.test(l));
    const start = h1Idx >= 0 ? h1Idx + 1 : 0;
    para = firstParagraph(lines, mask, start, false);
  }

  return toText(para);
}
