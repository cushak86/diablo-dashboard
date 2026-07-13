# 배포 기록 (Vercel) — link.md

> D2R 대시보드를 Vercel에 임시 배포한 전 과정 기록. 재배포·환경변수 변경·도메인 연결 등
> 이후 운영에 필요한 명령과 주의사항을 정리한다.

---

## 1. 요약

| 항목 | 값 |
|---|---|
| **공개 URL (임시)** | https://diablo-dashboard-phi.vercel.app |
| Vercel 프로젝트 | `cushaks/diablo-dashboard` |
| 팀 scope / 계정 | `cushaks` / `suhunlee59-9142` |
| 플랜 | Hobby (무료, 월 $0) |
| 배포일 | 2026-07-05 |
| 배포 방식 | Vercel CLI (Git 없이 로컬 폴더에서 직접 배포) |
| 데이터 모드 | live (d2runewizard 실시간) |

- PC를 꺼도 사이트는 Vercel 클라우드에서 24시간 유지된다. 로컬 `npm run dev`와 무관.
- API 라우트(`/api/terror-zone`, `/api/diablo-clone`)가 서버 토큰을 써서 외부 API를 프록시하므로
  Node 런타임이 필요 → 카페24 정적 호스팅 불가 → Vercel 서버리스 함수로 배포.

---

## 2. 왜 Vercel인가 (카페24 대신)

- 이 앱은 정적 사이트가 아니라 **서버가 필요한 Next.js 앱**이다. `.env.local`의 토큰을
  서버에서만 사용해 d2runewizard API를 프록시한다(토큰 브라우저 노출 금지).
- `cushaks.mycafe24.com`(카페24 웹호스팅)은 PHP/정적 호스팅이라 Node 서버를 못 돌린다.
  정적 export 시 실시간 데이터가 전부 mock으로 떨어지고, 토큰을 클라이언트로 옮기면 노출됨.
- Vercel은 Next.js 제작사 호스팅이라 API 라우트·환경변수를 그대로 지원, 무료로 24시간 운영.

---

## 3. 수행한 단계 (실제 순서)

### 3-1. 사전 준비 / 확인
```bash
npm run build          # 빌드 정상 확인 (10개 페이지 생성)
# .gitignore 에 .env.local 포함 확인 → 토큰 업로드 안 됨
```

### 3-2. CLI 설치 & 로그인 (사용자가 직접)
```powershell
npm i -g vercel
vercel login           # 브라우저 device 인증
vercel whoami          # suhunlee59-9142 확인
```

### 3-3. 프로젝트 연결
```powershell
vercel link --yes
# → cushaks/diablo-dashboard 프로젝트 생성
# → Next.js 자동 감지 (Build: next build)
# → CLI가 .env.local 에 VERCEL_OIDC_TOKEN 자동 추가 (로컬 dev용, 자동관리 — 그대로 둠)
```

### 3-4. 환경변수 등록 (Production, 5개)
`.env.local`의 값을 Vercel Production 환경에 등록. 값은 파일에서 읽어 전달(화면 노출 X).

등록된 키: `TZ_PROVIDER`, `D2RW_TOKEN`, `D2RW_CONTACT`, `D2RW_PLATFORM`, `D2RW_REPO`
(`D2EMU_*`는 비어있어 제외 — d2emu 승인 나면 추가)

> ⚠️ **BOM 이슈 발생 & 해결** (아래 5번 참고). 최종적으로 Bash `printf` 방식으로 등록:
```bash
export PATH="$PATH:/c/Users/gkskn/AppData/Roaming/npm"
for key in TZ_PROVIDER D2RW_TOKEN D2RW_CONTACT D2RW_PLATFORM D2RW_REPO; do
  line=$(grep -E "^[[:space:]]*${key}[[:space:]]*=" .env.local | head -1)
  val=$(printf '%s' "$line" \
        | sed -E "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*//" \
        | sed 's/\xef\xbb\xbf//g' | tr -d '\r' | sed 's/[[:space:]]*$//')
  vercel env rm "$key" production --yes >/dev/null 2>&1
  printf '%s' "$val" | vercel env add "$key" production
done
```

### 3-5. 프로덕션 배포
```bash
vercel --prod --yes
# → 원격 빌드(iad1, ~15초) → https://diablo-dashboard-phi.vercel.app 별칭 생성
```

