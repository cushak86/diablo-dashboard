import Link from "next/link";
import { RW } from "../../lib/runewords";
import { RUNES } from "../../lib/cube";
import { TERROR_ZONES } from "../../lib/zones";
import { SITE_PAGES, OG_IMAGE } from "../../lib/site-pages";

// 소개·연락처 페이지. 서버 컴포넌트 — 본문이 프리렌더 HTML에 그대로 박힌다.
//
// 왜 만들었나: 2026-08-05 애드센스 검토에서 **운영 주체와 연락 수단이 어디에도 없다**는 것이 확인됐다.
//   홈 하단에 "각 페이지의 제보 기능을 이용해 주세요" 한 줄뿐이라 실제 연락 수단이 0개였다.
//   광고 심사·검색 신뢰도 양쪽에서 소개(운영자 신원·목적)와 연락처는 기본 골격으로 취급된다.
//
// ⚠ 저작권 고지는 장식이 아니다 — 게임 IP를 쓰는 팬 사이트가 광고를 붙일 때 필요한 최소 방어선이다.
//   "비공식·블리자드와 무관"을 명시하고, 상표 귀속을 밝힌다.

export const metadata = {
  title: "사이트 소개 · 연락처",
  description:
    "D2R 대시보드는 디아블로2 레저렉션 플레이에 필요한 도구를 한국어로 모은 비공식 팬 사이트입니다. 운영자, 데이터 출처와 한계, 연락 방법을 안내합니다.",
  alternates: { canonical: "/about" },
  openGraph: {
    images: OG_IMAGE,
    url: "/about",
    title: "사이트 소개 · 연락처 | D2R 대시보드",
    description: "운영자·데이터 출처·연락 방법 안내. 비공식 팬 사이트입니다.",
  },
};

const CONTACT = "cushak@icloud.com";

import AffiliateCards from "../components/AffiliateCards";
export default function AboutPage() {
  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">사이트 소개</div>
          <h1 className="zname">D2R 대시보드는 어떤 사이트인가요?</h1>
          <p className="zen" style={{ marginTop: 10, fontSize: 14, lineHeight: 1.8 }}>
            디아블로2 레저렉션(D2R)을 플레이하며 매번 찾아보게 되는 것들을 한국어 도구 {SITE_PAGES.length - 1}개로
            모은 <b>비공식 팬 사이트</b>입니다. 공포의 영역 {TERROR_ZONES.length}개 묶음의 실시간 시간표,
            룬워드 {RW.length}종과 룬 {RUNES.length}종의 조합·재고 계산, 드롭 위치, 시세 지수를 제공합니다.
            계정도 로그인도 없고, 진행 상황은 서버가 아니라 이용자 브라우저에 저장됩니다.
          </p>
        </div>

        <div className="card">
          <div className="eyebrow gold">운영</div>
          <ul className="info" style={{ marginTop: 10 }}>
            <li><b>운영자</b><span>cushak (개인 운영)</span></li>
            <li><b>연락처</b><span><a href={`mailto:${CONTACT}`} style={{ color: "var(--gold)" }}>{CONTACT}</a></span></li>
            <li><b>개설</b><span>2026년 7월</span></li>
            <li><b>기준 패치</b><span>3.2 (악마술사의 군림)</span></li>
          </ul>
          <div className="note">
            오류 제보·문의·삭제 요청은 위 메일로 보내주세요. 데이터가 게임과 다르다는 제보를 특히 환영합니다 —
            실제로 룬 한글 표기 6건이 이용자 지적으로 정정됐습니다.
          </div>
        </div>

        <div className="card">
          <div className="eyebrow gold">데이터 출처와 한계</div>
          <p className="zen" style={{ lineHeight: 1.8 }}>
            정확하지 않은 정보를 정확한 척 보여주지 않는 것을 원칙으로 합니다. 확인되지 않은 값은 화면에
            <b> 검증 필요</b>로 표시하고, 출처가 없는 것은 없다고 밝힙니다.
          </p>
          <ul className="info" style={{ marginTop: 10 }}>
            <li><b>아이템·룬워드·드롭</b><span>게임 데이터에서 직접 추출해 한국어로 정리했습니다.</span></li>
            <li><b>한글 표기</b><span>게임 클라이언트 실측을 정본으로 삼습니다. 커뮤니티 통용명과 다를 때는 통용명도 검색으로 찾을 수 있게 남겨둡니다.</span></li>
            <li><b>공포의 영역·우버 디아블로</b><span>공개 API를 중계합니다. 원 제공처의 장애나 지연이 그대로 반영될 수 있습니다.</span></li>
            <li><b>시세</b><span>정적 기준선과 이용자 익명 제보의 중앙값입니다. <b>비공식·참고용이며 실시간이 아니고</b>, 실제 거래를 보증하지 않습니다.</span></li>
            <li><b>3.0~3.2 신규</b><span>룬워드 {RW.filter((r) => r.isNew).length}종의 룬 조합·옵션은 게임 데이터(CASC)와 대조한 값입니다. 옵션 텍스트는 손으로 적지 않고 생성합니다.</span></li>
          </ul>
        </div>

        <div className="card">
          <div className="eyebrow gold">개인정보와 저장</div>
          <p className="zen" style={{ lineHeight: 1.8 }}>
            회원가입이 없으며 이름·이메일 같은 개인정보를 수집하지 않습니다. 수집 진행·파밍 체크·즐겨찾기·룬 재고는
            이용자 브라우저에만 저장되고, <Link href="/backup" style={{ color: "var(--gold)" }}>백업</Link> 탭에서
            직접 내보내거나 지울 수 있습니다. 자세한 내용은{" "}
            <Link href="/privacy" style={{ color: "var(--gold)" }}>개인정보처리방침</Link>을 참고하세요.
          </p>
        </div>

        <div className="card">
          <div className="eyebrow blood">저작권 고지</div>
          <p className="zen" style={{ lineHeight: 1.8 }}>
            이 사이트는 <b>비공식 팬 사이트</b>이며 Blizzard Entertainment 및 그 계열사와 아무런 제휴·후원·승인
            관계가 없습니다. Diablo, Diablo II: Resurrected 및 관련 명칭·이미지·게임 데이터에 대한 상표권과
            저작권은 Blizzard Entertainment, Inc.에 있습니다. 이 사이트의 정리·번역·계산 도구 부분은 운영자가
            직접 만든 것입니다. 권리자께서 문제를 제기하시면 위 연락처로 알려주시는 대로 조치하겠습니다.
          </p>
        </div>

        {/* 제휴 카드 — 소개·면책을 다 읽은 뒤 자리. 도구 화면에는 넣지 않는다. */}
        <AffiliateCards />
      </div>
    </main>
  );
}
