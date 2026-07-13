# docs — 블로그 홍보 자료

D2R 대시보드(https://diablo-dashboard-phi.vercel.app) 소개 글 원고와 스크린샷 모음.

## 폴더 구성

```
docs/
├─ README.md            ← 이 문서
├─ images/              스크린샷 원본 (2배율 고해상도 PNG, 2026-07-05 캡처)
│   ├─ 01-terror-zone.png       공역 대시보드 메인 (실시간 타이머)
│   ├─ 02-uber-diablo.png       다음 지역 + 우버 디아 진행도 위젯
│   ├─ 03-donation.png          후원 모달 (QR + 계좌)
│   ├─ 04-new-items-search.png  트레더리 검색기 — "잠복" 검색 시연
│   ├─ 05-new-items.png         트레더리 검색기 — 기본 목록
│   └─ 06-mobile.png            모바일 뷰 (390px)
├─ wordpress/
│   └─ post.html        워드프레스용 완성 원고 (HTML)
└─ naver/
    └─ post.txt         네이버 블로그용 원고 (복붙용 텍스트)
```

## 사용법

### 워드프레스 (`wordpress/post.html`)
1. 글쓰기 → **"사용자 정의 HTML" 블록** 추가 (또는 코드 편집기 모드)
2. `post.html`의 `<div class="d2r-post">` ~ `</div>` 전체를 붙여넣기
3. 미리보기 확인 후 발행

- 이미지는 `https://diablo-dashboard-phi.vercel.app/blog/*.png` 로 **사이트에 호스팅돼 있어
  별도 업로드 없이 바로 표시**됩니다.
- 워드프레스 미디어 라이브러리에 직접 올리고 싶으면 `images/`의 PNG를 업로드 후 `src`만 교체.

### 네이버 블로그 (`naver/post.txt`)
1. 파일 상단의 안내대로 제목 선택 → 본문 복사 → 스마트에디터에 붙여넣기
2. 본문 중 `▶▶ 이미지 삽입: xx.png ◀◀` 위치에서 `images/`의 해당 PNG를 **직접 업로드**
   (네이버는 외부 이미지 핫링크가 막히므로 반드시 업로드 방식)
3. 파일 하단의 추천 태그 입력 후 발행

- 본문에 사이트 URL을 붙여넣으면 링크 카드가 자동 생성됨 (상단·하단 2곳 권장)

## 스크린샷 재촬영이 필요할 때

사이트 UI가 바뀌면 이미지를 다시 캡처하세요 (Playwright 임시 설치 방식):

```bash
npm i -D playwright && npx playwright install chromium
# scratchpad의 capture.js 참고 (docs/images/ 에 6컷 저장)
node capture-temp.js
npm rm playwright   # 캡처 후 제거 (프로젝트 의존성 아님)
```

캡처 후 `public/blog/`에도 복사하고 `vercel --prod --yes`로 재배포해야
워드프레스 글의 호스팅 이미지가 갱신됩니다.

## 참고 (SEO 연계)

- 블로그 글의 사이트 링크는 **초기 백링크** 역할을 해서 검색엔진 색인을 앞당깁니다
  (search.md 3번 항목). 두 블로그 모두 본문에 실제 URL 링크를 포함할 것.
