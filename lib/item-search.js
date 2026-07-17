// 아이템 검색 공용 모듈 — `/grail`·`/runewords`·`/new-items` 가 함께 쓴다.
//
// 왜 뽑았나: 같은 코드가 세 파일에 복사돼 있어 **바꿀 때마다 세 번 고쳤다.**
//   2026-07-17 실측 — 룬워드 한글명 53건을 mdb 정본으로 바꾸자 5개 파일을 따로 손댔고,
//   옛 이름 검색 도달(`aka`)을 `/runewords`·`/grail` 두 곳에 각각 붙였다.
//   mdb 가 계속 갱신 중이라 이름은 또 바뀐다.
//
// 뽑으면서 발견한 것 — **세 벌이 이미 조용히 갈라져 있었다**:
//   `norm()` 이 `/runewords` 만 괄호 `()` 를 안 지웠다. 복사본은 시간이 지나면 어긋난다.
//   (통일해도 검색 결과는 안 바뀐다 — kr/en/aka 에 괄호를 쓰는 항목이 **0종**임을 확인하고 합쳤다.
//    `chosung`·`CHO` 는 세 벌이 완전히 동일했다.)

const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

/** 한글 초성 추출. 한글이 아닌 글자는 버린다("베르 룬" → "ㅂㄹ"). */
export function chosung(s) {
  let out = "";
  for (const ch of String(s || "")) {
    const c = ch.charCodeAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) out += CHO[Math.floor((c - 0xac00) / 588)];
  }
  return out;
}

/** 검색 비교용 정규화 — 대소문자·아포스트로피·하이픈·공백·가운뎃점·괄호를 지운다.
 *  "Ume's Lament" 와 "umes lament" 가 같아지고, "샤코 (어릿광대의 문장)" 를 "샤코어릿광대의문장" 으로 만든다. */
export function norm(s) {
  return String(s || "").toLowerCase().replace(/['’\-\s·()]/g, "");
}

/** 초성만으로 이뤄진 질의인가(ㅂㄹ). 초성 검색은 초성 인덱스로만 비교해야 오탐이 없다. */
export function isChosungQuery(raw) {
  const q = String(raw || "").replace(/\s/g, "");
  return q.length > 0 && /^[ㄱ-ㅎ]+$/.test(q);
}

/**
 * 검색 인덱스를 만든다. 각 탭이 자기 필드명을 넘긴다(파일마다 이름이 다르다 — items.js 는 `alias`, 나머지는 `aka`).
 * @param {object} x        원본 항목
 * @param {object} f        { kr, en, aka, extra } — 각 값은 문자열 또는 문자열 배열
 * @returns {{_kr,_en,_aka,_cho}} 정규화된 인덱스. 비교는 `matches()` 로 한다.
 */
export function indexOf(x, f = {}) {
  const join = (v) => (Array.isArray(v) ? v.filter(Boolean).join(" ") : v || "");
  const kr = join(f.kr);
  const aka = join(f.aka);
  return {
    _kr: norm(kr),
    _en: norm(join(f.en)),
    _aka: norm(aka),
    _extra: norm(join(f.extra)),
    // 초성은 표시명과 옛 표기 양쪽 — 사용자는 옛 이름의 초성으로도 찾는다
    _cho: chosung(kr.replace(/\s/g, "")) + " " + chosung(aka.replace(/\s/g, "")),
  };
}

/** 인덱스와 질의를 비교한다. 초성 질의면 초성만 본다. */
export function matches(idx, raw) {
  if (!raw) return true;
  if (isChosungQuery(raw)) return idx._cho.includes(String(raw).replace(/\s/g, ""));
  const nq = norm(raw);
  if (!nq) return true;
  return idx._kr.includes(nq) || idx._en.includes(nq) || idx._aka.includes(nq) || idx._extra.includes(nq);
}
