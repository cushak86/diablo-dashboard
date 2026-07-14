// 그레일 수집 대상 정본 — 3.x 신규(+룬·룬워드) 170 + 클래식 512 = 682.
// grail 페이지와 backup 페이지가 같은 정본을 봐야 하므로 여기서 한 번만 만든다.
// ⚠ id 생성 규칙은 사용자 체크 그 자체다. 바꾸면 수집 기록이 증발한다(test/grail-data.test.mjs가 고정).
import { ITEMS } from "./items";
import { RUNES } from "./cube";
import { RW } from "./runewords";
import { CLASSIC } from "./grail-classic";

function build() {
  const out = [];
  ITEMS.forEach((it) => {
    if (it.cat === "unique") out.push({ id: `u:${it.en}`, kr: it.kr, en: it.en, cat: "unique" });
    else if (it.cat === "set" && it.slug) out.push({ id: `s:${it.en}`, kr: it.kr, en: it.en, cat: "set" });
    else if (it.cat === "jewel") out.push({ id: `j:${it.en}`, kr: it.kr, en: it.en, cat: "jewel" });
    else if (it.cat === "charm") out.push({ id: `c:${it.en}`, kr: it.kr, en: it.en, cat: "charm" });
  });
  RUNES.forEach(([n]) => out.push({ id: `rune:${n}`, kr: n, en: n, cat: "rune" }));
  RW.forEach((r) => out.push({ id: `rw:${r.en}`, kr: r.kr, en: r.en, cat: "rw" }));
  out.forEach((x) => { x.scope = "new"; });
  CLASSIC.forEach((c) => out.push({ ...c, scope: "classic" }));
  return out;
}

export const COLLECT = build();

const SCOPE_OF = new Map(COLLECT.map((x) => [x.id, x.scope]));
// 모르는 id는 버리지 않고 클래식으로 본다(데이터가 사라져도 사용자 체크를 보존).
export const scopeOf = (id) => SCOPE_OF.get(id) || "classic";
