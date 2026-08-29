// 공개 페이지 정본 목록 — `app/sitemap.js`(사이트맵)와 `app/llms.txt/route.js`(llms.txt)가 **둘 다 여기만 본다.**
//
// 왜 한 곳에 모았나: 페이지를 추가할 때 사이트맵과 llms.txt 중 하나만 고치면 두 파일이 조용히 갈라진다.
// 낡은 llms.txt는 없느니만 못하다 — AI에게 존재하지 않는 페이지를 알려주거나 새 페이지를 감춘다.
// (이 저장소는 이미 같은 실수를 했다: `lib/item-search.js` 주석 — 같은 코드 세 벌이 시간이 지나며 갈라졌다.)
//
// lastModified는 **페이지별 실제 변경일 상수**다. `new Date()`를 쓰면 이 라우트가 빌드 시점에 정적 생성되면서
// 배포할 때마다 전 URL이 "방금 변경됨"으로 신고된다 — CSS만 고쳐도 그렇다. 구글은 lastmod가 일관되게
// 부정확하면 그 신호를 무시하므로 없느니만 못한 값이 된다.
// **페이지 내용을 고치면 그 줄의 날짜도 함께 갱신할 것.** (초기값: 2026-07-16 git 이력 실측)
//
// ⚠️ 이 규칙은 지금까지 **네 번 깨졌다.** 색인관제 로그 4회차에 한 번(lastmod 5건),
//    2026-08-08 감사에서 다시 9건(/·/terror-zone·/farming·/rune-plan·/cube·/prices·/runewords·
//    /planner·/new-items). 매번 페이지를 고친 사람이 이 파일을 잊었다.
//    2026-08-09 에 네 번째 — 그날 오전에 /runewords·/new-items 본문(옵션 99개 인라인)을 고친 사람이 또 잊었고,
//    같은 이틀 안에 lastmod 정확성을 목표로 한 커밋이 두 건 있었는데도 그랬다. 적대적 검증이 잡았다.
//    2026-08-08 정정 근거(git 실측): 4b75de5(08-05) PageGuide 본문 추가 → /·/farming·/rune-plan·
//    /terror-zone / 147b45b(07-29)·rune-names 2차 정정(07-30) → 룬 표기를 쓰는 6탭.
//
//    **무엇이 '내용 변경'인가:** 화면에 보이는 것이 바뀌면 갱신한다. og:url·og:image 같은
//    메타데이터만 바뀐 배포는 갱신하지 않는다(08b8fcf·2026-08-05가 그 선례다).
//    이 구분 때문에 "마지막 커밋일 > lastModified 면 실패" 같은 자동 검사는 두지 않았다 —
//    메타데이터 커밋마다 거짓 경보가 울려서 곧 무시당한다. 사람이 판단할 자리다.
//
// summary는 llms.txt 전용 한 줄 설명이다. 각 페이지 layout.js 의 실제 metadata.description 을 줄인 것이며
// **새로 지어낸 문구가 아니다**(CLAUDE.md §7 — 확인 못 한 것을 쓰지 않는다).
// 2026-08-07 커스텀 도메인 전환. 옛 주소(`diablo-dashboard-phi.vercel.app`)는 `next.config.mjs`가 308로 흡수한다.
import { GUIDES } from "./guides.js";

export const BASE = "https://d2r-dashboard.online";

// og:image 정본. `app/opengraph-image.js` 가 이미지를 만들지만, **Next 는 자식 세그먼트가
// openGraph 를 재선언하면 부모 것을 통째로 교체한다** — 병합이 아니다. 그래서 탭 레이아웃이
// url·title·description 만 다시 선언하는 순간 파일 규약이 만든 이미지가 조용히 사라진다.
//   2026-08-08 라이브 실측: openGraph 재선언이 없는 /backup·/privacy 는 이미지가 살아 있고,
//   재선언한 탭 12개 + /about 은 전부 og:image 가 없었다. 공유 카드가 통째로 빈칸이었다는 뜻이다.
//   디스코드·카카오톡으로 "테러존 지금 어디" 링크를 주고받는 게 이 사이트의 실제 유입 경로라 손해가 크다.
// **openGraph 를 선언하는 곳은 반드시 `images: OG_IMAGE` 를 함께 넣는다.**
export const OG_IMAGE = ["/opengraph-image"];

