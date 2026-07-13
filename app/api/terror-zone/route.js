import { NextResponse } from "next/server";
import { matchZone, mockZoneForDate, d2emuZoneFromIds } from "../../../lib/zones";

// 60초 캐시 (fair-use TTL 준수)
export const revalidate = 60;

const zoneObj = (z) => ({ kr: z.kr, en: z.en, act: z.act, areas: z.areas });

function mockPayload(reason) {
  const cur = mockZoneForDate(new Date());
  return {
    mode: "mock",
    provider: null,
    reason: reason || null,
    current: zoneObj(cur),
    next: null,
    lastUpdate: null,
    providedBy: null,
  };
}

// 매칭 실패 시에도 원문 이름은 노출
function toZone(name, act) {
  const m = matchZone(name);
  if (m) return zoneObj(m.zone);
  return { kr: name, en: name, act: Number(act) || 0, areas: [] };
}

/* ------------------------- d2runewizard ------------------------- */
// 현재 + 다음 지역 제공. 자율 발급 토큰.
// 실 응답 형태(2026-07 기준 실측): { current: "zone name", next: "zone name",
//   currentTerrorZone: { zone }, nextTerrorZone: { zone } } — 문서화된 형태(terrorZone.highestProbabilityZone)와 다름.
async function fromD2Runewizard() {
  const token = process.env.D2RW_TOKEN;
  if (!token || token.includes("여기에")) return mockPayload("no-token");

  const url = `https://d2runewizard.com/api/trackers/terror-zone?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    headers: {
      "D2R-Contact": process.env.D2RW_CONTACT || "unknown@example.com",
      "D2R-Platform": process.env.D2RW_PLATFORM || "Web",
      "D2R-Repo": process.env.D2RW_REPO || "https://example.com",
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) return mockPayload(`d2rw-${res.status}`);

  const data = await res.json();
  const curName = (data.currentTerrorZone && data.currentTerrorZone.zone) || data.current;
  const nextName = (data.nextTerrorZone && data.nextTerrorZone.zone) || data.next;
  if (!curName) return mockPayload("d2rw-empty");

  return {
    mode: "live",
    provider: "d2runewizard",
    reason: matchZone(curName) ? null : "unmatched-name",
    current: toZone(curName),
    next: nextName ? toZone(nextName) : null,
    apiZoneName: curName,
    apiNextZoneName: nextName || null,
    lastUpdate: null,
    providedBy: "https://d2runewizard.com/terror-zone-tracker",
  };
}

/* ------------------------- d2emu ------------------------- */
// 현재 + 다음 지역 제공. 접근은 d2emu에 직접 요청(수동 승인) 필요.
// 인증 헤더 형식이 공개 문서화돼 있지 않아, 토큰 수령 후 실제 응답에 맞춰
// 아래 헤더명/파싱을 조정하세요. 실패 시 자동으로 모의 폴백됩니다.
async function fromD2Emu() {
  const token = process.env.D2EMU_TOKEN;
  const user = process.env.D2EMU_USERNAME;
  if (!token || !user) return mockPayload("d2emu-no-credentials");

  // 응답 형태: { current: [zoneId,...], next: [zoneId,...] }  (숫자 zone ID 배열)
  const res = await fetch("https://www.d2emu.com/api/v1/tz", {
    headers: {
      // ⚠ 인증 헤더명이 공개 문서화돼 있지 않음. 승인 안내 형식이 다르면 이 부분만 교체.
      "x-emu-username": user,
      "x-emu-token": token,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) return mockPayload(`d2emu-${res.status}`);

  const data = await res.json();
  const curZone = d2emuZoneFromIds(data.current);
  const nextZone = d2emuZoneFromIds(data.next);
  if (!curZone) return mockPayload("d2emu-unmapped");

  return {
    mode: "live",
    provider: "d2emu",
    reason: nextZone ? null : "no-next",
    current: zoneObj(curZone),
    next: nextZone ? zoneObj(nextZone) : null,
    currentIds: data.current ?? null,
    nextIds: data.next ?? null,
    lastUpdate: data.lastUpdate || data.updated || null,
    providedBy: "https://www.d2emu.com/tz",
  };
}

/* ------------------------- 라우트 ------------------------- */
export async function GET() {
  const provider = (process.env.TZ_PROVIDER || "d2emu").toLowerCase();
  try {
    const payload = provider === "d2emu" ? await fromD2Emu() : await fromD2Runewizard();
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(mockPayload(`error-${provider}`));
  }
}
