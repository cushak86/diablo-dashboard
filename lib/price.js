// 시세 지수 집계·검증(순수 함수). ITEMS/RW를 import하지 않아 페이지 번들에 들어가도 가볍다.
// itemKey 카탈로그는 lib/price-catalog.js로 분리.

export const RUNE_UNITS = ["Um", "Mal", "Ist", "Gul", "Vex", "Ohm", "Lo", "Sur", "Ber", "Jah"];
export const UNIT_SET = new Set(RUNE_UNITS);

// price 전용 정규화: 숫자 타입만 허용(문자열 거부)·양수·상한 9999·소수 2자리.
export function normalizePrice(v) {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0 || v > 9999) return null;
  return Math.round(v * 100) / 100;
}

// note 전용 sanitize: NFKC → 제어·포맷 문자 제거 → 공백 축약 → 80자.
export function sanitizeNote(v) {
  return String(v || "")
    .normalize("NFKC")
    .replace(/\p{C}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

const round2 = (x) => Math.round(x * 100) / 100;

function median(sorted) {
  const n = sorted.length;
  if (!n) return 0;
  const m = Math.floor(n / 2);
  return n % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}
function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  return next !== undefined ? sorted[base] + rest * (next - sorted[base]) : sorted[base];
}
// IQR 트리밍 후 median(표본 4개 이상일 때만 트리밍).
function trimmedMedian(vals) {
  const s = [...vals].sort((a, b) => a - b);
  if (s.length >= 4) {
    const q1 = quantile(s, 0.25);
    const q3 = quantile(s, 0.75);
    const iqr = q3 - q1;
    const lo = q1 - 1.5 * iqr;
    const hi = q3 + 1.5 * iqr;
    const f = s.filter((v) => v >= lo && v <= hi);
    if (f.length) return median(f);
  }
  return median(s);
}

// unit별 분리 집계. reports = [{price, unit, note, t}]. 혼합 median 금지.
export function aggregate(reports, now = Date.now()) {
  const byUnit = new Map();
  for (const r of reports) {
    if (!UNIT_SET.has(r.unit) || typeof r.price !== "number") continue;
    if (!byUnit.has(r.unit)) byUnit.set(r.unit, []);
    byUnit.get(r.unit).push(r.price);
  }
  const units = [];
  for (const u of RUNE_UNITS) {
    const vals = byUnit.get(u);
    if (!vals || !vals.length) continue;
    units.push({ unit: u, median: round2(trimmedMedian(vals)), count: vals.length });
  }
  const recent = [...reports]
    .sort((a, b) => b.t - a.t)
    .slice(0, 8)
    .map((r) => ({ price: r.price, unit: r.unit, note: r.note || "", t: r.t }));
  return { units, total: reports.length, recent, updatedAt: now };
}
