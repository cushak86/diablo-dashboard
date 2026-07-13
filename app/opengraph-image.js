import { ImageResponse } from "next/og";

// 링크 공유 미리보기용 OG 이미지 (사이트 전역). 이미지 생성기가 한글 글리프를
// 기본 폰트로 렌더 못 하므로 영문 브랜딩으로 구성.
export const alt = "D2R Dashboard — Terror Zone Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// 빌드 시 정적 프리렌더 대신 요청 시 생성 (로컬 Node 버전/이미지 생성기 호환 이슈 회피)
export const dynamic = "force-dynamic";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0d0a",
          borderTop: "12px solid #c1272d",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 8, color: "#c1272d", fontWeight: 800 }}>
          DIABLO II: RESURRECTED
        </div>
        <div style={{ fontSize: 118, fontWeight: 900, color: "#d9c48b", marginTop: 8 }}>
          D2R DASHBOARD
        </div>
        <div style={{ fontSize: 34, color: "#9a9a9a", marginTop: 20 }}>
          Terror Zone Tracker · Uber Diablo · Traderie
        </div>
      </div>
    ),
    { ...size }
  );
}
