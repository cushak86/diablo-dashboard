# D2R 대시보드 (D2R Dashboard)

디아블로2 레저렉션(D2R) 통합 대시보드. Next.js 16(App Router) · React 19 기반, 상단 탭 **10개**로 구성됩니다.
**공역(공포의 영역, Terror Zone)** 탭에 실시간 타이머·음성 안내와 **우버 디아(클론 디아) 진행도**가 함께
표시되며, 서버 라우트에서 **d2emu/d2runewizard** 실데이터를 프록시합니다. 우버 디아는 독립 탭 없이 공역
페이지 하단에 임베드됩니다. 개인 상태(그레일·파밍·즐겨찾기·룬 재고)는 **브라우저에만** 저장되며
`/backup`에서 JSON으로 내보내고 복원합니다.

## 탭 (정본: `app/components/TabNav.js`)

| 라우트 | 라벨 | 내용 |
|---|---|---|
| `/terror-zone` | 공역 | 실시간 타이머 · 사운드/TTS 알림 · 하단에 우버 디아 위젯 |
| `/new-items` | 신규 아이템 (트레더리) | 3.x 신규 82종 · 한/초성/영/alias 검색 · 즐겨찾기 |
| `/runewords` | 룬워드 | 99종 · 카테고리 필터 · 즐겨찾기 |
| `/grail` | 홀리 그레일 | 3.x 신규 + 33룬 + 룬워드 **170** · **클래식 고유 385 · 세트 부위 127** = 682. 범위 토글(신규/클래식/전체) |
| `/farming` | 파밍 체크 | 일일·주간 체크리스트 · KST 자동 초기화 |
| `/prices` | 시세 지수 | 정적 기준선(as-of 상수 단일 관리) + 익명 커뮤니티 제보 |
| `/cube` | 호라드릭 큐브 | 룬 업그레이드 레시피 · 룬 조합기 |
| `/planner` | 룬 재고 | 내 룬 재고 → 제작 가능 룬워드 판정 (큐브 승급까지 계산) |
| `/breakpoints` | 프레임 기준 | FCR/FHR 프레임 표 · 계산기 |
| `/backup` | 백업 | 개인 데이터 JSON 내보내기/가져오기 |

관리자 전용: `/admin`(로그인·문서 업로드) · `/admin/stats`(페이지 통계) · `/docs/[id]`(업로드 문서 뷰어, noindex).

## 구조

```
app/
  layout.js                      루트 레이아웃 — 공통 헤더 + 탭 내비게이션
  components/TabNav.js           탭 내비게이션 (정본: 탭 목록)
  components/UberDiabloWidget.js 클론 디아 위젯 — terror-zone 하단에서 렌더
  globals.css                    다크 테마 스타일
  page.js                        루트 — /terror-zone 으로 리다이렉트
  <탭>/page.js                   위 표의 10개 탭 (전부 클라이언트 컴포넌트)
  <탭>/layout.js                 per-page metadata(title·description·canonical·OG)
  api/terror-zone/route.js       d2emu/d2runewizard 프록시(+모의 폴백)
  api/diablo-clone/route.js      d2runewizard diablo-clone 프록시(+모의 폴백)
  api/price/route.js             익명 시세 제보 (허니팟·ipHash·쿨다운)
  api/track/route.js             페이지뷰 집계 (Upstash Redis)
  api/admin/*, api/docs/route.js 관리자 로그인·문서 CRUD
lib/
  zones.js         TZ 지역 데이터 · 모의 로테이션 · 영문→한글 퍼지 매칭
  cube.js          33룬 · 보석 · 큐브 승급 규칙(needCount) — 룬 데이터 정본
  runewords.js     룬워드 99종 (isNew = 3.x 신규 7종, 룬 조합 미검증)
  rune-planner.js  룬 재고 판정 엔진 (순수 함수, /planner가 사용)
  backup.js        개인 데이터 export/import + import 검증 (순수 함수)
  price-*.js       시세 기준선(AS_OF 상수)·카탈로그·제보 로직
  items.js, auth.js, redis.js, docs.js, pages.js
test/              node 단위 테스트 (의존성 0 — npm test)
index.html         (참고) 서버 없이 여는 오프라인 모의 뷰어. Next 앱과 무관
```

## 실행

```bash
npm install
cp .env.local.example .env.local   # 토큰 입력 후
npm run dev                        # http://localhost:3000
npm test                           # 단위 테스트 (rune-planner · backup · price-baseline)
npm run build                      # 프로덕션 빌드
```

> `next lint`는 Next 16에서 제거됐습니다. 이 프로젝트에는 ESLint 설정이 없습니다(도입은 별도 과제).

토큰이 없으면 자동으로 **모의(mock) 로테이션**으로 동작합니다. 토큰을 넣으면 상단 배지가
`● 실시간`으로 바뀌고 현재 지역이 실데이터로 표시됩니다.

