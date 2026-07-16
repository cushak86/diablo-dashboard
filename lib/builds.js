// 빌드 가이드 데이터(순수 배열 + 순수 헬퍼). 외부 의존 0.
// runewords 페이지처럼 route(page) 모듈이 아닌 lib에서 export.
//
// ── 스키마(실데이터 기준 · 2026-07-16 통합) ──────────────────────────────
// {
//   id,            // 고유 슬러그(영문 소문자·하이픈)
//   class,         // 직업 한국어 표기(예: 소서리스)
//   name,          // 빌드명
//   tags: [],      // 분류 태그
//   skills: [{ name, priority, note }],  // priority는 라벨 문자열(예 "1·max"). 렌더는 등장 순서.
//   stats,         // 스탯 분배 방향 — 한 줄 문자열("힘: … / 민첩: … / 활력: … / 에너지: …")
//   keyRunewords: [runewordEn],          // lib/runewords.js의 en 값(= 키). /runewords로 링크.
//   breakpointGoal: { fcr, fhr },        // FCR은 물리빌드면 null(무관). 숫자 또는 문자열.
//   mercenary,     // 용병 세팅 한 줄
//   note,          // 운영 메모(수치 상충·단일출처 병기)
//   sources: [url],// 출처 URL(최소 2소스 교차검증 원칙)
//   verify,        // (선택) "검증중" 배지. 값 있으면 UI가 배지 표시(악마술사=신규클래스 미검증).
// }

