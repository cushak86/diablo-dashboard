import { createHmac, timingSafeEqual } from "crypto";

const SESSION_LABEL = "d2r-admin-v1";
const MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8시간 — 로그인 쿠키 maxAge와 일치
const CLOCK_SKEW_MS = 60 * 1000; // 서버 시계 후퇴 허용치

// ADMIN_PASSWORD를 키로 payload("<발급시각>")를 HMAC 서명. 비밀번호를 모르면 위조 불가.
function sign(payload) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update(`${SESSION_LABEL}.${payload}`).digest("hex");
}

// 토큰 = "<발급시각(base36)>.<서명>". 발급시각을 서명에 포함해 서버측 만료 검증 가능.
export function sessionToken() {
  const payload = Date.now().toString(36);
  const sig = sign(payload);
  if (!sig) return null;
  return `${payload}.${sig}`;
}

export function isAuthed(cookieVal) {
  if (!cookieVal) return false;
  const s = String(cookieVal);
  const dot = s.indexOf(".");
  if (dot <= 0) return false;
  const payload = s.slice(0, dot);
  if (!/^[0-9a-z]+$/.test(payload)) return false;
  const sig = s.slice(dot + 1);
  const expected = sign(payload);
  if (!expected) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  // 서명 검증 후 만료 검증 — 쿠키가 유출돼도 8시간 뒤 서버에서 거부(비밀번호 교체 불필요).
  const issued = parseInt(payload, 36);
  if (!Number.isFinite(issued)) return false;
  const age = Date.now() - issued;
  // 미래 발급시각(음수 age) 거부 — 소폭 시계 후퇴만 허용. 만료 초과도 거부.
  if (age < -CLOCK_SKEW_MS || age > MAX_AGE_MS) return false;
  return true;
}
