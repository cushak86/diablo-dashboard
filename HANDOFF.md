# D2R 공포의 영역 대시보드 — 작업 인수인계 (HANDOFF)

> 이 문서는 **다른 AI 인스턴스가 처음부터 맥락을 파악하고 이어서 작업**할 수 있도록 작성된
> 프롬프트/컨텍스트 문서입니다. 새 세션이라면 이 문서를 먼저 읽고, 아래 "다음에 할 일"부터
> 진행하세요. 프로젝트 규칙(페르소나·색상·용어)은 프로젝트 설정에 이미 정의되어 있습니다.

## 0. 정본과 배포 (2026-07-13 변경 — 먼저 읽을 것)

- **정본은 `dev-sync` 저장소의 `multi-agent/diablo-dashboard/`다. 유일한 소스다.** 코드는 여기서
  고치고 커밋한다. git 이력이 곧 롤백 수단이다(메이저 업그레이드의 안전망).
- **Windows 사본 `D:\diablo-dashboard`는 폐기됐다**(2026-07-13, 사용자 확정). 아래 문서 곳곳의
  `D:\diablo-dashboard` 경로 표기는 승격 이전의 흔적이니 무시한다.
- **배포는 Vercel CLI 수동 push.** Vercel은 어떤 git repo와도 연동돼 있지 않다.
  따라서 **커밋한다고 배포되지 않는다** — 배포는 별도 수동 단계다.

---

## 1. 프로젝트 목표

- **최종 목표:** 디아블로2 레저렉션(D2R) 통합 대시보드. https://f1f4.net/ 와 동일 기능을 시작점으로,
  이후 룬워드/프레임(FCR·FHR) 페이지, 신규 아이템 **트레더리(Traderie)** 링크 탭, 우버 디아블로(클론 디아)
  추적기 등을 **탭으로 확장**해 나갈 예정.
- **현재 완료 범위 (v1):** 공포의 영역(Terror Zone) 실시간 타이머 + 음성/사운드 알림 페이지.

## 2. 확정된 의사결정 (사용자와 합의됨)

| 항목 | 결정 |
|---|---|
| v1 범위 | **공포의 영역 타이머만** 먼저 |
| 결과물 형태 | 처음엔 단일 HTML → **Next.js(App Router) 앱으로 전환 완료** |
| TZ 데이터 소스 | **d2emu가 장기 기본값**(코드 기본값 유지, 현재+다음 지역). d2emu 승인 대기 중이라 **2026-07-05부터 d2runewizard로 임시 운영**(`.env.local`에서만 전환, 실제로 현재+다음 다 제공됨 — 문서 정정). 승인되면 d2emu로 되돌릴 예정. d2tz.info는 추후 |
| 모의 데이터 | 실데이터 실패/토큰 미설정 시 **결정론적 모의 로테이션**으로 폴백 |

## 3. 데이터 소스 조사 결과 (중요 — 재조사 불필요)

- **d2tz.info**: 공개 API 없음(JS 렌더 폐쇄형 앱). 현재로선 연동 불가. 사용자가 **운영자에게 권한을
  요청해 추후 교체**할 계획. 엔드포인트를 확보하면 `route.js`에 `fromD2Tz()` 어댑터 1개 추가 + `TZ_PROVIDER=d2tz`.
- **d2runewizard**: 프로필에서 **자율 발급 토큰**. TZ API는 `GET https://d2runewizard.com/api/trackers/terror-zone?token=...`
  + 헤더 `D2R-Contact/D2R-Platform/D2R-Repo`.
  - ⚠ **문서화된 응답 형태(`terrorZone.highestProbabilityZone.zone`)는 틀렸음 — 2026-07 실측 결과
    실제 응답은 `{ current: "zone name", next: "zone name", currentTerrorZone: {zone}, nextTerrorZone: {zone} }` 형태.
    `route.js`의 `fromD2Runewizard()`가 이 실제 형태로 수정 완료됨.
  - **현재 + 다음 지역 모두 제공함** (기존 "현재만 제공" 가정은 오류였음 — d2emu 없이도 다음 지역 확인 가능).
    `probability`/`amount`/`lastUpdate`/`lastReportedBy` 필드는 실 응답에 없음(문서 오탐, 코드에서 제거).
  - CORS 때문에 반드시 서버에서 호출.
  - ✅ **2026-07-05부로 `TZ_PROVIDER=d2runewizard`로 임시 전환해 실사용 중** (d2emu 승인 대기 동안).
    `.env.local`에 실 토큰 설정됨(gitignore 처리, 커밋 안 됨).
