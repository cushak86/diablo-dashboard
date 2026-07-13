import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAuthed } from "../../../lib/auth";
import { getRedis } from "../../../lib/redis";
import { TRACKED_PATHS, PATH_LABELS } from "../../../lib/pages";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "통계",
  robots: { index: false, follow: false },
};

// 화이트리스트 경로만 조회(SCAN 미사용) — page:* 조회수 + dwell:* 합/카운트로 평균 산출.
async function getPageStats() {
  const redis = getRedis();
  if (!redis) return { rows: [], configured: false };
  try {
    const [views, dwells] = await Promise.all([
      Promise.all(TRACKED_PATHS.map((p) => redis.get(`page:${p}`))),
      Promise.all(TRACKED_PATHS.map((p) => redis.hgetall(`dwell:${p}`))),
    ]);
    const rows = TRACKED_PATHS.map((p, i) => {
      const v = Number(views[i]) || 0;
      const d = dwells[i] || {};
      const sum = Number(d.sum) || 0;
      const count = Number(d.count) || 0;
      return {
        path: p,
        label: PATH_LABELS[p] || p,
        views: v,
        avgMs: count ? Math.round(sum / count) : 0,
      };
    })
      .filter((r) => r.views > 0)
      .sort((a, b) => b.views - a.views);
    return { rows, configured: true };
  } catch {
    return { rows: [], configured: true };
  }
}

// ms → "N초" / "N분 M초"
function fmtDwell(ms) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}분 ${r}초` : `${m}분`;
}

export default async function StatsPage() {
  if (!isAuthed((await cookies()).get("admin_session")?.value)) redirect("/admin");
  const { rows, configured } = await getPageStats();

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow blood">관리자</div>
          <h1 className="zname">페이지 통계</h1>
          <p className="zen">페이지별 조회수와 평균 체류시간 (개발자 제외 · 근사치).</p>
          <a className="btn btn-off" href="/admin" style={{ marginTop: 12, display: "inline-block" }}>
            ← 관리자
          </a>
        </div>

        <div className="card">
          <div className="eyebrow gold">페이지별 사용량</div>
          {rows.length === 0 ? (
            <div className="note">
              아직 수집된 데이터가 없습니다.{!configured && " (Upstash 미설정)"}
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              {rows.map((r, i) => (
                <div
                  key={r.path}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    padding: "10px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--line)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--parch)", fontWeight: 700 }}>{r.label}</div>
                    <div className="ti-meta">{r.path}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      className="zname"
                      style={{ fontSize: 20, margin: 0, fontVariantNumeric: "tabular-nums" }}
                    >
                      {r.views.toLocaleString("ko-KR")}
                    </div>
                    <div className="ti-meta">평균 {fmtDwell(r.avgMs)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
