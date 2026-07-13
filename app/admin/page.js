import { cookies } from "next/headers";
import { isAuthed } from "../../lib/auth";
import { getRedis, todayKST } from "../../lib/redis";
import AdminLogin from "../components/AdminLogin";
import AdminPanel from "../components/AdminPanel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

// 방문 통계 조회 (관리자만) — Redis 장애 시 0으로 degrade
async function getStats() {
  const redis = getRedis();
  if (!redis) return { today: 0, total: 0, configured: false };
  try {
    const day = todayKST();
    const [t, tot] = await redis.mget(`visits:${day}`, "visits:total");
    return { today: Number(t) || 0, total: Number(tot) || 0, configured: true };
  } catch {
    return { today: 0, total: 0, configured: true };
  }
}

export default async function AdminPage() {
  const authed = isAuthed((await cookies()).get("admin_session")?.value);
  const stats = authed ? await getStats() : null;

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow blood">관리자</div>
          <h1 className="zname">{authed ? "문서 관리" : "로그인"}</h1>
          <p className="zen">
            {authed ? "마크다운 문서를 업로드하고 목록을 관리합니다." : "관리자 비밀번호를 입력하세요."}
          </p>
        </div>

        {authed && (
          <div className="card">
            <div className="eyebrow gold">방문자 통계</div>
            <div
              className="grid2"
              style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr", marginTop: 8 }}
            >
              <div>
                <div className="eyebrow mute">오늘</div>
                <div className="zname" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {stats.today.toLocaleString("ko-KR")}
                </div>
              </div>
              <div>
                <div className="eyebrow mute">누적</div>
                <div className="zname" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {stats.total.toLocaleString("ko-KR")}
                </div>
              </div>
            </div>
            <p className="zen" style={{ marginTop: 8 }}>일자별 쿠키 기준 근사 방문 집계 (KST).</p>
            {!stats.configured && (
              <div className="note">
                Upstash 환경변수(<code>UPSTASH_REDIS_REST_URL</code>/<code>UPSTASH_REDIS_REST_TOKEN</code>)가
                설정되면 실제 집계가 시작됩니다.
              </div>
            )}
            <a
              className="btn btn-off"
              href="/admin/stats"
              style={{ marginTop: 14, display: "inline-block" }}
            >
              페이지 통계 →
            </a>
          </div>
        )}

        {authed ? <AdminPanel /> : <AdminLogin />}
      </div>
    </main>
  );
}
