// 시세 itemKey 카탈로그: ITEMS(slug 있는 것) + RW(en 정규화). 페이지 검색·화이트리스트 정본.
// ITEMS/RW(대형 스탯 배열)를 import하므로 이 모듈을 쓰는 쪽만 해당 데이터를 번들한다.
import { ITEMS } from "./items";
import { RW } from "./runewords";
import { BASELINE } from "./price-baseline";

// 페이지가 catalog 파일만 import하도록 RUNE_UNITS를 재노출(집계/검증 로직은 price.js에 격리).
export { RUNE_UNITS } from "./price";

// 룬워드 영문명 → slug(itemKey). ITEMS.slug와 동일 규칙.
function rwSlug(en) {
  return String(en || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCatalog() {
  const map = new Map();
  for (const it of ITEMS) {
    if (it.slug) map.set(it.slug, { key: it.slug, kr: it.kr, en: it.en });
  }
  for (const r of RW) {
    const k = rwSlug(r.en);
    if (k && !map.has(k)) map.set(k, { key: k, kr: r.kr, en: r.en });
  }
  // baseline 전용 유명템(유니크·참·고룬 — ITEMS/RW에 없는 것)을 검색·선택 가능하게 병합.
  for (const b of BASELINE) {
    if (b.key && !map.has(b.key)) map.set(b.key, { key: b.key, kr: b.kr, en: b.en });
  }
  return [...map.values()];
}

export const CATALOG = buildCatalog();
export const CATALOG_KEYS = new Set(CATALOG.map((c) => c.key));
