import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침",
  description:
    "디아블로2 레저렉션 대시보드의 개인정보처리방침 — 개인 진행 데이터의 브라우저 로컬 저장, 선택적 동기화, 익명 방문 통계, 쿠키, IP 사용, 외부 서비스 프록시에 대한 안내.",
  alternates: { canonical: "/privacy" },
};

const S = { fontSize: 13, color: "#b9b9b9", lineHeight: 1.7, margin: "0 0 10px" };
const HD = { fontSize: 12, fontWeight: 800, letterSpacing: ".1em", color: "var(--gold)", textTransform: "uppercase", marginTop: 22, marginBottom: 8 };
const LI = { fontSize: 13, color: "#b9b9b9", lineHeight: 1.7, marginBottom: 5 };

export default function PrivacyPage() {
  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">개인정보처리방침</div>
          <h1 className="zname">개인정보처리방침</h1>
          <p className="zen">시행일: 2026-07-18</p>

          <p style={{ ...S, marginTop: 16 }}>
            디아블로2 레저렉션 대시보드(이하 &ldquo;서비스&rdquo;)는 회원가입이 없고, 이름·이메일 같은
            개인을 식별하는 정보를 수집하지 않습니다. 아래는 서비스가 실제로 다루는 데이터와 그 목적입니다.
          </p>

          <div style={HD}>1. 개인 진행 데이터 — 브라우저에 로컬 저장</div>
          <p style={S}>
            홀리그레일(연대기) 수집, 파밍 체크, 즐겨찾기, 룬 재고 같은 개인 진행 상태는 <b>여러분의 브라우저
            로컬 저장소(localStorage)에만</b> 저장되며, 기본적으로 서버로 전송되지 않습니다. 브라우저 데이터를
            지우면 함께 삭제됩니다. <Link href="/backup" style={{ color: "var(--gold)" }}>백업</Link> 탭에서 JSON으로
            내보내고 복원할 수 있습니다.
          </p>

          <div style={HD}>2. 기기 간 동기화(코드) — 선택 기능</div>
          <p style={S}>
            동기화 코드를 생성하면, 위 진행 데이터의 백업이 무작위 <b>코드</b> 아래 서버(Upstash Redis)에
            저장되어 다른 기기에서 복원할 수 있습니다. 이 저장은 <b>여러분이 코드를 만들 때만</b> 이뤄지며,
            신원이 아니라 코드에만 연결됩니다. 데이터는 마지막 사용 시점부터 <b>180일</b> 뒤 자동 만료되며,
            사용할 때마다 기간이 갱신됩니다. 코드를 아는 사람은 그 백업을 불러올 수 있으니 코드를 공유하지 마세요.
          </p>

          <div style={HD}>3. 익명 방문 통계</div>
          <p style={S}>
            서비스 개선을 위해 <b>개인을 식별하지 않는 집계 수치</b>만 기록합니다 — 일자별/전체 방문 수, 페이지별
            조회 수와 평균 체류 시간. 개별 사용자의 프로필이나 이동 경로를 만들지 않습니다.
          </p>

          <div style={HD}>4. 쿠키</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li style={LI}><b>dv</b> — 방문 수를 하루 1회만 세기 위한 중복 방지용(httpOnly, 24시간).</li>
            <li style={LI}><b>dv_exclude</b> — 운영자가 자신의 방문을 통계에서 제외할 때 쓰는 선택 쿠키.</li>
            <li style={LI}><b>admin_session</b> — 관리자 페이지 로그인용(일반 사용자에게는 설정되지 않음).</li>
          </ul>
          <p style={S}>광고·분석용 제3자 추적 쿠키는 사용하지 않습니다.</p>

          <div style={HD}>5. IP 주소</div>
          <p style={S}>
            IP 주소는 <b>남용 방지와 요청 제한(레이트리밋)</b>에만 일시적으로 사용됩니다. 시세 제보 기능은 원본 IP를
            저장하지 않고 <b>해시 처리한 값</b>으로 일일 한도·재제보 쿨다운만 판단합니다. 동기화 요청 제한에도 IP가
            임시 키로 쓰이며 기간이 지나면 만료됩니다. IP를 광고·프로파일링 목적으로 쓰지 않습니다.
          </p>

          <div style={HD}>6. 외부 서비스</div>
          <p style={S}>
            공포의 영역(테러존)·우버 디아블로 진행도 등 실시간 게임 데이터는 서버에서 <b>d2emu.com</b>,
            <b> d2runewizard.com</b> 같은 공개 소스를 프록시해 제공합니다. 이 과정에서 여러분의 개인정보가
            외부로 전달되지 않습니다. 빌드 가이드의 출처 링크(맥스롤·아이시베인즈 등)로 이동하면 해당 사이트의
            방침이 적용됩니다.
          </p>

          <div style={HD}>7. 광고</div>
          <p style={S}>현재 서비스에는 광고가 없습니다. 향후 도입 시 이 방침을 갱신하고 고지합니다.</p>

          {/* 2026-08-09 감사: 정보주체 권리 행사 절차·보호책임자·구제 방법이 통째로 없었다.
              그리고 "각 페이지의 제보 기능을 이용해 주세요"는 개인정보 요청 창구가 될 수 없다 —
              /about 은 이메일을 안내하는데 방침만 다른 말을 하고 있었다. 이메일로 통일한다.
              형제 사이트 agenwiki 방침을 정본으로 삼아 같은 항목을 갖춘다. */}
          <div style={HD}>8. 정보주체의 권리와 행사 방법</div>
          <p style={S}>
            <b>열람·정정·삭제·처리정지</b>를 언제든 요청하실 수 있습니다. 접수 창구는
            <a href="mailto:cushak@icloud.com" style={{ color: "var(--gold)" }}> cushak@icloud.com</a> 이며,
            받은 날부터 <b>10일 이내</b>에 처리하고 결과를 알려드립니다.
            다만 위 1~2항대로 진행 데이터는 <b>이 브라우저에만</b> 있고 서버에는 동기화 코드로 묶인 값만 있어,
            요청하신 내용에 해당하는 정보가 없을 수 있습니다 — 그때는 없다고 그대로 알려드립니다.
            브라우저의 기록은 각 페이지의 「기록 초기화」로 직접 지우실 수 있습니다.
          </p>

          <div style={HD}>9. 개인정보 보호책임자</div>
          <p style={S}>
            개인이 운영하는 사이트라 별도 조직이 없습니다. 운영자가 보호책임자를 겸합니다 —
            연락처 <a href="mailto:cushak@icloud.com" style={{ color: "var(--gold)" }}>cushak@icloud.com</a>.
          </p>

          <div style={HD}>10. 권익침해 구제 방법</div>
          <p style={S}>
            개인정보 침해로 상담·신고가 필요하시면 아래 기관에 문의하실 수 있습니다.
            <br />· 개인정보 침해신고센터 — 국번없이 118 / privacy.kisa.or.kr
            <br />· 개인정보 분쟁조정위원회 — 1833-6972 / www.kopico.go.kr
            <br />· 대검찰청 사이버수사과 1301 / 경찰청 사이버수사국 182
          </p>

          <div style={HD}>11. 문의 및 변경</div>
          <p style={S}>
            방침이 바뀌면 이 페이지의 시행일을 갱신합니다. 데이터 관련 문의나 오류 제보는
            <a href="mailto:cushak@icloud.com" style={{ color: "var(--gold)" }}> cushak@icloud.com</a> 으로
            보내주세요. 시세·아이템 데이터의 오류 제보는 각 페이지의 제보 기능을 쓰셔도 됩니다.
          </p>

          <p style={{ ...S, marginTop: 18 }}>
            <Link href="/" style={{ color: "var(--gold)" }}>← 홈으로</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
