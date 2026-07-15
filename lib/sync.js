// 무로그인 동기화 클라이언트 — 코드 하나로 기기 간 상태를 잇는다.
// 자동 push가 핵심이다: 수동 백업은 "누르는 것을 기억해야" 하므로 유실 방어가 되지 못한다.
// 코드가 연결돼 있으면, 체크할 때마다 디바운스 후 조용히 서버에 올린다.
import { buildExport, parseImport, applyImport } from "./backup";

export const CODE_KEY = "sync:code";
export const AT_KEY = "sync:at";

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

export const getCode = () => read(CODE_KEY) || "";
export const getSyncedAt = () => read(AT_KEY) || "";
export const setCode = (code, at) => { write(CODE_KEY, code); if (at) write(AT_KEY, at); };
export function clearCode() {
  try { localStorage.removeItem(CODE_KEY); localStorage.removeItem(AT_KEY); } catch {}
}

function payload() {
  return JSON.stringify(buildExport(read, new Date().toISOString()));
}

// code 없이 호출하면 서버가 새 코드를 발급한다.
export async function push(code = getCode()) {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code || undefined, payload: payload() }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "동기화에 실패했습니다.");
  setCode(json.code, json.updatedAt);
  return json;
}

export async function pull(code) {
  const res = await fetch(`/api/sync?code=${encodeURIComponent(code.trim().toLowerCase())}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "불러오기에 실패했습니다.");
  return json; // { payload, updatedAt }
}

// 상태가 바뀔 때마다 호출된다(각 페이지의 저장 지점). 코드가 없으면 아무 일도 하지 않는다.
let timer = null;
export function schedulePush(delay = 2500) {
  if (typeof window === "undefined" || !getCode()) return;
  clearTimeout(timer);
  timer = setTimeout(() => { push().catch(() => {}); }, delay); // 실패는 조용히 — 다음 변경에서 다시 시도된다
}

// 마운트 시 1회: 서버가 로컬보다 최신이면 당겨와 반영한다(다른 기기에서 바꾼 경우).
// 자기가 방금 push했으면 로컬 at == 서버 at이라 아무 일도 안 한다 → 리로드 루프 없음.
// 반영이 있었으면 true를 반환한다(호출부가 location.reload()로 화면을 새로 그린다).
export async function pullIfNewer() {
  const code = getCode();
  if (typeof window === "undefined" || !code) return false;
  let remote;
  try {
    remote = await pull(code);
  } catch {
    return false; // 네트워크·404 등은 조용히 — 로컬 상태로 계속 쓴다
  }
  const localAt = getSyncedAt();
  if (!remote.updatedAt || remote.updatedAt === localAt) return false;
  if (localAt && remote.updatedAt < localAt) return false; // 로컬이 더 최신(아직 push 전) — 덮지 않는다
  const parsed = parseImport(remote.payload);
  if (!parsed.ok) return false; // 서버에 이상한 게 있어도 로컬을 깨지 않는다
  applyImport(parsed, write);
  setCode(code, remote.updatedAt);
  return true;
}