export const BUILDS = [

  // ─── 1. 아마존 · 자바존 ───
  {
    id: "ama-javazon",
    class: "아마존",
    name: "자바존 (번개 분노)",
    tags: ["라이트닝", "광역", "티어1"],
    skills: [
      { name: "번개 분노(Lightning Fury)", priority: "1·max", note: "광역 클리어 핵심 — 투창에 번개 부여" },
      { name: "충전 타격(Charged Strike)", priority: "2·max", note: "보스/단일 대상 딜" },
      { name: "번개 타격(Lightning Strike)", priority: "3·max(시너지)", note: "충전 타격 시너지" },
      { name: "강력한 타격(Power Strike)", priority: "4·max(시너지)", note: "Maxroll은 max 권장" },
      { name: "발키리(Valkyrie)", priority: "1pt(총스킬 17+)", note: "탱커 소환 — +스킬로 레벨 확보" },
      { name: "꿰뚫기(Pierce)", priority: "1pt", note: "관통 — Razortail 등으로 100% 목표" },
    ],
    stats: "힘: 장비 착용 최소 / 민첩: 차단·장비 요구분(차단빌드는 75%까지) / 활력: 나머지 전부 / 에너지: 0",
    keyRunewords: ["Enigma", "Infinity", "Spirit", "Call to Arms"],
    breakpointGoal: { fcr: 68, fhr: 86 },
    mercenary: "2막(악몽) 힘(Might) 또는 홀리 프리즈 + Infinity(전도 오라로 번개 면역 해제)",
    note: "라이트닝 면역 대응이 최대 관건 → 용병 Infinity 또는 선더참(Sunder) 필수급. FHR 상충: Maxroll 최소 32% / Icy-Veins 86%(4프레임). FCR 68%는 텔포 이동용(단일출처지만 9프레임 브레이크포인트는 일관). 무기는 유니크 투창(타이탄의 복수 등)이라 룬워드 없음.",
    sources: [
      "https://maxroll.gg/d2/guides/lightning-fury-amazon-guide",
      "https://www.icy-veins.com/d2/lightning-fury-charged-strike-amazon-javazon-build",
    ],
  },

  // ─── 2. 아마존 · 보우존 ───
  {
    id: "ama-bowazon",
    class: "아마존",
    name: "보우존 (다중 사격/무차별 사격)",
    tags: ["물리", "활", "근성"],
    skills: [
      { name: "무차별 사격(Strafe)", priority: "1·max", note: "다중 타격 — 단일/군집 겸용 (변형: 다중 사격 우선)" },
      { name: "유도 화살(Guided Arrow)", priority: "2·max", note: "보스·도망몹 확정타" },
      { name: "다중 사격(Multiple Shot)", priority: "3·max", note: "광역 클리어" },
      { name: "치명적 일격(Critical Strike)", priority: "4·max(10~20)", note: "더블 데미지 확률" },
      { name: "관통(Penetrate)", priority: "5·잔여", note: "명중률 시너지" },
      { name: "꿰뚫기(Pierce)", priority: "1pt(~9pt)", note: "Razortail 병용 100% 관통 목표" },
    ],
    stats: "힘: 장비 착용 최소(~100) / 민첩: 활 요구치+데미지 위해 대부분(~150~300) / 활력: 나머지 / 에너지: 0",
    keyRunewords: ["Faith", "Fortitude", "Melody", "Call to Arms"],
    breakpointGoal: { fcr: null, fhr: 32 },
    mercenary: "2막 힘(Might) 표준 / 대안 축복의 조준·홀리 프리즈. 무기 Insight 또는 Reaper's Toll",
    note: "물리 보우존이라 FCR 무관. Faith 룬워드 활(광신 오라)이 최다 인용, 예산형은 Buriza/Melody. 100% 관통 확보가 클리어 속도 최대 레버. Melody는 예산 활 룬워드(+3 활/석궁 스킬).",
    sources: [
      "https://maxroll.gg/d2/guides/strafe-amazon",
      "https://www.icy-veins.com/d2/multiple-shot-guided-arrow-amazon-physical-bowazon-build",
    ],
  },

  // ─── 3. 어쌔신 · 트랩신 ───
  {
    id: "asn-trapsin",
    class: "어쌔신",
    name: "트랩신 (번개 파수병)",
    tags: ["라이트닝", "트랩", "티어1"],
    skills: [
      { name: "번개 파수병(Lightning Sentry)", priority: "1·max", note: "주력 트랩 (설치 비율 LS:DS≈4:1)" },
      { name: "충격의 거미줄(Shock Web)", priority: "2·max(시너지)", note: "번개 파수병 시너지" },
      { name: "전하 볼트 파수병(Charged Bolt Sentry)", priority: "3·max(시너지)", note: "시너지" },
      { name: "죽음의 파수병(Death Sentry)", priority: "4·max", note: "시체 폭발 연쇄 청소" },
      { name: "화염 폭발(Fire Blast)", priority: "5·잔여(시너지)", note: "" },
      { name: "쾌속(Burst of Speed)·소멸(Fade)·그림자 망토(Cloak of Shadows)·정신 폭발(Mind Blast)", priority: "1pt", note: "트랩 설치속도는 FCR 아닌 쾌속(IAS) 좌우" },
    ],
    stats: "힘: 장비 착용 최소(~150) / 민첩: 불필요(하드코어는 막기 75%용) / 활력: 나머지 / 에너지: 0",
    keyRunewords: ["Enigma", "Infinity", "Spirit", "Call to Arms"],
    breakpointGoal: { fcr: 102, fhr: 86 },
    mercenary: "2막 홀리 프리즈 + Infinity(전도로 번개 면역 해제)",
    note: "-x% 적 번개저항이 트랩에 적용 → Griffon's Eye + Rainbow Facet 다수 채용, 용병 Infinity로 후반 폭증. FHR 상충: Maxroll 48% / Icy-Veins 86%. FCR 102%는 Maxroll 단일 명시.",
    sources: [
      "https://maxroll.gg/d2/guides/lightning-sentry-assassin",
      "https://www.icy-veins.com/d2/lightning-death-sentry-assassin-trapsin-build",
    ],
  },

  // ─── 4. 어쌔신 · 무술(불사조 강타/모자이크) ───
  {
    id: "asn-martial-arts",
    class: "어쌔신",
    name: "무술 (불사조 강타/모자이크)",
    tags: ["물리", "근접", "콤보"],
    skills: [
      { name: "불사조 강타(Phoenix Strike)", priority: "1·max", note: "3차지 마무리기 — 전원소" },
      { name: "천둥 발톱(Claws of Thunder)", priority: "2·max(차지업)", note: "차지 축적" },
      { name: "얼음 칼날(Blades of Ice)", priority: "3·max(차지업)", note: "차지 축적" },
      { name: "호랑이 강타(Tiger Strike) 또는 화염 주먹(Fists of Fire)", priority: "4·max(차지업)", note: "물리 배수/화염" },
      { name: "용의 발톱(Dragon Talon)", priority: "5", note: "차지 방출용 발차기 (순수 킥신 변형은 이걸 1순위 max)" },
      { name: "소멸(Fade)·무기 막기(Weapon Block)·그림자 망토·정신 폭발", priority: "1pt", note: "생존·유틸" },
    ],
    stats: "힘: 클로 등 장비 착용 최소 / 민첩: 장비분(순수 킥신은 무기막기 75%) / 활력: 나머지 / 에너지: 0",
    keyRunewords: ["Mosaic", "Enigma", "Fortitude"],
    breakpointGoal: { fcr: null, fhr: 86 },
    mercenary: "2막 힘(Might) 또는 홀리 프리즈 / 불사조 강타 변형은 힘 + Infinity",
    note: "Mosaic 듀얼 클로가 핵심 — 마무리기로 타격 시 차지 소모 없이 전원소 100% 상시 유지. IAS 기반이라 FCR은 텔포 스왑용(~105%)만. FHR 상충: Maxroll 48% / Icy-Veins 86%. 방어는 Shako + String of Ears(물리피해감소).",
    sources: [
      "https://maxroll.gg/d2/guides/phoenix-strike-assassin",
      "https://www.icy-veins.com/d2/mosaic-phoenix-strike-assassin-build",
    ],
  },

  // ─── 5. 바바리안 · 소용돌이(WW) ───
  {
    id: "bar-whirlwind",
    class: "바바리안",
    name: "소용돌이 (WW)",
    tags: ["물리", "근접", "티어1"],
    skills: [
      { name: "소용돌이(Whirlwind)", priority: "1·max", note: "주력 이동타격" },
      { name: "무기 숙련(Weapon Mastery)", priority: "2·max", note: "쓰는 무기 계열(검/도끼 등) 맞춤" },
      { name: "전투 지시(Battle Orders)", priority: "3·max", note: "생명/마나 대폭 증가 — 필수" },
      { name: "광폭화(Berserk)", priority: "4", note: "물리 면역 몹 처리(마법 데미지)" },
      { name: "전투 명령(Battle Command)·함성(Shout)·자연 저항(Natural Resistance)·물건 찾기(Find Item)", priority: "1pt", note: "버프·유틸" },
    ],
    stats: "힘: 장비 요구치(~150) / 민첩: 장비 요구치 / 활력: 나머지 / 에너지: 0",
    keyRunewords: ["Grief", "Beast", "Fortitude", "Lawbringer"],
    breakpointGoal: { fcr: null, fhr: 27 },
    mercenary: "2막(악몽) 힘(Might). 무기 Reaper's Toll(노쇠로 물리면역 해제) 또는 Insight, 갑옷 Fortitude",
    note: "IAS 이득 미미, 회복은 FHR 27%만 신경. 물리면역은 용병 노쇠 또는 광폭화(마법)로 처리. 듀얼 웨폰(Grief+Beast/Oath 조합)이 표준. Enigma 텔포 사용 시 Maxroll은 스왑 63% FCR 권장(상충).",
    sources: [
      "https://maxroll.gg/d2/guides/whirlwind-barbarian-guide",
      "https://www.icy-veins.com/d2/whirlwind-barbarian-build",
    ],
  },

  // ─── 6. 바바리안 · 광란(Frenzy) ───
  {
    id: "bar-frenzy",
    class: "바바리안",
    name: "광란 (Frenzy)",
    tags: ["물리", "근접", "듀얼웨폰"],
    skills: [
      { name: "광란(Frenzy)", priority: "1·max", note: "연타로 이동/공격 속도 버프 유지" },
      { name: "이중 휘두르기(Double Swing)", priority: "2·max(시너지)", note: "광란 시너지" },
      { name: "무기 숙련(Weapon Mastery)", priority: "3·max", note: "쓰는 무기 계열 맞춤" },
      { name: "전투 지시(Battle Orders)", priority: "4·max", note: "필수 생존" },
      { name: "광폭화(Berserk)", priority: "5·max", note: "Maxroll은 max 권장(물리면역 대응)" },
      { name: "속도 증가(Increased Speed)·자연 저항·전투 명령", priority: "1pt", note: "유틸" },
    ],
    stats: "힘: 장비 요구치 / 민첩: 장비 요구치 / 활력: 나머지 / 에너지: 0",
    keyRunewords: ["Grief", "Oath", "Fortitude", "Lawbringer"],
    breakpointGoal: { fcr: null, fhr: 27 },
    mercenary: "2막 힘(Might) / 대안 홀리 프리즈",
    note: "듀얼 웨폰 필수(Grief + Oath/Lawbringer). 주무기 FCR n/a, 텔포 스왑무기만 63%(Maxroll 단일). WW보다 기동성↑, 단일 대상 폭딜.",
    sources: [
      "https://maxroll.gg/d2/guides/frenzy-barbarian",
      "https://www.icy-veins.com/d2/frenzy-barbarian-build",
    ],
  },

  // ─── 7. 드루이드 · 윈드 드루이드 ───
  {
    id: "dru-wind",
    class: "드루이드",
    name: "윈드 드루이드 (회오리)",
    tags: ["물리+냉기", "광역", "티어1"],
    skills: [
      { name: "회오리(Tornado)", priority: "1·max", note: "주력 물리 딜" },
      { name: "폭풍(Hurricane)", priority: "2·max", note: "보조 냉기 딜(지속)" },
      { name: "회오리 갑옷(Cyclone Armor)", priority: "3·max", note: "원소 피해 흡수 + 시너지" },
      { name: "소용돌이(Twister)", priority: "4·max(시너지)", note: "회오리 시너지" },
      { name: "참나무 정령(Oak Sage)", priority: "1pt", note: "생명 증가 정령" },
      { name: "회색곰(Grizzly)·정령 늑대", priority: "1pt", note: "탱커 소환(선행 필요)" },
    ],
    stats: "힘: 장비 착용 최소 / 민첩: 장비 착용 최소 / 활력: 나머지 전부 / 에너지: 0",
    keyRunewords: ["Enigma", "Heart of the Oak", "Spirit", "Infinity", "Call to Arms"],
    breakpointGoal: { fcr: 99, fhr: 63 },
    mercenary: "2막(악몽) 힘(Might) + Reaper's Toll(노쇠로 물리면역 관통) / 대안 홀리 프리즈·Insight",
    note: "회오리(물리)+폭풍(냉기) 동시 딜로 단일 원소 면역 대응 용이. FCR 99%(스타터)/163%(엔드 9프레임). FHR 상충: Maxroll 최소 42% / Icy-Veins 63~99% — 실사용 공통대 60%+. Enigma 텔포가 엔드 핵심.",
    sources: [
      "https://maxroll.gg/d2/guides/tornado-hurricane-druid",
      "https://www.icy-veins.com/d2/wind-druid-build",
    ],
  },

  // ─── 8. 네크로맨서 · 소환사(Fishymancer) ───
  {
    id: "nec-summoner",
    class: "네크로맨서",
    name: "소환사 (Fishymancer)",
    tags: ["소환", "물리", "초보추천"],
    skills: [
      { name: "해골 되살리기(Raise Skeleton)", priority: "1·max", note: "군단 코어" },
      { name: "해골 숙련(Skeleton Mastery)", priority: "2·max", note: "소환수 능력치" },
      { name: "시체 폭발(Corpse Explosion)", priority: "3·max", note: "실질 광역 딜 — 피해증폭 연계 청소" },
      { name: "피해 증폭(Amplify Damage)", priority: "1pt", note: "저주 — 시체 폭발 연쇄 유발" },
      { name: "골렘 숙련·소환수 저항(Summon Resist)·노쇠·되살리기(Revive)", priority: "1pt", note: "생존·유틸" },
    ],
    stats: "힘: 장비 착용 최소 / 민첩: 장비 요구치만 / 활력: 나머지 / 에너지: 0",
    keyRunewords: ["Enigma", "Spirit", "Call to Arms", "Insight"],
    breakpointGoal: { fcr: 75, fhr: 86 },
    mercenary: "2막 힘(Might) — 냉기 아우라 회피로 시체 보존(시체 폭발용). 무기 Insight 또는 Infinity",
    note: "피해증폭→시체 폭발 연쇄로 화면 청소. 스켈+골렘+되살리기로 생존력 최상이라 초보/하드코어 추천. FCR 상충: Maxroll 125%(엔드) / Icy-Veins 75%(실용) — 예산형 75% 채택. 용병에 냉기(홀리 프리즈)를 피해야 시체가 얼지 않고 남음.",
    sources: [
      "https://maxroll.gg/d2/guides/summoner-necromancer-guide",
      "https://www.icy-veins.com/d2/summoner-necromancer-build",
    ],
  },

  // ─── 9. 네크로맨서 · 본 네크로 ───
  {
    id: "nec-bone",
    class: "네크로맨서",
    name: "본 네크로 (뼈 창)",
    tags: ["마법", "광역", "관통"],
    skills: [
      { name: "뼈 창(Bone Spear)", priority: "1·max", note: "주력 광역 관통 딜" },
      { name: "뼈 정령(Bone Spirit)", priority: "2·max", note: "단일 추적 딜(변형은 이걸 우선)" },
      { name: "뼈 감옥(Bone Prison)", priority: "3·max(시너지)", note: "시너지" },
      { name: "뼈 방벽(Bone Wall)", priority: "4·max(시너지)", note: "시너지 + 방어" },
      { name: "이빨(Teeth)", priority: "5·max(시너지)", note: "시너지" },
      { name: "진흙 골렘·노쇠·시체 폭발·피해 증폭", priority: "1pt", note: "유틸" },
    ],
    stats: "힘: 장비 착용 최소(~150 부근) / 민첩: 장비 요구치만 / 활력: 나머지 / 에너지: 0",
    keyRunewords: ["Enigma", "Spirit", "White", "Insight"],
    breakpointGoal: { fcr: 125, fhr: 86 },
    mercenary: "2막(악몽) 홀리 프리즈 / 대안 힘(Might). 무기 Insight(마나)",
    note: "마법 데미지라 원소 면역 무관·관통 우수. 뼈 계열 5스킬 전부 max(상호 시너지). 스킬 순서 상충: Maxroll 뼈 창 우선(광역) / Icy-Veins 뼈 정령 우선(단일) — max 집합은 동일. FCR 125%(9프레임): HotO+Arachnid Mesh 핵심. White는 예산 완드(+뼈창/뼈 스킬).",
    sources: [
      "https://maxroll.gg/d2/guides/bone-spear-necromancer",
      "https://www.icy-veins.com/d2/bone-necromancer-build",
    ],
  },

  // ─── 10. 팔라딘 · 해머딘 ───
  {
    id: "pal-hammerdin",
    class: "팔라딘",
    name: "해머딘 (축복의 망치)",
    tags: ["마법", "광역", "티어1"],
    skills: [
      { name: "축복의 망치(Blessed Hammer)", priority: "1·max", note: "주력 마법 딜(나선)" },
      { name: "활력(Vigor)", priority: "2·max(시너지)", note: "축복의 망치 시너지 + 이동속도" },
      { name: "집중(Concentration)", priority: "3·max", note: "핵심 오라 — 딜 증폭·방해 무시" },
      { name: "축복의 조준(Blessed Aim)", priority: "4·max(시너지)", note: "시너지" },
      { name: "신성한 방패(Holy Shield)", priority: "1pt", note: "방어·차단 (Icy-Veins는 5번째 max 권장 — 상충)" },
      { name: "정화(Cleansing)·구원(Redemption)", priority: "1pt", note: "저주 해제·마나/생명 회복" },
    ],
    stats: "힘: 장비 착용 최소 / 민첩: 신성한 방패 포함 차단 75%까지 / 활력: 나머지 / 에너지: 0",
    keyRunewords: ["Enigma", "Heart of the Oak", "Spirit", "Insight", "Call to Arms"],
    breakpointGoal: { fcr: 125, fhr: 86 },
    mercenary: "2막(악몽) 홀리 프리즈 + Insight(명상 오라 — 마나 무한)",
    note: "구원 오라 + 용병 Insight로 마나 완전 해결 → 에너지 투자 금지. FCR 125%(9프레임)·FHR 86% 양 소스 합의. 저예산/Herald of Zakarum 방패 시 75% FCR. 5번째 max 스킬만 소스 이견(번개 저항 vs 신성한 방패).",
    sources: [
      "https://maxroll.gg/d2/guides/blessed-hammer-paladin",
      "https://www.icy-veins.com/d2/blessed-hammer-paladin-hammerdin-build",
    ],
  },

  // ─── 11. 팔라딘 · 스마이터 ───
  {
    id: "pal-smiter",
    class: "팔라딘",
    name: "스마이터 (강타)",
    tags: ["물리", "보스킬러", "우버"],
    skills: [
      { name: "강타(Smite)", priority: "1·max", note: "방패 데미지 기반 확정타(명중 무관)" },
      { name: "신성한 방패(Holy Shield)", priority: "2·max", note: "방패 딜·차단 핵심" },
      { name: "광신(Fanaticism)", priority: "3·max", note: "공격속도·딜 오라" },
      { name: "정화(Cleansing)·활력(Vigor)·구제(Salvation)", priority: "1pt", note: "유틸·저항" },
    ],
    stats: "힘: 장비 착용 최소(~150) / 민첩: 차단 75%까지(~150) / 활력: 나머지 / 에너지: 0",
    keyRunewords: ["Grief", "Exile", "Fortitude", "Call to Arms"],
    breakpointGoal: { fcr: null, fhr: 48 },
    mercenary: "2막(악몽) 힘(Might). 무기 Reaper's Toll(노쇠)",
    note: "우버 트리스트람/디아블로 클론 전용 킬러. 강타는 IAS 기반이라 FCR 불필요(텔포 유틸용만). 블록·딜이 방패 의존 → Exile(성기사 방패) + 신성한 방패 필수. FHR 최소 48%(Maxroll) / Icy-Veins 27%→6프레임.",
    sources: [
      "https://maxroll.gg/d2/guides/smite-paladin",
      "https://www.icy-veins.com/d2/smiter-paladin-build",
    ],
  },

  // ─── 12. 소서리스 · 블리자드 ───
  {
    id: "sor-blizzard",
    class: "소서리스",
    name: "블리자드 소서 (눈보라)",
    tags: ["냉기", "광역", "래더스타터"],
    skills: [
      { name: "눈보라(Blizzard)", priority: "1·max", note: "주력 냉기 광역 딜" },
      { name: "빙하의 가시(Glacial Spike)", priority: "2·max(시너지)", note: "시너지 + 군집 빙결" },
      { name: "얼음 작렬(Ice Blast)", priority: "3·max(시너지)", note: "시너지" },
      { name: "얼음 화살(Ice Bolt)", priority: "4·max(시너지)", note: "시너지" },
      { name: "냉기 숙련(Cold Mastery)", priority: "5·max(관통 100%까지)", note: "+스킬 감안 관통 상한 지점까지만" },
      { name: "정전기장(Static Field)·순간이동(Teleport)·냉기 갑옷", priority: "1pt", note: "유틸" },
    ],
    stats: "힘: 장비 착용 최소 / 민첩: 장비 최소(대개 불필요) / 활력: 나머지 / 에너지: 0",
    keyRunewords: ["Enigma", "Spirit", "Insight", "Call to Arms", "Infinity"],
    breakpointGoal: { fcr: 105, fhr: 86 },
    mercenary: "2막(악몽) 힘(Might). 엔드는 Infinity(전도)로 냉기 면역 파괴, Insight 마나",
    note: "냉기 면역 몹 처리가 약점 → 용병 Infinity(전도) 또는 물리 보조. FCR 105%(8프레임) 양 소스 합의. FHR 상충: Maxroll 최소 60% / Icy-Veins 86%(6프레임). 래더 스타터 강력.",
    sources: [
      "https://maxroll.gg/d2/guides/blizzard-sorceress",
      "https://www.icy-veins.com/d2/blizzard-sorceress-build",
    ],
  },

  // ─── 13. 소서리스 · 파이어볼/메테오 ───
  {
    id: "sor-fireball",
    class: "소서리스",
    name: "파이어볼/메테오 소서",
    tags: ["화염", "광역", "래더스타터"],
    skills: [
      { name: "화염구(Fire Ball)", priority: "1·max", note: "단일·연사 주력" },
      { name: "유성(Meteor)", priority: "2·max", note: "광역 낙하 딜" },
      { name: "화염 화살(Fire Bolt)", priority: "3·max(시너지)", note: "두 스킬 공유 시너지" },
      { name: "화염 숙련(Fire Mastery)", priority: "4·max", note: "화염 딜 증폭" },
      { name: "온기(Warmth)·정전기장·순간이동", priority: "1pt", note: "유틸" },
    ],
    stats: "힘: 장비 착용 최소 / 민첩: 장비 최소 / 활력: 나머지 / 에너지: 0",
    keyRunewords: ["Enigma", "Spirit", "Heart of the Oak", "Insight", "Infinity"],
    breakpointGoal: { fcr: 105, fhr: 86 },
    mercenary: "2막(악몽) 힘(Might). 엔드 Infinity. 정전기장 보조",
    note: "유성(광역)+화염구(단일)가 시너지 완전 공유 → 래더 스타터 강력. FCR 상충: Maxroll 엔드 105% / Icy-Veins 37% 표기 — 널리 인용되는 엔드타깃 105% 채택. FHR 상충: Maxroll 60% / Icy-Veins 86%. 화염 면역은 정전기장·Might·Infinity로 처리.",
    sources: [
      "https://maxroll.gg/d2/guides/meteor-sorceress",
      "https://www.icy-veins.com/d2/fireball-sorceress-build",
    ],
  },

  // ─── 14. 악마술사(Warlock) · 신규 클래스 — ⚠️ 검증중 ───
  {
    id: "war-warlock-phase1",
    class: "악마술사",
    name: "악마술사 대표 빌드 (검증중)",
    tags: ["신규", "검증중"],
    verify: "검증중",
    skills: [
      // ⚠️ 신규 클래스라 외부 2소스 교차검증 불가. 스킬 배분·수치 미확정 → 날조 금지 원칙에 따라 비움.
    ],
    stats: "검증중 — 스탯 방향 미확정(외부 2소스 확보 실패)",
    keyRunewords: ["Authority", "Coven", "Void", "Vigilance"],
    breakpointGoal: { fcr: null, fhr: null },
    mercenary: "검증중 — 권장 용병 미확정",
    note: "⚠️ 악마술사는 이 프로젝트의 신규 클래스로, lib/runewords.js의 '악마술사의 군림' 세트(Authority/Coven/Void/Vigilance/Ritual/Mania/Hysteria)가 전용 룬워드다. 단, 그 룬워드들도 파일 주석에 '3.x 비공식 · 검증 필요'로 표기돼 있고, 스킬 트리·스탯·브레이크포인트를 뒷받침할 외부 신뢰 소스 2개를 확보하지 못했다. 날조 금지 규율에 따라 스킬·수치는 비우고 검증중 배지 처리. keyRunewords는 파일에 실재하는 id만 기입(구조상 안전). 개발팀은 이 카드를 '검증중' 배지로 렌더하고, 스킬/스탯 칸은 '데이터 확보 중'으로 표시 권장.",
    sources: [
      // 외부 2소스 미확보. 유일한 내부 근거: lib/runewords.js '악마술사의 군림' 세트(en: Authority/Coven/Void/Vigilance/Ritual/Mania/Hysteria) — 이 역시 '비공식·검증 필요' 표기.
    ],
  },

];


// ── 순수 헬퍼 ─────────────────────────────────────────────────────────
// 등장 순서를 보존한 직업 목록(중복 제거).
export function allClasses() {
  const seen = new Set();
  const out = [];
  for (const b of BUILDS) {
    if (!seen.has(b.class)) {
      seen.add(b.class);
      out.push(b.class);
    }
  }
  return out;
}

// 특정 직업의 빌드만(cls가 falsy/"all"이면 전체).
export function buildsByClass(cls) {
  if (!cls || cls === "all") return BUILDS.slice();
  return BUILDS.filter((b) => b.class === cls);
}