- **d2emu (기본 채택)**: 현재+**다음** 지역 제공. 접근은 **수동 승인**(d2emu Discord에 용도 명시, 약관 3.1).
  - 엔드포인트: `GET https://www.d2emu.com/api/v1/tz`
  - **응답 형태(오픈소스 juddisjudd/TZoneAnnounce에서 확인):** `{ "current": [zoneId,...], "next": [zoneId,...] }`
    — 숫자 **zone ID 배열**. ID→지역명 매핑 필요.
  - ⚠ **인증 헤더명이 공개 문서화돼 있지 않음.** 현재 코드는 유력 형식 3종
    (`x-emu-username`, `x-emu-token`, `Authorization: Bearer`)을 함께 전송. **승인 시 실제 형식으로 교체 필요.**
- 결론: 실시간 TZ는 **반드시 서버 프록시 + 토큰** 필요. 순수 정적 파일로는 불가(그래서 Next.js).

## 4. 현재 아키텍처 / 파일 구조

> ⚠ 아래 트리는 **2026-07-13 갱신**됐다. 이전 버전은 탭 4개·Next 14 기준이라 실제와 어긋나 있었다
> (문서를 믿고 작업하면 이미 있는 기능을 중복 구현하게 된다 — 그래서 갱신은 위생 작업이다).

