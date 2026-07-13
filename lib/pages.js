// 추적 대상 페이지 화이트리스트 — 목록 밖 경로는 무시해 키 폭발·오염 방지.
// Redis 키(page:*, dwell:*)는 이 고정 목록에서만 파생되므로 임의 입력으로 키가 늘지 않는다.
export const TRACKED_PATHS = [
  "/terror-zone",
  "/new-items",
  "/runewords",
  "/grail",
  "/farming",
  "/prices",
  "/cube",
  "/breakpoints",
  "/docs", // /docs/<id> 는 /docs 로 버킷팅(문서별 키 폭발 방지)
];

// 통계 표시용 한글 라벨
export const PATH_LABELS = {
  "/terror-zone": "공역",
  "/new-items": "신규 아이템",
  "/runewords": "룬워드",
  "/grail": "홀리 그레일",
  "/farming": "파밍 체크",
  "/prices": "시세 지수",
  "/cube": "호라드릭 큐브",
  "/breakpoints": "프레임 기준",
  "/docs": "문서",
};

// 클라가 보낸 path → 정규화된 추적 키. 미허용이면 null(무기록).
// 쿼리·해시 제거, 트레일링 슬래시 제거, /docs/* 버킷팅 후 화이트리스트 대조.
export function normalizePath(raw) {
  if (typeof raw !== "string") return null;
  let p = raw.split("?")[0].split("#")[0].trim();
  if (!p.startsWith("/")) return null;
  if (p.length > 1) p = p.replace(/\/+$/, ""); // 루트 제외 트레일링 슬래시 제거
  if (p.startsWith("/docs/")) p = "/docs";
  return TRACKED_PATHS.includes(p) ? p : null;
}
