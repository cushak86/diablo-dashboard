import { NextResponse } from "next/server";

// 60초 캐시 (fair-use TTL 준수)
export const revalidate = 60;

// d2runewizard는 리전별로 두 트래킹 라인을 병행 제공: 기본(rotw:false, 구 비-RotW 리전)과
// "AsiaRotw"/"AmericasRotw"/"EuropeRotw"(rotw:true) = 현재 3.2 패치 시즌 "Reign of the Warlock"(악마술사의 군림).
// 우리 앱은 현재 시즌 기준으로 보여줘야 하므로 RotW 라인만 사용한다.
const REGION_KEY = { AsiaRotw: "asia", AmericasRotw: "americas", EuropeRotw: "europe" };

// 실데이터 없을 때 폴백: 전 구간 progress 1(가장 낮은 단계)로 표시
function mockPayload(reason) {
  const entries = [];
  for (const region of Object.values(REGION_KEY)) {
    for (const ladder of [true, false]) {
      for (const hardcore of [true, false]) {
        entries.push({ region, ladder, hardcore, progress: 1, message: "Terror gazes upon Sanctuary" });
      }
    }
  }
  return { mode: "mock", provider: null, reason: reason || null, updatedAt: null, entries, providedBy: null };
}

export async function GET() {
  const token = process.env.D2RW_TOKEN;
  if (!token || token.includes("여기에")) return NextResponse.json(mockPayload("no-token"));

  try {
    const url = `https://d2runewizard.com/api/trackers/diablo-clone?token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      headers: {
        "D2R-Contact": process.env.D2RW_CONTACT || "unknown@example.com",
        "D2R-Platform": process.env.D2RW_PLATFORM || "Web",
        "D2R-Repo": process.env.D2RW_REPO || "https://example.com",
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json(mockPayload(`dc-${res.status}`));

    const data = await res.json();
    const servers = Array.isArray(data.servers) ? data.servers : [];
    const entries = [];
    let updatedAt = null;

    for (const s of servers) {
      const region = REGION_KEY[s.region]; // RotW가 아닌 구 리전("Asia" 등)은 매핑 없어 자동 제외됨
      if (!region) continue;
      entries.push({
        region,
        ladder: !!s.ladder,
        hardcore: !!s.hardcore,
        progress: s.progress,
        message: s.message || null,
      });
      const ts = s.lastUpdate?.seconds ? s.lastUpdate.seconds * 1000 : null;
      if (ts && (!updatedAt || ts > updatedAt)) updatedAt = ts;
    }
    if (!entries.length) return NextResponse.json(mockPayload("dc-empty"));

    return NextResponse.json({
      mode: "live",
      provider: "d2runewizard",
      reason: null,
      updatedAt,
      entries,
      providedBy: "https://d2runewizard.com/diablo-clone-tracker",
    });
  } catch {
    return NextResponse.json(mockPayload("error"));
  }
}