## 데이터 소스 선택 (`TZ_PROVIDER`)

`route.js`는 두 provider를 지원합니다. `.env.local`의 `TZ_PROVIDER`로 전환합니다.

| provider | 발급 | 제공 데이터 | 비고 |
|---|---|---|---|
| **d2emu** (코드 기본값) | d2emu에 직접 요청(수동 승인) | 현재 + **다음** 지역 | f1f4·diablo2.io가 사용. 승인 대기 중 |
| **d2runewizard** (현재 운영 중) | 프로필에서 자율 발급 | 현재 + **다음** 지역 | 가장 쉬움. d2emu 승인 전까지 임시 사용 |

### d2emu 토큰 (기본 · 현재+다음)

1. https://www.d2emu.com Discord로 접근 요청 — 사용할 사이트/앱과 용도 명시 (약관 3.1)
2. 발급받은 **username + token**을 `.env.local`의 `D2EMU_USERNAME`, `D2EMU_TOKEN`에 입력
   (`TZ_PROVIDER=d2emu`가 기본값)
3. ⚠ d2emu 인증 헤더명은 공개 문서화돼 있지 않습니다. 승인 안내 형식이 다르면
   `route.js`의 `fromD2Emu()` headers만 교체하세요. 응답은
   `{ current:[zoneId,...], next:[zoneId,...] }` 형태이며, zone ID→지역 매핑은
   `lib/zones.js`의 `d2emuZoneFromIds()`가 처리합니다.

### d2runewizard 토큰 (현재 운영 중 · 현재+다음)

1. https://d2runewizard.com 로그인 (Google/Battle.net/Overwolf)
2. 프로필 → **Request Token** (Terror Zone 접근 권한)
3. 토큰을 `.env.local`의 `D2RW_TOKEN`에 입력, 나머지 헤더 값도 본인 정보로 교체
4. `TZ_PROVIDER=d2runewizard`로 변경

> 토큰은 서버(`route.js`)에서만 사용되며 브라우저로 노출되지 않습니다. `.env.local`은
> `.gitignore`에 포함되어 커밋되지 않습니다.

## 데이터 소스 한계 (중요)

- 실제 TZ 로테이션은 알고리즘이 아니라 블리자드 서버가 정하고 **유저 제보**로 파악됩니다.
- **d2emu**: 현재 + 다음 지역 제공. "향후 로테이션(2시간+)"은 제공하지 않아 실시간 모드에서 숨김.
- **d2runewizard**: 현재 + 다음 지역 제공(문서상 "현재만"이라 알려졌으나 2026-07 실측 결과 다음 지역도 제공함).
- **d2tz.info는 공개 API가 없습니다.** JS 렌더 폐쇄형 앱이라 현재로선 붙일 수 없습니다.
  운영자에게 권한/엔드포인트를 받게 되면 `route.js`에 `fromD2Tz()` provider를 추가해
  `TZ_PROVIDER=d2tz`로 교체하면 됩니다(구조상 어댑터 1개 추가로 끝).
- 토큰 미설정/API 오류 시 지역 목록 기반 **결정론적 모의 로테이션**으로 자동 폴백합니다.

## 알림

정각 변경 10분·5분·1분 전 사운드 + 한국어 음성(TTS), 정각 변경 시 차임 + 변경 멘트.
브라우저 자동재생 정책상 우측 상단 **소리 켜기**를 먼저 눌러야 재생됩니다.

## 배포

정본은 `dev-sync` 저장소의 `multi-agent/diablo-dashboard/`이고, 배포는 Vercel에 연동된
`cushak86/diablo-dashboard` repo로 **동기화 + push**하면 자동으로 나갑니다.

```bash
bash multi-agent/_shared/adapters/deploy_diablo.sh --dry-run   # 무엇이 바뀔지만 확인
bash multi-agent/_shared/adapters/deploy_diablo.sh             # 배포 (커밋된 것만 나간다)
```

## 향후 계획

- 알림 확장 — 공역 영역 교체·파밍 리셋 알림 (브라우저 닫힘·백그라운드 throttling 한계를 먼저 정의할 것)
- 홀리 그레일 클래식 확장 — 유니크·세트 전체 koKR 표기. **데이터 조달이 병목**이며, 항목이 6배가 되면
  기존 진행률이 폭락하므로 범위 토글 + `grail:v1 → v2` 마이그레이션 설계가 선행돼야 합니다.
- 시세 기준선 관리자 편집(Redis) — 현재는 정적 상수 + 6개월 경과 시 자동 경고 배너.

---
Data courtesy of [d2emu.com](https://www.d2emu.com/tz) · [d2runewizard.com](https://d2runewizard.com/terror-zone-tracker) · Not affiliated with Blizzard.
