// lib/item-search.js — 세 탭(/grail·/runewords·/new-items)이 공유하는 검색 엔진.
//
// 왜 이 테스트가 있나: 이 코드는 원래 세 파일에 **복사**돼 있었고, 복사본은 조용히 갈라졌다
// (2026-07-17 발견: `norm()` 이 /runewords 만 괄호를 안 지웠다). 한 곳으로 합쳤으니
// **여기서 동작을 고정한다** — 다음에 누가 고쳐도 세 탭이 함께 지켜진다.

import assert from "node:assert/strict";
import { norm, chosung, isChosungQuery, indexOf, matches } from "../lib/item-search.js";

let pass = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}

console.log("\n[item-search] 검색 엔진");

t("norm — 대소문자·아포스트로피·공백·하이픈·가운뎃점·괄호를 지운다", () => {
  assert.equal(norm("Ume's Lament"), "umeslament");
  assert.equal(norm("UMES LAMENT"), "umeslament");        // 아포스트로피 유무가 같아진다
  assert.equal(norm("샤코 (어릿광대의 문장)"), "샤코어릿광대의문장");
  assert.equal(norm("Bartuc's Cut-Throat"), "bartucscutthroat");
  assert.equal(norm("탈 · 툴 · 오르트"), "탈툴오르트");
  assert.equal(norm(null), "");                            // 빈 값 방어
});

t("chosung — 한글 음절만 뽑고 나머지는 버린다", () => {
  assert.equal(chosung("베르 룬"), "ㅂㄹㄹ");               // 3음절 — 공백은 버리되 '룬'의 ㄹ 은 남는다
  assert.equal(chosung("갉아먹는 자"), "ㄱㅇㅁㄴㅈ");
  assert.equal(chosung("Ber Rune"), "");                   // 영문은 초성이 없다
  assert.equal(chosung("수수께끼"), "ㅅㅅㄲㄲ");             // 4음절(3음절로 착각하기 쉽다)
  assert.equal(chosung("샤코 (어릿광대의 문장)"), "ㅅㅋㅇㄹㄱㄷㅇㅁㅈ"); // 괄호·공백은 버리고 음절 초성만
});

t("isChosungQuery — 초성만인 질의를 가려낸다", () => {
  assert.equal(isChosungQuery("ㅂㄹ"), true);
  assert.equal(isChosungQuery("ㅂ ㄹ"), true);              // 공백은 무시
  assert.equal(isChosungQuery("베르"), false);
  assert.equal(isChosungQuery("ber"), false);
  assert.equal(isChosungQuery(""), false);
});

// 실제 항목 모양으로 인덱스를 만들어 도달을 본다.
const 할리퀸 = indexOf({}, {
  kr: "할리퀸 관모",
  en: ["Harlequin Crest", "Harlequin Crest", "Shako"],     // 내부키·표시명·베이스영문
  aka: ["할리퀸 크레스트", "샤코"],                          // 옛 표기·베이스 한글
});
const 바르툭 = indexOf({}, {
  kr: "바르툭의 목 따개",
  en: ["Cutthroat1", "Bartuc's Cut-Throat", "Greater Talons"],
  aka: ["바르턱스의 촙촙", "그레이터 탤런"],
});

t("표시명으로 찾힌다", () => {
  assert.equal(matches(할리퀸, "할리퀸 관모"), true);
  assert.equal(matches(바르툭, "바르툭의 목 따개"), true);
});

t("옛 한글 표기로도 찾힌다 — 이름을 바꿔도 사용자는 옛 이름으로 검색한다", () => {
  assert.equal(matches(할리퀸, "할리퀸 크레스트"), true);
  assert.equal(matches(바르툭, "바르턱스의 촙촙"), true);
});

t("베이스 한글로 찾힌다 — '샤코'가 최다 검색어인데 안 잡히던 구멍", () => {
  assert.equal(matches(할리퀸, "샤코"), true);
});

t("영문 표시명·베이스 영문으로 찾힌다", () => {
  assert.equal(matches(할리퀸, "Harlequin"), true);
  assert.equal(matches(할리퀸, "Shako"), true);
  assert.equal(matches(바르툭, "Bartuc"), true);
});

t("게임 내부 식별자로도 찾힌다 — 화면엔 안 보이지만 색인은 한다", () => {
  assert.equal(matches(바르툭, "Cutthroat1"), true);
});

