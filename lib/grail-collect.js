// 그레일 수집 대상 정본 — 3.x 신규(+룬·룬워드) 170 + 클래식 512 = 682.
// grail 페이지와 backup 페이지가 같은 정본을 봐야 하므로 여기서 한 번만 만든다.
// ⚠ id 생성 규칙은 사용자 체크 그 자체다. 바꾸면 수집 기록이 증발한다.
//   여기 규칙뿐 아니라 **items.js·cube.js·runewords.js의 `en` 값도 id의 일부**다(`u:${it.en}`) —
//   영문 이름을 고치면 id가 조용히 바뀐다. 그게 실제 편집 지점이므로 주의는 그쪽에 더 필요하다.
//   안전망: test/grail-data.test.mjs 가 682개 id 문자열 전수를 test/grail-ids.snapshot.json 과 대조한다.
//   ⚠ 2026-07-16 이전 이 자리의 "(test/grail-data.test.mjs가 고정)"은 **거짓이었다** — 당시 테스트는 이 규칙으로
//     재구성한 배열의 **길이만** 봐서, en을 고치면 재구성 스냅샷도 같이 바뀌어 통과했다(동어반복).
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
