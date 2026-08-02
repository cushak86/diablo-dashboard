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
// summary는 llms.txt 전용 한 줄 설명이다. 각 페이지 layout.js 의 실제 metadata.description 을 줄인 것이며
// **새로 지어낸 문구가 아니다**(CLAUDE.md §7 — 확인 못 한 것을 쓰지 않는다).
export const BASE = "https://diablo-dashboard-phi.vercel.app";

export const SITE_PAGES = [
  { path: "/", lastModified: "2026-07-18", changeFrequency: "weekly", priority: 1,
    title: "홈 (공포의 영역)", summary: "공포의 영역 시간표와 우버 디아블로 진행도를 한 곳에서 보는 시작 화면." },
  { path: "/terror-zone", lastModified: "2026-07-12", changeFrequency: "hourly", priority: 1,
    title: "공포의 영역 시간표", summary: "현재/다음 공포의 영역, 정각까지 카운트다운, 음성 알림, 우버 디아블로(클론 디아) 진행도." },
  { path: "/build", lastModified: "2026-07-18", changeFrequency: "monthly", priority: 0.6,
    title: "직업별 추천 빌드", summary: "8직업(악마술사 포함) 스킬 우선순위·스탯 분배·핵심 룬워드·용병 세팅·목표 프레임. 3.2 기준." },
  { path: "/breakpoints", lastModified: "2026-07-12", changeFrequency: "monthly", priority: 0.4,
    title: "프레임 기준 (FCR/FHR)", summary: "직업별 시전 속도(FCR)·타격 회복 속도(FHR) 브레이크포인트 표. 전 직업 3.2 기준." },
  { path: "/grail", lastModified: "2026-07-17", changeFrequency: "monthly", priority: 0.5,
    title: "아이템 수집 트래커 (연대기)", summary: "악마술사의 군림 신규 고유·세트·주얼·부적과 33룬, 룬워드 99종 수집 체크리스트." },
  { path: "/runewords", lastModified: "2026-07-17", changeFrequency: "monthly", priority: 0.4,
    title: "룬워드 조합", summary: "룬워드 99종의 룬 순서·소켓 수·베이스·요구 레벨. 3.0~3.2 신규 7종 포함. 한글·영문·룬 검색." },
  { path: "/new-items", lastModified: "2026-07-14", changeFrequency: "weekly", priority: 0.7,
    title: "신규 아이템 (한→영 검색)", summary: "패치 3.0+ 신규 아이템의 한글명→영문명 변환과 트레더리(Traderie) 거래 링크." },
  { path: "/drops", lastModified: "2026-07-17", changeFrequency: "monthly", priority: 0.6,
    title: "드롭 위치", summary: "고룬·룬워드 재료·조던의 돌이 어느 몬스터·지역에서 나오는지 게임 드롭 표에서 직접 추출해 한글로 정리." },
  { path: "/farming", lastModified: "2026-07-14", changeFrequency: "monthly", priority: 0.4,
    title: "파밍 체크리스트", summary: "일일·주간 파밍 루틴 체크리스트. 일일은 매일 자정(KST), 주간은 매주 월요일 자동 초기화." },
  { path: "/prices", lastModified: "2026-07-17", changeFrequency: "weekly", priority: 0.6,
    title: "시세 지수", summary: "룬워드·고유·고룬의 스탠다드/래더 기준선과 익명 제보 중앙값. 비공식·참고용이며 실시간이 아님." },
  { path: "/cube", lastModified: "2026-07-12", changeFrequency: "monthly", priority: 0.4,
    title: "호라드릭 큐브", summary: "룬 업그레이드 레시피(엘→조드) 전체 표와 조합기. 목표 룬에 필요한 하위 룬 개수·보석 자동 계산." },
  { path: "/planner", lastModified: "2026-07-18", changeFrequency: "monthly", priority: 0.5,
    title: "룬 재고 시뮬레이터", summary: "가진 룬을 넣으면 룬워드 99종을 즉시 제작·큐브로 가능·부족으로 판정. 큐브 승급까지 계산." },
  { path: "/rune-plan", lastModified: "2026-07-18", changeFrequency: "monthly", priority: 0.5,
    title: "룬 추천", summary: "내 룬으로 완성에 가까운 룬워드 추천. 룬을 누르면 그 룬을 쓰는 룬워드만 역참조." },
  { path: "/privacy", lastModified: "2026-07-18", changeFrequency: "yearly", priority: 0.2,
    title: "개인정보처리방침", summary: "수집 항목과 브라우저 로컬 저장 원칙." },
];

// 제외: /backup(개인 데이터 도구 — layout.js에서 noindex) · /admin·/docs(비공개)
// robots.txt로 막지 않는 이유: Disallow 하면 크롤러가 페이지를 못 읽어 noindex 지시 자체를 못 본다.
