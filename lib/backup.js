// 개인 데이터 백업 — localStorage에 갇힌 상태를 단일 JSON으로 내보내고 들여온다.
// 순수 모듈: 저장소 접근은 호출자가 주입한 read/write/remove로만 한다(테스트 가능·SSR 안전).
//
// import는 외부 JSON을 내부 상태로 쓰는 경로다. 그래서 검증이 범위에 포함된다:
// 포맷·버전·허용키·타입·크기를 먼저 전부 통과시킨 뒤에야 쓴다(부분 적용 금지 = 원자성).

export const APP = "d2r-dashboard";
export const VERSION = 1;
export const MAX_BYTES = 256 * 1024; // 정상 백업은 수 KB. 이보다 크면 우리 파일이 아니다.

const isStrArray = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");
const isStrRecord = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v) &&
  Object.values(v).every((x) => typeof x === "string");
const isCountRecord = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v) &&
  Object.values(v).every((x) => Number.isSafeInteger(x) && x >= 0 && x <= 99);

// 백업 대상 키. 여기 없는 키는 import에서 무시된다(경고로 표면화).
export const KEYS = [
  { key: "grail:v1", label: "홀리 그레일 진행", check: isStrArray, count: (v) => v.length },
  { key: "farm:v1", label: "파밍 체크", check: isStrRecord, count: (v) => Object.keys(v).length },
  { key: "fav:rw", label: "룬워드 즐겨찾기", check: isStrArray, count: (v) => v.length },
  { key: "fav:ni", label: "신규 아이템 즐겨찾기", check: isStrArray, count: (v) => v.length },
  { key: "runes:v1", label: "룬 재고", check: isCountRecord, count: (v) => Object.keys(v).length },
];

// read(key) → 저장된 원문 문자열 | null
export function buildExport(read, exportedAt) {
  const data = {};
  for (const { key } of KEYS) {
    const raw = read(key);
    if (raw == null) continue;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      // 깨진 값은 내보내지 않는다 — 백업에 쓰레기를 담으면 복원이 더 위험해진다.
    }
  }
  return { app: APP, version: VERSION, exportedAt, data };
}

// 현재 저장 현황 (UI에서 "무엇이 덮어써지는가"를 보여주기 위해)
export function summarize(read) {
  return KEYS.map(({ key, label, check, count }) => {
    const raw = read(key);
    if (raw == null) return { key, label, count: 0 };
    try {
      const v = JSON.parse(raw);
      return { key, label, count: check(v) ? count(v) : 0 };
    } catch {
      return { key, label, count: 0 };
    }
  });
}

// 텍스트 → {ok:true, data, entries, unknownKeys} | {ok:false, error}
// 하나라도 어긋나면 통째로 거부한다. 절반만 들어간 상태가 제일 나쁘다.
export function parseImport(text) {
  if (typeof text !== "string" || text.trim() === "") return { ok: false, error: "빈 파일입니다." };
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > MAX_BYTES) {
    return { ok: false, error: `파일이 너무 큽니다 (${Math.round(bytes / 1024)}KB, 최대 ${MAX_BYTES / 1024}KB).` };
  }

  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON 형식이 아닙니다." };
  }
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, error: "백업 파일 형식이 아닙니다." };
  }
  if (obj.app !== APP) {
    return { ok: false, error: "이 대시보드의 백업 파일이 아닙니다." };
  }
  if (!Number.isInteger(obj.version)) {
    return { ok: false, error: "버전 정보가 없습니다." };
  }
  if (obj.version > VERSION) {
    return { ok: false, error: `더 최신 버전의 백업입니다 (v${obj.version}). 대시보드를 새로고침해 주세요.` };
  }
  if (obj.data === null || typeof obj.data !== "object" || Array.isArray(obj.data)) {
    return { ok: false, error: "백업에 데이터가 없습니다." };
  }

  const known = new Map(KEYS.map((k) => [k.key, k]));
  const entries = [];
  for (const [key, value] of Object.entries(obj.data)) {
    const spec = known.get(key);
    if (!spec) continue; // 알 수 없는 키 — 아래에서 경고로 모은다
    if (!spec.check(value)) {
      return { ok: false, error: `"${spec.label}" 데이터 형식이 올바르지 않습니다. 가져오기를 중단했습니다.` };
    }
    entries.push({ key, label: spec.label, value, count: spec.count(value) });
  }
  const unknownKeys = Object.keys(obj.data).filter((k) => !known.has(k));
  if (entries.length === 0) {
    return { ok: false, error: "가져올 수 있는 데이터가 없습니다." };
  }
  return { ok: true, data: obj.data, entries, unknownKeys };
}

// 검증을 통과한 결과만 받는다. 백업에 없는 키는 건드리지 않는다(부분 백업 복원 시 나머지 보존).
export function applyImport(parsed, write) {
  if (!parsed || !parsed.ok) throw new Error("검증되지 않은 데이터를 적용할 수 없다");
  for (const { key, value } of parsed.entries) {
    write(key, JSON.stringify(value));
  }
  return parsed.entries.length;
}