export const SITE_PAGES = [
  { path: "/", lastModified: "2026-08-05", changeFrequency: "weekly", priority: 1,
    title: "홈 (공포의 영역)", summary: "공포의 영역 시간표와 우버 디아블로 진행도를 한 곳에서 보는 시작 화면." },
  { path: "/terror-zone", lastModified: "2026-08-08", changeFrequency: "hourly", priority: 1,
    title: "공포의 영역 시간표", summary: "현재/다음 공포의 영역, 정각까지 카운트다운, 음성 알림, 우버 디아블로(클론 디아) 진행도." },
  { path: "/build", lastModified: "2026-07-18", changeFrequency: "monthly", priority: 0.6,
    title: "직업별 추천 빌드", summary: "8직업(악마술사 포함) 스킬 우선순위·스탯 분배·핵심 룬워드·용병 세팅·목표 프레임. 3.2 기준." },
  { path: "/breakpoints", lastModified: "2026-07-12", changeFrequency: "monthly", priority: 0.4,
    title: "프레임 기준 (FCR/FHR)", summary: "직업별 시전 속도(FCR)·타격 회복 속도(FHR) 브레이크포인트 표. 전 직업 3.2 기준." },
  { path: "/grail", lastModified: "2026-07-17", changeFrequency: "monthly", priority: 0.5,
    title: "아이템 수집 트래커 (연대기)", summary: "악마술사의 군림 신규 고유·세트·주얼·부적과 33룬, 룬워드 99종 수집 체크리스트." },
  { path: "/runewords", lastModified: "2026-08-09", changeFrequency: "monthly", priority: 0.4,
    title: "룬워드 조합", summary: "룬워드 99종의 룬 순서·소켓 수·베이스·요구 레벨. 3.0~3.2 신규 7종 포함. 한글·영문·룬 검색." },
  { path: "/new-items", lastModified: "2026-08-09", changeFrequency: "weekly", priority: 0.7,
    title: "신규 아이템 (한→영 검색)", summary: "패치 3.0+ 신규 아이템의 한글명→영문명 변환과 트레더리(Traderie) 거래 링크." },
  { path: "/drops", lastModified: "2026-07-17", changeFrequency: "monthly", priority: 0.6,
    title: "드롭 위치", summary: "고룬·룬워드 재료·조던의 돌이 어느 몬스터·지역에서 나오는지 게임 드롭 표에서 직접 추출해 한글로 정리." },
  { path: "/farming", lastModified: "2026-08-05", changeFrequency: "monthly", priority: 0.4,
    title: "파밍 체크리스트", summary: "일일·주간 파밍 루틴 체크리스트. 일일은 매일 자정(KST), 주간은 매주 월요일 자동 초기화." },
  { path: "/prices", lastModified: "2026-07-30", changeFrequency: "weekly", priority: 0.6,
    title: "시세 지수", summary: "룬워드·고유·고룬의 스탠다드/래더 기준선과 익명 제보 중앙값. 비공식·참고용이며 실시간이 아님." },
  { path: "/cube", lastModified: "2026-07-30", changeFrequency: "monthly", priority: 0.4,
    title: "호라드릭 큐브", summary: "룬 업그레이드 레시피(엘→조드) 전체 표와 조합기. 목표 룬에 필요한 하위 룬 개수·보석 자동 계산." },
  { path: "/planner", lastModified: "2026-07-30", changeFrequency: "monthly", priority: 0.5,
    title: "룬 재고 시뮬레이터", summary: "가진 룬을 넣으면 룬워드 99종을 즉시 제작·큐브로 가능·부족으로 판정. 큐브 승급까지 계산." },
  { path: "/rune-plan", lastModified: "2026-08-05", changeFrequency: "monthly", priority: 0.5,
    title: "룬 추천", summary: "내 룬으로 완성에 가까운 룬워드 추천. 룬을 누르면 그 룬을 쓰는 룬워드만 역참조." },
  { path: "/about", lastModified: "2026-08-05", changeFrequency: "yearly", priority: 0.3,
    title: "사이트 소개 · 연락처", summary: "운영자, 데이터 출처와 한계, 연락 방법, 저작권 고지. 비공식 팬 사이트입니다." },
  { path: "/privacy", lastModified: "2026-07-18", changeFrequency: "yearly", priority: 0.2,
    title: "개인정보처리방침", summary: "수집 항목과 브라우저 로컬 저장 원칙." },
  // 가이드(2026-08-27) — 글 정본은 lib/guides.js. 글의 date 가 곧 lastModified 다(손으로 두 번 적지 않는다).
  { path: "/guide", lastModified: GUIDES.map((g) => g.date).sort().at(-1), changeFrequency: "weekly", priority: 0.6,
    title: "가이드", summary: "게임 데이터로 확인한 D2R 글 모음 — 고룬 드롭 위치, 카운테스 룬 파밍, 룬워드 완성 조건, 공포의 영역 원리." },
  ...GUIDES.map((g) => ({ path: `/guide/${g.slug}`, lastModified: g.date, changeFrequency: "monthly", priority: 0.5, title: g.title, summary: g.summary })),
];

/**
 * 색인 대상에서 **일부러 뺀** 라우트. 위 SITE_PAGES 와 합치면 `app/` 의 실제 라우트 전부가 된다.
 *
 * 왜 주석이 아니라 상수인가 (2026-08-11):
 *   여기는 원래 "제외: /backup · /admin·/docs" 라는 주석 한 줄이었다. 주석은 아무것도 강제하지 않는다 —
 *   `app/` 에 공개 페이지를 하나 더 만들면 화면에도 뜨고 링크도 걸리는데 사이트맵·llms.txt 에는
 *   영원히 없다. **404 가 아니라서 아무 경보도 울리지 않고**, 색인이 안 되는 이유는 화면 어디에도
 *   나타나지 않는다. 판정 지표 ①이 「색인된 페이지 수」인데 정작 색인 후보 집합이 조용히 샌다.
 *   상수로 올려 두면 `test/indexable.test.mjs` 가 실제 라우트와 대조해 새 페이지를 즉시 잡는다 —
 *   둘 중 어디에도 없으면 실패한다. 새 페이지를 만든 사람은 "색인할 것인가"를 반드시 한 번 답하게 된다.
 *
 * robots.txt 로 막지 않는 이유: Disallow 하면 크롤러가 페이지를 못 읽어 noindex 지시 자체를 못 본다.
 * (그래서 이 목록의 각 라우트는 코드에서 `robots: { index: false }` 를 선언해야 하고, 그것도 검사한다.)
 */
export const EXCLUDED_PATHS = [
  "/backup",       // 개인 데이터 내보내기·가져오기 도구 — 검색 결과에 뜰 이유가 없다
  "/admin",        // 비공개 운영 화면
  "/admin/stats",  // 비공개 운영 화면
  "/docs/[id]",    // 비공개 문서 뷰어(동적 라우트)
];