```
multi-agent/diablo-dashboard/          (정본. Windows D:\diablo-dashboard 사본은 폐기됨 — §0 참조)
├─ package.json              Next 16.2.10 / React 19 · npm audit 0건 · overrides.postcss ^8.5.10
│                            scripts: dev · build · start · test (lint 없음 — Next 16이 next lint 제거)
├─ next.config.mjs
├─ .gitignore               (.env.local 제외)
├─ .env.local.example       TZ_PROVIDER 및 토큰 예시 (기본 d2emu)
├─ README.md                실행/토큰 발급/소스 한계 안내
├─ HANDOFF.md               ← 이 문서
├─ index.html               (레거시) 서버 없이 여는 오프라인 모의 뷰어. Next 앱과 무관, 참고용
├─ app/
│  ├─ layout.js             루트 레이아웃 + 메타데이터 + 공통 헤더(로고) + TabNav
│  ├─ components/TabNav.js  탭 내비게이션(클라이언트, usePathname으로 활성 탭 표시). **탭 10개(정본)**:
│  │  공역|신규 아이템|룬워드|홀리 그레일|파밍 체크|시세 지수|호라드릭 큐브|룬 재고|프레임 기준|백업
│  │  (+ 우측 관리자모드). **"우버 디아" 독립 탭은 제거됨**(2026-07-05,
│  │  사용자 요청 — 공역 페이지에 이미 임베드돼 있어 중복이라 판단, `app/uberdiablo/` 디렉터리 자체를 삭제).
│  ├─ components/UberDiabloWidget.js  클론 디아 위젯(제목+SC/HC토글+지역필터+래더/논래더 카드).
│  │  현재는 `terror-zone/page.js`에서만 사용(과거엔 별도 `uberdiablo/page.js`와도 공유했으나 그 페이지는 삭제됨).
│  ├─ globals.css           다크 테마(#111 / 핏빛 #c1272d / 골드 #c7b377 / 양피지 #d9c48b)
│  ├─ page.js               루트 — /terror-zone 으로 redirect()
│  ├─ terror-zone/page.js   'use client' 대시보드. 타이머·사운드·TTS·알림, /api/terror-zone fetch.
│  │  하단에 <UberDiabloWidget/> 임베드(이후 로테이션 카드 제거하고 대체함) — 이게 클론 디아 접근 지점 유일함.
│  ├─ runewords/page.js     ✅ 완료 (2026-07-08). 신규 3.x 7종 + 대표 클래식 33종, 룬 순서/소켓/베이스/레벨
│  │  + 한글·영문·룬·초성 검색 + 슬롯 필터. layout.js에 metadata 분리.
│  ├─ breakpoints/page.js   ✅ 완료 (2026-07-08). 8직업(악마술사 포함) FCR/FHR 표 + 브레이크포인트 계산기.
│  │  layout.js에 metadata 분리.
│  ├─ new-items/page.js     ✅ 완료. 트레더리 한→영 검색기(한글·초성·영문 + 카테고리 필터). layout.js에 metadata.
│  ├─ grail/page.js         ✅ 수집 체크리스트(신규 고유·세트·주얼·부적 + 33룬 + 룬워드). localStorage `grail:v1`
│  ├─ farming/page.js       ✅ 일일·주간 체크리스트, KST 자동 초기화. localStorage `farm:v1`
│  ├─ prices/page.js        ✅ 정적 기준선 + 익명 커뮤니티 제보(Redis). as-of는 lib의 AS_OF 상수가 정본
│  ├─ cube/page.js          ✅ 룬 업그레이드 레시피 · 룬 조합기
│  ├─ planner/page.js       ✅ (2026-07-13) 룬 재고 → 제작 가능 룬워드 판정. localStorage `runes:v1`
│  ├─ backup/page.js        ✅ (2026-07-13) 개인 데이터 export/import. import는 검증 통과 후에만 적용(원자성)
│  ├─ admin/page.js, admin/stats/page.js, docs/[id]/page.js   관리자·문서 뷰어(noindex)
│  ├─ <탭>/layout.js        per-page metadata. 10개 탭 전부 보유(2026-07-13 grail·farming·prices 추가로 완비)
│  ├─ api/terror-zone/route.js   서버 라우트. provider 분기(d2emu/d2runewizard) + 모의 폴백
│  ├─ api/diablo-clone/route.js ✅ d2runewizard diablo-clone 프록시 + 모의 폴백 (RotW 필터링 버그 수정)
│  ├─ api/price/route.js    익명 시세 제보(허니팟·ipHash·쿨다운 — **무로그인 전제 위에 선 방어 설계**)
│  ├─ api/track/route.js    페이지뷰 집계(Upstash Redis)
│  └─ api/admin/*, api/docs/route.js   로그인·로그아웃·문서 CRUD (cookies()는 async — Next 15+)
├─ lib/
│  ├─ zones.js              TZ 38개 데이터, 모의 로테이션, d2emu ID매핑, 영문 퍼지매칭
│  ├─ cube.js               33룬·보석·needCount(승급 규칙) — **룬 데이터 정본**
│  ├─ runewords.js          룬워드 99종. isNew=3.x 신규 7종(룬 조합 **미검증** — UI에 배지로 고지)
│  ├─ rune-planner.js       룬 재고 판정 엔진(순수). combine()은 쓰지 않는다 — 혼합 등급 재고를 표현 못 함
│  ├─ backup.js             export/import + import 검증(포맷·버전·허용키·타입·크기) — 순수
│  ├─ price-baseline.js     기준선 + **AS_OF 상수**(단일 정본) + monthsSinceAsOf() → 6개월 경과 시 경고 배너
│  └─ price-catalog.js, price.js, items.js, auth.js, redis.js, docs.js, pages.js
└─ test/                    node 단위 테스트(의존성 0). `npm test` — rune-planner · backup · price-baseline
```

### 데이터 흐름
1. `page.js`가 마운트/60초마다 `/api/terror-zone` 호출 + 정각 변경 시 즉시 재호출.
2. `route.js`가 `TZ_PROVIDER`(기본 `d2emu`)에 따라 실 API 프록시. 토큰은 **서버 전용**(브라우저 노출 X).
3. 응답 `{ mode:"live"|"mock", provider, current:{kr,en,act,areas}, next:{...}|null, ... }`.
4. `page.js`는 자체 1초 타이머로 **정각까지 카운트다운**(링/진행바) + 알림 트리거.

