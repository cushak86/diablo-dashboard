# 인수인계 — 방문 통계 · 관리자 · MD 문서 기능 (stats/admin/docs)

> 이 문서는 **다른 AI 인스턴스가 통계/관리자/마크다운 문서 기능을 이어서 작업**하기 위한
> 컨텍스트 문서다. 공역(Terror Zone)·우버디아 등 기존 대시보드 맥락은 `HANDOFF.md`를 참고.
> 이 기능군은 그 위에 추가된 별개 레이어다.

너는 지금 `multi-agent/diablo-dashboard`(Next.js 16 App Router · React 19, 순수 JS, Vercel 배포, **git 정본**) 저장소에 있다.
아래 기능은 이미 구현·빌드검증·프로덕션 배포·동작확인까지 완료된 상태다.

## 배포 정보
- 프로덕션(alias): https://diablo-dashboard-phi.vercel.app
- Vercel 프로젝트: cushaks/diablo-dashboard (`.vercel/project.json` 연결됨)
- 재배포: `npx vercel --prod --yes`
- 백엔드: Upstash Redis 단일. Vercel env 3개 등록됨(Production):
  `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ADMIN_PASSWORD`
- 백업·롤백: git (`git revert`). 별도 백업 폴더는 없다.
- 의존성 추가: `@upstash/redis@^1`, `react-markdown@^9`, `remark-gfm@^4`

## 반영된 기능 (전부 라이브에서 동작 확인됨)
1. **방문자 통계**: 미들웨어(`middleware.js`)가 페이지 방문 시 `visits:YYYY-MM-DD`·`visits:total` INCR.
   일자별 httpOnly 쿠키 `dv`로 하루 1회만 집계(근사치, KST 기준 `todayKST`).
   - matcher는 api·_next·og이미지·정적파일(점 포함 경로) 제외.
2. **관리자 게이트 `/admin`**: 단일 비번(`ADMIN_PASSWORD`) 로그인. 세션 쿠키 `admin_session`은
   HMAC(ADMIN_PASSWORD, 라벨) 결정적 토큰, httpOnly/secure/sameSite=strict/8h.
   로그인 비교는 `timingSafeEqual` 상수시간(`lib/auth.js`, `app/api/admin/login/route.js`).
3. **MD 업로드 `POST /api/docs`**(관리자 전용): 256KB 상한, `doc:<id>`(SET nx로 충돌방지→409),
   `docs:index` zset에 zadd. id는 slug+randomUUID 8자(`lib/docs.js`).
4. **MD 목록 `GET /api/docs`**: 공개, 최신 200개, Redis 장애 시 빈 목록으로 graceful degrade(500 방지).
5. **MD 뷰어 `/docs/[id]`**: react-markdown + remark-gfm, **rehype-raw 없음**(raw HTML 미렌더 = XSS 차단).
   스타일은 `app/globals.css`의 `.md-body{...}` 블록.

## 최근 변경 — 통계를 공개 → 관리자 전용으로 이전
- 공개 페이지 `app/stats/page.js` **삭제**(현재 `/stats`는 404).
- 탭바 `app/components/TabNav.js`에서 "통계" 탭 링크 **제거**.
- `app/admin/page.js`를 async 서버컴포넌트로 변경 → **로그인(authed) 상태에서만** Redis에서
  오늘/누적을 조회해 "방문자 통계" 카드로 표시(비인증 시 숫자 미노출). Redis 장애 시 0 degrade.
- 방문 집계 미들웨어는 그대로 유지(계속 카운팅). 데이터 연속성 유지됨.

## 파일 맵 (이 기능군)
```
lib/redis.js              getRedis()(env-null 가드) + todayKST()
lib/auth.js               sessionToken()/isAuthed() HMAC + timingSafeEqual
lib/docs.js               makeId()/sanitizeId()/MAX_DOC_BYTES(256KB)
middleware.js             방문 INCR + dv 쿠키
app/admin/page.js         인증 게이트 + (인증 시) 통계 카드 + AdminPanel
app/api/admin/login/route.js   비번 검증→admin_session 쿠키 발급
app/api/admin/logout/route.js  쿠키 제거
app/api/docs/route.js     GET(공개 목록) / POST(인증 업로드)
app/docs/[id]/page.js     마크다운 뷰어
app/components/Markdown.js      react-markdown+remark-gfm 래퍼(raw HTML 미렌더)
app/components/AdminLogin.js    로그인 폼(클라)
app/components/AdminPanel.js    업로드/목록/로그아웃(클라)
app/globals.css                 끝에 .md-body 뷰어 스타일 append됨
```

## 과거 트러블슈팅 이력(중요)
- 최초 배포 후 **업로드 실패 + 통계 0** → Vercel 런타임 로그에서 `UpstashError: WRONGPASS
  invalid or missing auth token`(URL·토큰 불일치) 확인. Vercel env의 URL/TOKEN을 **같은 DB 짝**으로
  재등록 후 재배포하여 해결. 현재 읽기·쓰기 모두 정상.
- ⚠ **진단 함정**: GET 라우트가 Redis 장애를 빈 목록으로 감추므로, 쓰기 장애 시 겉보기엔 정상처럼 보임.
  쓰기(INCR/SET) 실패는 미들웨어 catch로 조용히 스킵됨 → **런타임 로그를 봐야 원인이 드러남**
  (`npx vercel logs <deployment-url>`).

## 제약 (반드시 준수)
- `.env.local`(실제 비밀값)은 열거나 값을 출력하지 마라. 시크릿을 로그/커밋에 남기지 마라.
  `vercel env pull` 등 시크릿 materialize는 차단되어 있고 하지 마라.
- 완료 보고 전 반드시 `npm run build` 통과 로그를 확인해라(현재 16 페이지 + Middleware).
- **정본은 git이다**(`dev-sync`의 `multi-agent/diablo-dashboard/`). 롤백은 `git revert`.
  Windows `D:\diablo-dashboard`·`D:\diablo-dashboard-backup`는 폐기됐다(2026-07-13).
- 보안 설계 훼손 금지: graceful degrade, SET nx, 상수시간 비교, **rehype-raw 금지(raw HTML 미렌더)**.

## 구현 상태 정정 (2026-07-13 — 아래 2건은 이미 반영돼 있다)

이 문서는 오래 "미반영"이라고 말해 왔지만 **코드에는 있다.** 문서를 믿고 다시 구현하지 말 것.

- ✅ **로그인 rate-limit** — `app/api/admin/login/route.js:8-9,39` `MAX_FAILS=10` / `WINDOW_SEC=15분`.
  (`@upstash/ratelimit` 의존성 없이 Redis 카운터로 직접 구현.)
- ✅ **세션 만료** — `lib/auth.js:4,40` `MAX_AGE_MS=8h`. 쿠키 maxAge뿐 아니라 **서버가 토큰 나이를 검증**한다
  (시계 오차 허용 포함). 즉 "쿠키 유출 시 비밀번호 변경 전까지 유효"는 더 이상 사실이 아니다 — 8시간 뒤 만료된다.

## 아직 미반영 (선택 후속 — 요청 시)
- **세션 로테이션/다관리자** — 현재는 결정적 HMAC 토큰 1개. 관리자가 여럿이거나 개별 로그아웃·강제 만료가
  필요하면 Redis 랜덤 세션ID + TTL로 바꿔야 한다. (만료 자체는 위처럼 이미 있다.)
- 정확 UV가 필요하면 Vercel Web Analytics 등 병행(현재는 쿠키 기반 근사치).
