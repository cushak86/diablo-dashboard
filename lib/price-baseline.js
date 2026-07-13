// 시세 기준선(baseline) 데이터 — /prices 정적 참고 지표.
// ⚠ 비공식·참고용. 실시간 아님. 고룬(高rune) 단위 근사 범위.
// std = 스탠다드(비-래더, 통화 팽창로 대체로 저평가), ladder = 래더 시즌 초(수요·희소성으로 대체로 상승).
// 출처(as-of 2026-07): diablo2.io price-check(완료 거래 기반) 1차 앵커 · 커뮤니티 룬 밸류 리스트 2차.
// Data courtesy of diablo2.io. 값은 베이스·롤·시즌·수요에 따라 크게 변동하며 실제 거래를 보증하지 않는다.
// key: 룬워드는 price-catalog의 rwSlug(en)와 동일 → 선택 시 표시. 유니크/참·고룬은 price-catalog가 병합해 노출.

export const BASELINE = [
  // ─── 최상위 룬워드 (S) ───
  { key: "enigma", kr: "수수께끼", en: "Enigma", tier: "S", std: "≈3~5 Ber", ladder: "≈5~8 Ber", note: "텔레포트 갑옷. 베이스 방어·수요 따라 변동. 래더 초 급등." },
  { key: "infinity", kr: "무한", en: "Infinity", tier: "S", std: "≈4~5 Ber", ladder: "≈5~8 Ber", note: "Ber 2개 필요. 폴암 베이스·ED 높으면 상승." },
  { key: "grief", kr: "비탄", en: "Grief", tier: "S", std: "≈2~4 Ber", ladder: "≈4~7 Ber", note: "페이즈블레이드+고피해 롤이면 10 HR 이상까지." },
  { key: "call-to-arms", kr: "소집", en: "Call to Arms", tier: "A", std: "≈1~2 Ber", ladder: "≈2~4 Ber", note: "+전투명령(BO) 롤·베이스에 좌우. 버프 스왑 필수템." },
  { key: "faith", kr: "신념", en: "Faith", tier: "A", std: "≈2~4 Ber", ladder: "≈3~6 Ber", note: "매트리아크/그레이트 보우 베이스면 프리미엄." },
  { key: "fortitude", kr: "불굴", en: "Fortitude", tier: "A", std: "≈Lo (10~14 Ist)", ladder: "≈1~2 Ber", note: "에테리얼 아처 베이스면 프리미엄. 래더 초 인기." },
  { key: "heart-of-the-oak", kr: "오크의 심장", en: "Heart of the Oak", tier: "A", std: "≈Ohm~Lo (5~14 Ist)", ladder: "≈Lo~1.5 Ber", note: "플레일/지팡이 베이스. 캐스터 무기." },
  { key: "chains-of-honor", kr: "명예의 사슬", en: "Chains of Honor", tier: "A", std: "≈Um~Lo", ladder: "≈Lo~1 Ber", note: "저항·물감쇄 갑옷. 아처/두라 베이스면 상승." },

  // ─── 상위 룬워드 (B) ───
  { key: "phoenix", kr: "불사조", en: "Phoenix", tier: "B", std: "≈Vex~Ohm", ladder: "≈Ohm~1 Ber", note: "방패/무기. 화염흡수·구원 오라. 수요 제한적." },
  { key: "exile", kr: "추방", en: "Exile", tier: "B", std: "≈Vex~Ohm", ladder: "≈Ohm~Lo", note: "성기사 방패 전용. CoH 대체 오라 방패." },
  { key: "dream", kr: "꿈", en: "Dream", tier: "B", std: "≈Lo~1 Ber (2개 세트)", ladder: "≈1~2 Ber", note: "투구+방패 2개로 성충격 오라 중첩. 세트 기준." },
  { key: "last-wish", kr: "마지막 소원", en: "Last Wish", tier: "B", std: "≈Lo~1.5 Ber", ladder: "≈1~2 Ber", note: "6소켓·다수 고룬(Jah 3개). 위엄 오라." },
  { key: "pride", kr: "긍지", en: "Pride", tier: "B", std: "≈Um~Lo", ladder: "≈Lo~1 Ber", note: "집중 오라 용병 폴암. 콘크 오라 인기." },
  { key: "doom", kr: "파멸", en: "Doom", tier: "B", std: "≈Ohm~Lo", ladder: "≈Lo~1.5 Ber", note: "신성 빙결 오라. 냉기 감속 유틸." },
  { key: "beast", kr: "야수", en: "Beast", tier: "B", std: "≈Um~Lo", ladder: "≈Lo~1 Ber", note: "광폭화 오라. 소서/드루 변신·용병." },
  { key: "mist", kr: "안개", en: "Mist", tier: "B", std: "≈Lo~1 Ber", ladder: "≈1~1.5 Ber", note: "집중 오라 활. Cham 포함." },
  { key: "bramble", kr: "가시덤불", en: "Bramble", tier: "B", std: "≈Ohm~Lo", ladder: "≈Lo~1 Ber", note: "가시 오라·+독피해 갑옷. 독네크/드루." },
  { key: "insight", kr: "통찰", en: "Insight", tier: "B", std: "≈Ral~Um", ladder: "≈Pul~Um", note: "명상 오라 용병 폴암. 저비용 고수요 마나 유지템." },
  { key: "spirit", kr: "정신", en: "Spirit", tier: "B", std: "≈Ral~Um", ladder: "≈Thul~Ohm", note: "+2스킬·FCR 검/방패. 초반 국민 캐스터템, 저비용 고수요." },
  { key: "memory", kr: "기억", en: "Memory", tier: "B", std: "≈Thul~Um", ladder: "≈Um~Ohm", note: "+3 소서 지팡이. 에너지 방벽 캐스터." },

  // ─── 중위 룬워드 (C) ───
  { key: "death", kr: "죽음", en: "Death", tier: "C", std: "≈Um~Lo", ladder: "≈Lo~1 Ber", note: "치명타 근접. 수요 낮음." },
  { key: "breath-of-the-dying", kr: "죽어가는 자의 숨결", en: "Breath of the Dying", tier: "C", std: "≈Vex~Ohm", ladder: "≈Ohm~1 Ber", note: "Zod 포함 6소켓. 상급 만능 무기지만 수요 좁음." },
  { key: "fury", kr: "격노", en: "Fury", tier: "C", std: "≈Um~Mal", ladder: "≈Um~Lo", note: "근접 물리. 저비용 고피해." },
  { key: "hand-of-justice", kr: "정의의 손길", en: "Hand of Justice", tier: "C", std: "≈Um~Lo", ladder: "≈Ohm~Lo", note: "홀리파이어 오라 화염 근접. 수요 제한." },
  { key: "destruction", kr: "파괴", en: "Destruction", tier: "C", std: "≈Um~Lo", ladder: "≈Lo~1 Ber", note: "폴암/검 프록 다수. 니치." },
  { key: "oath", kr: "맹세", en: "Oath", tier: "C", std: "≈Ral~Thul", ladder: "≈Thul~Um", note: "파괴불가 근접. 저비용." },
  { key: "lawbringer", kr: "법 집행자", en: "Lawbringer", tier: "C", std: "≈Ral~Thul", ladder: "≈Thul~Um", note: "성역 오라·감속 프록. 저비용 유틸." },
  { key: "crescent-moon", kr: "초승달", en: "Crescent Moon", tier: "C", std: "≈Ral~Um", ladder: "≈Um~Ohm", note: "적 번개저항 감소. 소서/트랩 무기." },
  { key: "voice-of-reason", kr: "이성의 목소리", en: "Voice of Reason", tier: "C", std: "≈Thul~Um", ladder: "≈Um~Lo", note: "적 냉기저항 감소. 팔라/냉기 근접." },
  { key: "obedience", kr: "복종", en: "Obedience", tier: "C", std: "≈Ral~Thul", ladder: "≈Thul~Um", note: "가성비 용병 폴암. 저항·강타." },
  { key: "duress", kr: "압박", en: "Duress", tier: "C", std: "≈Ral~Thul", ladder: "≈Thul~Um", note: "강타·개막 갑옷. 저비용 근접." },
  { key: "treachery", kr: "배신", en: "Treachery", tier: "C", std: "≈Ral~Thul", ladder: "≈Thul~Ohm", note: "페이드 프록·IAS. 저비용 어쌔/용병." },
  { key: "kingslayer", kr: "왕 시해자", en: "Kingslayer", tier: "C", std: "≈Um~Mal", ladder: "≈Um~Mal", note: "강타·개막 검/도끼. 니치." },
  { key: "stone", kr: "돌", en: "Stone", tier: "C", std: "≈Ral~Thul", ladder: "≈Thul~Um", note: "탱킹 갑옷. 저비용." },
  { key: "lionheart", kr: "사자의 심장", en: "Lionheart", tier: "C", std: "≈Ral~Thul", ladder: "≈Thul~Um", note: "능력치·저항 초중반 갑옷. 저렴." },
  { key: "silence", kr: "침묵", en: "Silence", tier: "C", std: "≈Um~Lo", ladder: "≈Lo~1 Ber", note: "전 저항+75·+2스킬 6소켓. 니치." },
  { key: "harmony", kr: "조화", en: "Harmony", tier: "C", std: "≈Ral~Um", ladder: "≈Um~Ohm", note: "활력 오라 활. 이동 유틸." },
  { key: "delirium", kr: "착란", en: "Delirium", tier: "C", std: "≈Um~Lo", ladder: "≈Ohm~Lo", note: "+2스킬 MF 투구. 착란 변신 프록 주의." },
  { key: "wealth", kr: "부", en: "Wealth", tier: "C", std: "≈Thul~Ko", ladder: "≈Ko~Um", note: "MF·골드 파밍 갑옷. 저비용." },

  // ─── 저가/유틸 룬워드 (D) ───
  { key: "passion", kr: "열정", en: "Passion", tier: "D", std: "≈El~Ral", ladder: "≈Ral~Thul", note: "저가 근접. 광전사 차지." },
  { key: "wind", kr: "바람", en: "Wind", tier: "D", std: "≈Um~Mal", ladder: "≈Um~Mal", note: "속도·감속 근접. 니치." },
  { key: "eternity", kr: "영원", en: "Eternity", tier: "D", std: "≈Um~Lo", ladder: "≈Ohm~Lo", note: "부활·강타 근접. 저수요." },
  { key: "wisdom", kr: "지혜", en: "Wisdom", tier: "D", std: "≈Ral~Thul", ladder: "≈Thul~Um", note: "명중무시 투구. 캐스터/펀치." },
  { key: "splendor", kr: "광채", en: "Splendor", tier: "D", std: "≈Ral~Thul", ladder: "≈Thul~Ko", note: "+1스킬·FCR 방패. 가성비." },
  { key: "rhyme", kr: "운율", en: "Rhyme", tier: "D", std: "≈Ral~Thul", ladder: "≈Thul~Ko", note: "얼지않음·MF 방패. 저렴." },
  { key: "ancient-s-pledge", kr: "고대인의 맹세", en: "Ancient's Pledge", tier: "D", std: "≈El~Ral", ladder: "≈Ral~Thul", note: "초반 저항 방패. 매우 저렴." },
  { key: "stealth", kr: "은신", en: "Stealth", tier: "D", std: "≈El~Ith", ladder: "≈Ral~Thul", note: "초반 국민 갑옷. 매우 저렴." },
  { key: "lore", kr: "학식", en: "Lore", tier: "D", std: "≈El~Ral", ladder: "≈Ral~Thul", note: "+1스킬 초반 투구. 매우 저렴." },

  // ─── 유명 유니크/참 (자체 key · price-catalog가 병합해 노출) ───
  { key: "stone-of-jordan", kr: "조던의 돌 (SoJ)", en: "Stone of Jordan", tier: "A", std: "≈Lo (10~15 Ist)", ladder: "≈Ohm~Lo", note: "우버 디아블로(클론) 소환 재료 수요로 변동 큼." },
  { key: "annihilus", kr: "안니힐러스", en: "Annihilus", tier: "S", std: "≈1~2 Ber (완옵 10 HR↑)", ladder: "≈2~4 Ber", note: "소형 부적. 전 스킬·능력치·저항. 완벽 롤 급등." },
  { key: "hellfire-torch", kr: "헬파이어 토치", en: "Hellfire Torch", tier: "S", std: "≈Ist~2 Ber (클래스·롤 따라)", ladder: "≈1~3 Ber", note: "성기사 토치가 최고가(≈12 HR). 소서/드루가 다음." },
  { key: "gheeds-fortune", kr: "기드의 행운", en: "Gheed's Fortune", tier: "B", std: "≈1~5 Ist", ladder: "≈Pul~2 Ist", note: "MF·상인가·골드 대형 부적. MF 40 근접이면 상승. (카탈로그 '기드의 내기' 벨트와 다른 아이템)" },
  { key: "maras-kaleidoscope", kr: "마라의 만화경", en: "Mara's Kaleidoscope", tier: "B", std: "≈2~6 Ist", ladder: "≈Um~Ohm", note: "+2 전 스킬·전 저항 목걸이. 저항 롤 높으면 상승." },
  { key: "harlequin-crest", kr: "샤코 (어릿광대의 문장)", en: "Harlequin Crest Shako", tier: "B", std: "≈Pul~Mal", ladder: "≈Um~Ohm", note: "+2스킬·MF·물감쇄 투구. 캐스터 국민템." },

  // ─── 고룬 (자체 key · Ist 환산 기준 · price-catalog가 병합해 노출) ───
  { key: "ber", kr: "베르 룬", en: "Ber Rune", tier: "HR", std: "≈32~35 Ist (기준 통화)", ladder: "≈25~30 Ist", note: "수수께끼·무한 재료. 래더 초엔 Ist 대비 환율 낮게 잡힘." },
  { key: "jah", kr: "자 룬", en: "Jah Rune", tier: "HR", std: "≈30~40 Ist", ladder: "≈23~28 Ist", note: "비-래더선 수수께끼 수요로 Ber와 비슷~약간 높음. 래더 초엔 Ber보다 저평가." },
  { key: "sur", kr: "수르 룬", en: "Sur Rune", tier: "HR", std: "≈15~17 Ist", ladder: "≈13~15 Ist", note: "2 Sur + 완벽 자수정 = 1 Ber(큐브) → 값은 대략 Ber 절반." },
  { key: "lo", kr: "로 룬", en: "Lo Rune", tier: "HR", std: "≈13~15 Ist", ladder: "≈10~12 Ist", note: "불굴·포보스 등. 치명타 룬워드 재료." },
  { key: "ohm", kr: "옴 룬", en: "Ohm Rune", tier: "HR", std: "≈6~8 Ist", ladder: "≈5~7 Ist", note: "피해증가 룬워드 다수. 중상위 통화." },
  { key: "vex", kr: "벡스 룬", en: "Vex Rune", tier: "HR", std: "≈3~4 Ist", ladder: "≈2.5~3 Ist", note: "HotO·불사조 등. 하위 고룬 통화." },
  { key: "cham", kr: "샴 룬", en: "Cham Rune", tier: "HR", std: "≈4 Ist", ladder: "≈3~4 Ist", note: "얼지않음. 안개·역병 재료. 수요 특수." },
  { key: "zod", kr: "조드 룬", en: "Zod Rune", tier: "HR", std: "≈8 Ist", ladder: "≈6~8 Ist", note: "파괴불가. 최고 번호지만 수요 낮아 Ber보다 저가." },
];

const BASELINE_MAP = new Map(BASELINE.map((b) => [b.key, b]));

export function getBaseline(key) {
  return BASELINE_MAP.get(key) || null;
}
