// 사이트 페이지 목록의 **단일 정본**. 내비게이션과 통계가 같은 목록에서 파생된다.
//
// 왜 한 곳인가 (2026-08-08):
//   전에는 TabNav.js 에 탭 13개, 여기에 추적 경로 9개가 따로 있었다. 탭이 늘 때 추적 목록은
//   따라오지 않아서 /build·/drops·/planner·/rune-plan·/backup 과 **홈까지 6개 경로가 통계에서
//   통째로 빠져 있었다.** PageTracker 는 모든 경로에서 비콘을 쏘고 있었고, api/track 이
//   화이트리스트 밖이라는 이유로 그걸 조용히 버렸다 — 데이터가 없는 게 아니라 버려지고 있었다.
//   게다가 admin/stats 는 views>0 인 행만 그리므로 빠진 경로는 '0'조차 표시되지 않아
//   화면만 봐서는 누락을 눈치챌 수 없었다.
//   목록을 세 번째로 베끼는 대신 파생시킨다 — 탭을 추가하면 추적이 자동으로 따라온다.

// 탭 순서·명칭은 사장님 확정(2026-07-17). 근거:
//   - 공역 → **공포의 영역**: 사이트 안에서 "공포의 영역" 46회 vs "공역" 9회(사실상 이 탭뿐)였고,
//     정작 이 탭의 메타 제목이 "공포의 영역 시간표"다. 탭만 혼자 다른 말을 썼다. ("공역"은 항공 용어와도 겹친다)
//   - 홀리 그레일 → **아이템 (연대기)**: 연대기(Chronicle)는 D2R 인게임 수집 기록 기능의 이름이다
//     (게임 데이터에도 `disableChronicle` 열로 존재). 커뮤니티 음차보다 게임이 쓰는 말이 낫다.
//   - 신규 아이템 (트레더리) → **신규 아이템**: 트레더리(Traderie)는 외부 사이트 이름이다.
//     구현 사정이 내비게이션에 샐 이유가 없다 — 페이지 안에 이미 설명돼 있다.
// 묶음: 지금뭐하지(공포의영역) → 공략(빌드·프레임) → 아이템(연대기·룬워드·신규) → 도구·기록
//   아이템 3탭을 붙인 건 의도적이다 — 내부를 한 엔진으로 합칠 대상이라 겉도 한 가족으로 보여야 한다
//   (docs/plans/2026-07-17-아이템탭-통합-설계.md).
export const TABS = [
  { href: "/terror-zone", label: "공포의 영역" },
  { href: "/build", label: "빌드 가이드" },
  { href: "/breakpoints", label: "프레임 기준" },
  { href: "/grail", label: "아이템 (연대기)" },
  { href: "/runewords", label: "룬워드" },
  { href: "/new-items", label: "신규 아이템" },
  { href: "/farming", label: "파밍 체크" },
  { href: "/drops", label: "드롭 위치" },
  { href: "/prices", label: "시세 지수" },
  { href: "/cube", label: "호라드릭 큐브" },
  { href: "/planner", label: "룬 재고" },
  { href: "/rune-plan", label: "룬 추천" },
  { href: "/backup", label: "백업" },
];

// 탭에는 없지만 사람이 실제로 보는 페이지. 홈이 맨 앞인 건 통계 표에서 먼저 보이라고.
//   "/docs"  — /docs/<id> 를 하나로 버킷팅한다(문서별 키 폭발 방지). noindex 지만 내부 조회수는 센다.
const EXTRA_TRACKED = [
  { href: "/", label: "홈" },
  { href: "/docs", label: "문서" },
  { href: "/guide", label: "가이드" }, // /guide/<slug> 를 하나로 버킷팅(2026-08-27)
  { href: "/about", label: "소개" },
  { href: "/privacy", label: "개인정보처리방침" },
];

const ALL_TRACKED = [EXTRA_TRACKED[0], ...TABS, ...EXTRA_TRACKED.slice(1)];

// 추적 대상 페이지 화이트리스트 — 목록 밖 경로는 무시해 키 폭발·오염 방지.
// Redis 키(page:*, dwell:*)는 이 고정 목록에서만 파생되므로 임의 입력으로 키가 늘지 않는다.
export const TRACKED_PATHS = ALL_TRACKED.map((p) => p.href);

// 통계 표시용 한글 라벨 — **TabNav 와 같은 말을 쓴다**(관리자만 옛 이름을 보게 되면 안 된다).
// 이제 같은 배열에서 파생되므로 구조적으로 어긋날 수 없다.
// Redis 키는 경로(`/grail`)에서 파생되므로 라벨을 바꿔도 통계 데이터는 안 깨진다.
export const PATH_LABELS = Object.fromEntries(ALL_TRACKED.map((p) => [p.href, p.label]));

// 클라가 보낸 path → 정규화된 추적 키. 미허용이면 null(무기록).
// 쿼리·해시 제거, 트레일링 슬래시 제거, /docs/* 버킷팅 후 화이트리스트 대조.
export function normalizePath(raw) {
  if (typeof raw !== "string") return null;
  let p = raw.split("?")[0].split("#")[0].trim();
  if (!p.startsWith("/")) return null;
  if (p.length > 1) p = p.replace(/\/+$/, ""); // 루트 제외 트레일링 슬래시 제거
  if (p.startsWith("/docs/")) p = "/docs";
  if (p.startsWith("/guide/")) p = "/guide";
  return TRACKED_PATHS.includes(p) ? p : null;
}
