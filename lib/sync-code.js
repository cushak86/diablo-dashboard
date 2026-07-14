// 동기화 코드 — 이 코드가 곧 접근 권한이다(비밀번호와 동일한 무게).
// 그래서 ①추측 불가능한 엔트로피 ②사람이 옮겨 적을 수 있는 문자 집합 ③엄격한 형식 검증이 필요하다.
import { randomBytes } from "node:crypto";

// 혼동 문자 제외(0/O, 1/l/I). 31자 × 24 ≈ 119비트.
export const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export const CODE_RE = /^[23456789abcdefghjkmnpqrstuvwxyz]{8}-[23456789abcdefghjkmnpqrstuvwxyz]{8}-[23456789abcdefghjkmnpqrstuvwxyz]{8}$/;

export function newCode() {
  const b = randomBytes(24);
  let s = "";
  for (let i = 0; i < 24; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return `${s.slice(0, 8)}-${s.slice(8, 16)}-${s.slice(16, 24)}`;
}

// 사용자가 붙여넣는 값 — 대소문자·공백을 관대하게 받되, 형식은 엄격히 본다.
export function normalizeCode(input) {
  return typeof input === "string" ? input.trim().toLowerCase() : "";
}
export const isValidCode = (c) => CODE_RE.test(normalizeCode(c));