t("초성으로 찾힌다 — 표시명과 옛 표기 양쪽", () => {
  assert.equal(matches(할리퀸, "ㅎㄹㅋㄱㅁ"), true);        // 할리퀸 관모 (표시명)
  assert.equal(matches(바르툭, "ㅂㄹㅌ"), true);            // 바르툭의…  (표시명)
  // 옛 표기로만 닿는 초성: "할리퀸 크레스트" → ㅎㄹㅋ**ㅋㄹㅅㅌ**. 표시명("관모")엔 없다.
  assert.equal(matches(할리퀸, "ㅋㄹㅅㅌ"), true);
});

t("초성 질의는 초성으로만 비교한다 — 오탐 방지", () => {
  // "ㅂㄹ"이 영문·한글 본문에 부분일치로 걸리면 안 된다
  const 무관 = indexOf({}, { kr: "무한", en: ["Infinity"], aka: [] });
  assert.equal(matches(무관, "ㅂㄹ"), false);
});

t("빈 질의는 전부 통과 — 첫 화면이 비면 안 된다", () => {
  assert.equal(matches(할리퀸, ""), true);
  assert.equal(matches(할리퀸, "   "), true);
});

t("없는 것은 안 찾힌다", () => {
  assert.equal(matches(할리퀸, "베르"), false);
  assert.equal(matches(바르툭, "존재하지않는아이템"), false);
});

t("배열·누락 필드를 방어한다", () => {
  const 최소 = indexOf({}, { kr: "무한" });               // en·aka 없음
  assert.equal(matches(최소, "무한"), true);
  assert.equal(matches(최소, "없음"), false);
});

console.log(`\n[item-search] ${pass}개 통과\n`);

// ─────────────────────────────────────────────────────────────────────────────
// 탭 간 이름 정합 (2026-08-09 추가)
//
// 왜: 같은 룬워드 Hysteria 를 lib/runewords.js 는 "발작", lib/items.js 는 "히스테리아"로
// 부르고 있었다. 두 파일이 별도 정본이라 조용히 갈라진 것이다. 결과:
//   /runewords 에서 "발작" 2회 · "히스테리아" 0회 / /new-items 는 정반대.
// /new-items 는 "한글명·초성·영문명 모두 검색 가능"이라고 안내하는데 그 페이지 데이터에
// "발작"이 0회라 매칭될 수 없었다 — 한쪽 이름만 아는 사람은 그 탭에서 아이템을 못 찾는다.
//
// 이름을 하나로 합치는 것은 3.x 한글명이 확정된 뒤에 할 일이라(runewords.js 가 "비공식·검증 필요"로
// 표시 중), 지금은 **양쪽에서 둘 다 찾히는지**를 기계가 지킨다.
import { ITEMS } from "../lib/items.js";
import { RW } from "../lib/runewords.js";

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

t("탭 간 이름 정합 — 같은 en 을 두 파일이 다르게 부르면 서로의 이름으로도 검색돼야 한다", () => {
  const byEn = new Map(ITEMS.map((it) => [it.en, it]));
  const broken = [];

  for (const r of RW) {
    const it = byEn.get(r.en);
    if (!it) continue; // 한쪽에만 있는 항목은 갈라질 여지가 없다

    const rwNames = [r.kr, ...asList(r.aka)].map(norm);
    const itNames = [it.kr, ...asList(it.alias)].map(norm);

    // 상대 파일의 대표 이름으로 이 항목을 찾을 수 있어야 한다(양방향).
    const itIdx = indexOf(it, { kr: it.kr, en: it.en, aka: it.alias });
    const rwIdx = indexOf(r, { kr: r.kr, en: r.en, aka: r.aka, extra: r.runes.join("") });

    if (!matches(itIdx, r.kr)) broken.push(`${r.en}: items.js 에서 "${r.kr}"(runewords 표기)로 못 찾는다`);
    if (!matches(rwIdx, it.kr)) broken.push(`${r.en}: runewords.js 에서 "${it.kr}"(items 표기)로 못 찾는다`);

    void rwNames;
    void itNames;
  }

  assert.deepEqual(broken, [], `\n       ${broken.join("\n       ")}\n       고치는 법: 양쪽 alias/aka 에 상대 표기를 추가한다.`);
});