### 핵심 로직 세부
- `lib/zones.js`
  - `TERROR_ZONES`: 액트별 38개(하위 지역 KR·EN 병기). (2026-07-05: 실데이터 검증 중 "얼어붙은 동토 &
    지옥불 구덩이"(Frozen Tundra & Infernal Pit, 액트5) 누락 발견 → 추가해 37→38개로 수정.)
  - `mockZoneForDate(date)`: `floor(epochHour) % 38` 결정론적 로테이션(폴백용).
  - `d2emuZoneFromIds(ids)`: d2emu id 배열 → 첫 매핑 지역 반환. `D2EMU_ID_TO_INDEX`(36개 1:1, 새로 추가된
    "얼어붙은 동토 & 지옥불 구덩이"의 d2emu ID는 미확인 — d2emu 승인 후 채울 것) +
    `D2EMU_MERGED`(id 110 = 피의 구릉지/혹한의 고원/아바돈 병합).
  - `matchZone(name)`: d2runewizard 영문명 → 토큰 겹침 퍼지매칭(임계 0.5). `The/and/&`·아포스트로피 차이 견딤.
    실 라이브 데이터로 재검증(score 1.0 매칭 확인, 아래 5번 참고).
- `terror-zone/page.js` 알림: 정각 10/5/1분 전 비프+TTS(다음 지역명 낭독), 정각 변경 시 차임+멘트.
  브라우저 자동재생 정책상 **"소리 켜기"** 선클릭 필요. 상단 배지 `● 실시간` / `◈ 모의`.

## 5. 검증 상태

- ✅ `d2emuZoneFromIds` ID 매핑 36개를 TERROR_ZONES 인덱스와 1:1 수기 대조(정확).
- ✅ `matchZone` 퍼지매칭을 실제 d2runewizard 표기 12케이스로 논리 검증(정상, 무의미 문자열은 null).
- ✅ **빌드/런타임 검증 완료**: `npm install`, `npm run dev`(전 라우트 200 확인: `/`→307 redirect,
  `/terror-zone`, `/runewords`, `/breakpoints`, `/new-items`, `/uberdiablo`, `/api/terror-zone`),
  `npm run build`(10개 정적 페이지 정상 생성) 모두 통과.
- ✅ **보안 패치**: `next` 14.2.5 → **14.2.35**로 업그레이드(critical 취약점 다수 해소).
  단, 14.x 라인 자체의 잔존 high/moderate 취약점(`npm audit`)은 Next 16 메이저 업그레이드가
  필요해 **의도적으로 보류** — breaking change라 별도 논의 필요.
- ✅ **SSR 하이드레이션 버그 수정**: `terror-zone/page.js`가 서버 렌더 시각과 클라 마운트 시각이
  달라 시계 텍스트 불일치 경고가 실제로 발생함을 확인(재현: SSR 응답에 `15:45:21` 등 실시간 값이
  박혀있었음). `mounted` 가드를 추가해 마운트 전엔 정적 플레이스홀더(`불러오는 중…`)만 렌더하도록 수정.
- ✅ **상단 탭 네비게이션 골격 완료**: `app/components/TabNav.js` + `layout.js` 공통 헤더.
  탭 5개(`공포의 영역|룬워드|프레임|신규 아이템|우버 디아`) 모두 실제 라우트 존재, 활성 탭 하이라이트 확인.
  룬워드/프레임/신규아이템/우버디아는 **준비 중 플레이스홀더**(실데이터/로직 없음).
- ✅ **d2runewizard 실데이터 엔드투엔드 검증 완료** (2026-07-05): `.env.local`에 사용자 토큰 설정 →
  `TZ_PROVIDER=d2runewizard` → `/api/terror-zone`이 `mode:"live"` 반환 확인. 브라우저(Playwright 임시 설치 후
  스크린샷, 검증 후 제거)로 실제 렌더링까지 확인 — 헤더/탭/실시간 배지/타이머/진행바 정상, 콘솔 에러 없음.
  - 이 과정에서 실제 문서화(`terrorZone.highestProbabilityZone`)와 다른 실 응답 형태를 발견해 `route.js` 수정.
  - 실 데이터의 `next` 값("Frozen Tundra and Infernal Pit")이 `TERROR_ZONES`에 없어 매칭 실패 →
    지역 누락 버그 발견 및 수정 (위 4/5번 참고). 수정 후 재검증 완료(정상 매칭, `act:5` 배지 표시).
- ⚠ d2emu 실 응답으로 엔드투엔드 테스트 안 됨(토큰 미보유). 승인 후 검증 필요. 승인되면
  `D2EMU_USERNAME`/`D2EMU_TOKEN` 채우고 `.env.local`의 `TZ_PROVIDER`를 `d2emu`로 되돌릴 것
  (기본값 유지 목적 — d2runewizard는 "다음 지역"까지 나오지만 d2emu가 더 안정적인 1차 소스로 의도됨).

## 6. 지금 막혀 있는 것 (사용자 액션 대기)

1. **d2emu 접근 승인**: 사용자가 d2emu Discord에 요청 예정. 받으면:
   - `.env.local`에 `D2EMU_USERNAME`, `D2EMU_TOKEN` 입력하고 `TZ_PROVIDER=d2emu`로 되돌리기.
   - **승인 안내의 실제 인증 헤더 형식 + `/api/v1/tz` 응답 샘플**을 확보해
     `route.js`의 `fromD2Emu()` headers/파싱을 정확히 맞출 것.
   - 응답에서 "얼어붙은 동토 & 지옥불 구덩이"(TERROR_ZONES 인덱스 34)의 zone ID를 확인해
     `D2EMU_ID_TO_INDEX`에 채울 것 (현재 미확인 상태).
2. ~~(대안) d2runewizard 토큰으로 즉시 "현재 지역"만 실시간 확인~~ → **완료, 현재 이 상태로 운영 중**
   (2026-07-05~). "다음 지역"도 실제로 제공됨(기존 가정과 달리). d2emu 승인 전까지 이 상태 유지.

## 7. 다음에 할 일 (우선순위 순)

1. ~~빌드/런타임 검증~~ ✅ 완료 (5번 항목 참고).
2. ~~상단 탭 네비게이션 골격~~ ✅ 완료. `app/components/TabNav.js` + `layout.js`. 각 탭은
   `app/<slug>/page.js` (일반 폴더, route group `(routes)` 아님 — URL에 세그먼트가 실제로 필요해
   그룹핑 불필요하다고 판단).
3. ~~d2runewizard로 임시 실시간 전환~~ ✅ 완료 (5/6번 참고). **d2emu 승인 반영**은 승인 나올 때까지 대기.
4. ~~우버 디아블로(클론 디아) 추적기~~ ✅ 완료 (2026-07-05, f1f4.net 참고 이미지 기반 구현):
   - `app/api/diablo-clone/route.js`: d2runewizard `GET /api/trackers/diablo-clone` 프록시.
     실 응답은 `{ servers: [{server, progress, message, ladder, hardcore, rotw, region, lastUpdate, lastWalk}, ...] }`
     (region당 rotw 유/무 두 라인, 총 24개). 토큰 없거나 실패 시 전 구간 progress:1 모의 폴백.
     ~~최초 구현 시 `rotw=true`를 제외하고 기본 리전만 사용~~ → **오류였음, 아래 4-2번에서 수정됨.**
   - `app/uberdiablo/page.js`: 헤더(제목 + 시즌 배지 "악마술사의 군림"=패치 3.2/시즌14 "Reign of the Warlock"
     공식 한글명, 정적 표시) + SC/HC 토글 + 지역 필터(전체/아시아/미국/유럽, 클라이언트 필터링) + 래더/논래더
     2단 카드(지역별 6칸 진행바 + X/6). "이후 로테이션" 같은 예측 섹션은 **의도적으로 제외**(사용자 지시,
     디아 클론은 TZ처럼 미래 예측이 없는 도메인이라 이미지에도 없음).
   - `globals.css`에 `--clone`(#f2994a) 액센트 + `.dc-*` 클래스 추가.
   - 브라우저(Playwright 임시 설치→검증→제거)로 라이브 데이터/필터/토글 인터랙션 확인 완료, 콘솔 에러 없음.
   - ⚠ **검증 중 `.next` 캐시 손상 이슈 발견**: `npm run build` 직후 `npm run dev`를 실행하면 이전 서버가
     남아있는 상태에서 `.next/static/chunks/main-app.js` 등이 404 나며 클라이언트 하이드레이션이 통째로
     실패하는 현상 재현됨. `.next` 삭제 + 기존 dev 프로세스 완전 종료 후 재시작으로 해결.
     **build → dev 전환 시 항상 `.next`를 지우고 시작할 것** (재발 방지 팁으로 기록).
4-1. ~~공역 페이지에 우버 디아 위젯 병합~~ ✅ 완료 (2026-07-05, 사용자 요청):
   - `UberDiabloWidget`을 `app/components/`로 추출해 `terror-zone/page.js`와 `uberdiablo/page.js`가 공유.
   - `terror-zone/page.js`의 "이후 로테이션" 카드(모의 모드 전용, 실시간 모드에선 안내 문구만 표시하던 섹션)를
     완전히 제거하고 그 자리에 `<UberDiabloWidget/>`을 임베드.
   - ~~"우버 디아" 탭은 그대로 유지~~ → **4-2번에서 결국 제거됨** (첫 지시 때는 탭 유지로 해석했으나
     사용자가 바로 다음 턴에서 명시적으로 "상단 우버 디아 탭은 제거"라고 재요청함).
   - `TabNav.js`의 첫 탭 라벨 "공포의 영역" → **"공역"**으로 변경(라우트 `/terror-zone`은 그대로).
4-2. ~~우버 디아 탭 제거 + 데이터 동기화 버그 수정~~ ✅ 완료 (2026-07-05, 사용자가 d2runewizard.com 실사이트와
   수치가 다르다고 제보):
   - **탭 제거**: `TabNav.js`에서 "우버 디아" 항목 삭제 + `app/uberdiablo/` 디렉터리 전체 삭제(더 이상 독립
     페이지 없음 — `UberDiabloWidget`은 이제 `terror-zone/page.js`에서만 렌더됨).
   - **버그 원인**: d2runewizard `diablo-clone` API의 `rotw` 필드를 "Reign of Terror(중복/레거시) 라인"으로
     오해해 `rotw=false`(구 리전)만 사용했었음. 실제로는 **`rotw` = "Reign of the Warlock"**(현재 3.2 패치
     시즌 "악마술사의 군림")을 의미 — d2runewizard 자체 웹사이트 필터에도 "RotW/Ladder/HC" 3종 토글로
     노출되는 정식 카테고리임(웹서치로 확인). 즉 **현재 시즌 데이터를 원하면 `rotw=true` 라인을 써야 하는데
     정반대로 필터링하고 있었음** — 그래서 화면에 나오던 진행도가 실제 사이트와 어긋났던 것.
   - **수정**: `route.js`의 `REGION_KEY`를 `{Asia:...}` → `{AsiaRotw:"asia", AmericasRotw:"americas",
     EuropeRotw:"europe"}`로 교체(비-RotW 리전은 매핑이 없어 자동으로 걸러짐). 수정 후 실측치가 사용자가
     보고한 값(래더 SC 기준 아시아1/US1/EU3)과 근접하게 일치함(아시아1/US1/EU2 — 클론 디아 진행도는 실시간으로
     계속 오르므로 확인 시점 차이로 보이는 1칸 오차는 정상).
   - 브라우저 재검증: 탭 배열 `['공역','룬워드','프레임(FCR/FHR)','신규 아이템']`(4개, 우버디아 없음) 확인,
     `/uberdiablo` 라우트 자체가 404 확인, 공역 페이지 하단 위젯에 보정된 수치 표시 확인.
5. ~~남은 로드맵 (룬워드·프레임·신규 아이템)~~ ✅ **3개 모두 완료**:
   - ~~**신규 아이템 → 트레더리 링크 탭**~~ ✅ 완료 (트레더리 한→영 검색기).
   - ~~**프레임(Breakpoints) 페이지**~~ ✅ 완료 (2026-07-08). 8직업 FCR/FHR 표 + 브레이크포인트 계산기.
     데이터 웹 교차검증(클래식=Maxroll, 신규 악마술사=3.0 실측). IAS는 무기 의존적이라 정적 표 대신 계산기 안내.
   - ~~**룬워드 페이지**~~ ✅ 완료 (2026-07-08). 신규 3.x 전체 + 대표 클래식 33종. 룬 순서 오차 0 우선으로
     전체 99종 대신 커리큘럼식 수록(데이터 배열이라 확장 용이). 영문명 주(主)·한글 보조 표기.
   - ~~(다음 후보) 룬워드 전체 99종 확장, 룬 조합기, 호라드릭 큐브 조합법, 즐겨찾기~~ ✅ **4종 모두 완료.**
6. ~~(선택) Next.js 16 메이저 업그레이드 검토~~ ✅ **완료 (2026-07-13).** `npm audit` 실측 결과 14.x에는
   수정판이 **존재하지 않았다**(취약 범위 `9.3.4-canary.0 ~ 16.3.0-canary.5`) — "버티기"는 선택지가 아니었다.
   16.2.10 + React 19로 올려 **취약점 0건**. 브레이킹 체인지 수정: `cookies()`·동적 라우트 `params`가
   async가 됨(Next 15+) → `await` 5+2곳. **빌드는 코드 수정 0줄로 통과했고 `/admin`만 런타임 500이었다 —
   업그레이드 검증은 build가 아니라 서버 기동 + 전 라우트 실측이다.**

## 7-A. 다음에 할 일 (2026-07-13 기준)

로드맵 정본은 `multi-agent/tasks/diablo-next-features-review/artifacts/next-features-review.md`.

- **알림 확장(공역 교체·파밍 리셋)** — 착수 전 **범위 결정 필요**: 브라우저 닫힘·백그라운드 throttling·
  정시성 한계를 UI에 명시할 것. "S 작업"으로 약속하지 말 것.
- **홀리 그레일 클래식 확장** — 코드가 아니라 **데이터 조달이 병목**(유니크·세트 전체 koKR 공식 표기).
  항목이 6배가 되면 기존 사용자 진행률이 폭락하므로 **범위 토글 + ID 안정성 + `grail:v1 → v2` 마이그레이션**을
  설계에 선반영해야 한다. 별도 트랙.
- **시세 관리자 편집(Redis)** — 현재는 정적 상수 + 6개월 경과 자동 경고로 갈음.

## 8. 프로젝트 규칙 요약 (반드시 준수)

- **어조:** 간결·핵심·코드 중심. 불필요한 인사/사과 생략.
- **다크 테마 기본**, 인게임 색상 코드 엄수: 고유 #c7b377 / 세트 #00ff00 / 룬워드 #d9c48b / 마법 #4850b8 / 희귀 #ffff00.
- **공식 한국어 번역어** 사용 + 괄호에 약어 병기(예: 시전 속도(FCR), 타격 회복 속도(FHR)).
- **룬워드 조합 순서 / 프레임 구간은 오차 0.**
- **최신 패치(3.2 이후)** 기준. 컴포넌트는 모듈형(RuneIcon, ItemCard, BreakpointTable 등)으로 분리.
- 룬워드/프레임 등 스캐닝 정보는 **표(Table)/그리드(Grid)**로.

## 9. 새 인스턴스용 시작 프롬프트 (복사해서 사용)

```
너는 D2R 하드코어 고인물이자 시니어 프론트엔드 엔지니어야. multi-agent/diablo-dashboard(정본, git) 의
HANDOFF.md 와 README.md 를 먼저 읽고 현재 상태를 파악해. 이 프로젝트는 Next.js(App Router)
기반 D2R 대시보드이고, v1으로 공포의 영역 타이머가 구현돼 있어(데이터 소스 d2emu 기본,
실패 시 모의 폴백). 빌드/런타임 검증과 상단 탭 네비게이션 골격은 이미 완료됨(app/runewords,
app/breakpoints, app/new-items, app/uberdiablo 는 준비 중 플레이스홀더만 있음). 지금 할 일:
4개 플레이스홀더 탭 중 사용자가 지정하는 것부터 실제 데이터/표로 구현하기. 프로젝트 규칙
(다크테마·인게임 색상·공식 한국어 용어·룬워드/프레임 오차 0·최신 3.2 패치)을 준수하고,
간결·코드 중심으로 답해.
```
