# D2R 대시보드 (D2R Dashboard)

디아블로2 레저렉션(D2R) 통합 대시보드. Next.js(App Router) 기반, 상단 탭으로 페이지를 확장합니다.
**공역(공포의 영역, Terror Zone)** 탭에 실시간 타이머·음성 안내와 **우버 디아(클론 디아) 진행도**가
함께 표시되며, 서버 라우트에서 **d2emu/d2runewizard** 실데이터를 프록시합니다. 나머지 탭(룬워드·프레임·
신규 아이템)은 골격만 있는 준비 중 페이지입니다. 우버 디아는 독립 탭 없이 공역 페이지 하단에만 존재합니다.

## 구조

```
app/
  layout.js                     루트 레이아웃 — 공통 헤더 + 탭 내비게이션
  components/TabNav.js          탭 내비게이션 (클라이언트, 현재 경로 하이라이트). 탭: 공역|룬워드|프레임(FCR/FHR)|신규 아이템
  components/UberDiabloWidget.js 클론 디아 위젯 — terror-zone/page.js 하단에서 렌더
  globals.css                   다크 테마 스타일
  page.js                       루트 — /terror-zone 으로 리다이렉트
  terror-zone/page.js           공역(공포의 영역) 대시보드 (클라이언트) — 타이머·사운드·알림 + 하단에 우버 디아 위젯 임베드
  runewords/page.js             룬워드 (준비 중 골격)
  breakpoints/page.js           프레임 FCR/FHR (준비 중 골격)
  new-items/page.js             신규 아이템 (준비 중 골격)
  api/terror-zone/route.js      서버 라우트 — d2emu/d2runewizard 프록시(+모의 폴백)
  api/diablo-clone/route.js     서버 라우트 — d2runewizard diablo-clone 프록시(+모의 폴백, RotW=현재 시즌 라인 사용)
lib/
  zones.js                      TZ 지역 데이터 · 모의 로테이션 · 영문→한글 퍼지 매칭
index.html                      (참고) 서버 없이 여는 오프라인 모의 뷰어
```

## 실행

```bash
npm install
cp .env.local.example .env.local   # 토큰 입력 후
npm run dev                        # http://localhost:3000
```

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

## 향후 계획

- ✅ 상단 탭 네비게이션 골격 (공역 | 룬워드 | 프레임 | 신규 아이템)
- ✅ 우버 디아블로(클론 디아) 추적기 — d2runewizard `diablo-clone` API(RotW=현재 시즌 라인 사용), 래더/논래더
  × SC/HC × 지역 필터. 독립 탭 없이 공역 페이지 하단에 임베드.
- 룬워드/프레임(FCR·FHR) 페이지 실제 데이터·표 구현
- 신규 아이템 트레더리(Traderie) 링크 탭

---
Data courtesy of [d2emu.com](https://www.d2emu.com/tz) · [d2runewizard.com](https://d2runewizard.com/terror-zone-tracker) · Not affiliated with Blizzard.
