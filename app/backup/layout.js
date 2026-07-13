export const metadata = {
  title: "개인 데이터 백업 · 내보내기 / 가져오기",
  description:
    "디아블로2 레저렉션(D2R) 대시보드의 그레일 진행·파밍 체크·즐겨찾기·룬 재고를 JSON 파일 하나로 백업하고 다른 기기에서 복원합니다. 서버 전송 없이 브라우저에서만 처리합니다.",
  alternates: { canonical: "/backup" },
  robots: { index: false, follow: true },
};

export default function BackupLayout({ children }) {
  return children;
}