### 3-6. 검증
```bash
curl -s https://diablo-dashboard-phi.vercel.app/api/terror-zone   # "mode":"live" 확인
curl -s https://diablo-dashboard-phi.vercel.app/api/diablo-clone  # "mode":"live" 확인
```
결과: 두 API 모두 `mode:live` — 공역/클론 디아 실시간 데이터 정상.

---

## 4. 이후 운영 방법

### 코드 수정 후 재배포
```bash
# 프로젝트 루트(d:\diablo-dashboard)에서
vercel --prod --yes
```
- Git 없이 로컬 소스를 그대로 업로드해 원격 빌드. `node_modules`/`.next`는 업로드 제외.

### 환경변수(토큰 등) 변경 시
로컬 `.env.local`만 바꾸면 **로컬 dev만** 반영된다. 배포본은 Vercel에 등록된 값을 쓰므로
아래로 갱신 후 재배포해야 한다.
```bash
export PATH="$PATH:/c/Users/gkskn/AppData/Roaming/npm"
vercel env rm  KEY production --yes
printf '%s' "새값" | vercel env add KEY production
vercel --prod --yes     # 재배포해야 반영됨
vercel env ls           # 등록 목록 확인
```

### d2emu 승인 반영 시 (장기 기본 소스)
1. `.env.local` 에 `D2EMU_USERNAME`, `D2EMU_TOKEN` 입력 + `TZ_PROVIDER=d2emu`
2. Vercel env 에도 동일하게 `D2EMU_USERNAME`, `D2EMU_TOKEN` 추가 + `TZ_PROVIDER` 값을 `d2emu`로 갱신
3. `route.js` 의 `fromD2Emu()` 헤더/파싱을 승인 안내 실제 형식으로 맞춘 뒤 `vercel --prod --yes`

---

## 5. 트러블슈팅 기록 — PowerShell 파이프 BOM

- **증상**: 첫 배포 후 API가 `{"mode":"mock","reason":"error-﻿d2runewizard"}` — `error-` 뒤에
  보이지 않는 문자(BOM, U+FEFF)가 섞임. 토큰 인증 실패 → mock 폴백.
- **원인**: PowerShell(5.1)에서 `$val | vercel env add` 처럼 문자열을 native 명령 stdin으로
  파이프하면 값 앞에 UTF-8 BOM(`ef bb bf`)이 붙는다. `.env.local` 파일 자체엔 BOM 없었음.
- **해결**: 5개 env 삭제 후 **Bash `printf '%s' "$val" | vercel env add`** 로 재등록(BOM 안 붙음) → 재배포.
- **재발 방지**: 값을 native stdin에 넘길 땐 Bash printf 사용. PowerShell을 꼭 쓰면
  `$OutputEncoding = New-Object System.Text.UTF8Encoding($false)` 설정 후 파이프.
  등록 값 길이가 예상보다 3 크면 BOM 의심(`vercel env ls` 로는 값이 안 보이므로 길이로 판단).

---

## 6. 별도 도메인 연결 (나중에)

1. Vercel 대시보드 → 프로젝트 `diablo-dashboard` → **Settings → Domains** → 도메인 추가
2. Vercel이 알려주는 값을 도메인 DNS에 등록:
   - 서브도메인(예: `cushaks.mycafe24.com`) → **CNAME** 레코드
   - 루트 도메인(예: `example.com`) → **A** 레코드
   - 카페24 도메인은 카페24 DNS 관리에서 지정. 새 도메인 구입해도 방식 동일.
3. Vercel 무료 플랜에서 커스텀 도메인 연결·SSL은 **추가 비용 없음**.
   (도메인 자체 구입비만 등록업체에 연 1만원대 발생)

---

## 7. 비용 / 후원 관련

- **월 고정비 0원** (Hobby 무료 플랜). 개인 대시보드 트래픽은 무료 한도(대역폭 100GB 등) 내.
- **후원 링크는 무료 플랜에서 공식 허용** — Vercel Fair Use Guidelines: "Asking for Donations
  does not fall under commercial usage."
- 단, **광고(AdSense 등)·유료 판매·제휴링크가 주 목적**이면 상업적 이용 → Pro($20/월) 필요.
- 데이터 소스(d2runewizard) 토큰도 무료 → API 비용 없음.

---

## 참고 링크

- 프로덕션: https://diablo-dashboard-phi.vercel.app
- Vercel 대시보드: https://vercel.com/cushaks/diablo-dashboard
- Vercel Fair Use: https://vercel.com/docs/limits/fair-use-guidelines
