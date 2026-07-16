// 빌드 가이드 데이터(순수 배열 + 순수 헬퍼). 외부 의존 0.
// 표기 규율: 사용자 노출 텍스트는 공식 한국어. keyRunewords는 lib/runewords.js의 en 키(UI가 한국어명으로 조회).
// 스키마: { id, class, name, tags[], skills:[{name,priority,note}], stats(문자열), keyRunewords[en], breakpointGoal:{fcr,fhr}, mercenary, note, sources[url], verify? }
export const BUILDS = [
  {
    "id": "ama-javazon",
    "class": "아마존",
    "name": "자바존 (번개의 분노)",
    "tags": [
      "번개",
      "광역",
      "최상위 티어"
    ],
    "skills": [
      {
        "name": "번개의 분노",
        "priority": "1·max",
        "note": "광역 클리어 핵심 — 투창에 번개 부여"
      },
      {
        "name": "전류의 일격",
        "priority": "2·max",
        "note": "보스/단일 대상 딜"
      },
      {
        "name": "번개 타격",
        "priority": "3·max(시너지)",
        "note": "전류의 일격 시너지"
      },
      {
        "name": "강력한 타격",
        "priority": "4·max(시너지)",
        "note": "맥스롤은 최대 투자 권장"
      },
      {
        "name": "발키리",
        "priority": "1pt(총스킬 17+)",
        "note": "탱커 소환 — +스킬로 레벨 확보"
      },
      {
        "name": "꿰뚫기",
        "priority": "1pt",
        "note": "관통 — 면도칼 꼬리 등으로 100% 목표"
      }
    ],
    "stats": "힘: 장비 착용 최소 / 민첩: 차단·장비 요구분(차단빌드는 75%까지) / 활력: 나머지 전부 / 에너지: 0",
    "keyRunewords": [
      "Enigma",
      "Infinity",
      "Spirit",
      "Call to Arms"
    ],
    "breakpointGoal": {
      "fcr": 68,
      "fhr": 86
    },
    "mercenary": "2막(악몽) 힘 또는 신성한 결빙 + 무한(전도 오라로 번개 면역 해제)",
    "note": "번개 면역 대응이 최대 관건 → 용병 무한 또는 선더참 필수급. 타격 회복 상충: 맥스롤 최소 32% / 아이시베인즈 86%(4프레임). 시전 속도 68%는 텔포 이동용(단일출처지만 9프레임 브레이크포인트는 일관). 무기는 유니크 투창(타이탄의 복수 등)이라 룬워드 없음.",
    "sources": [
      "https://maxroll.gg/d2/guides/lightning-fury-amazon-guide",
      "https://www.icy-veins.com/d2/lightning-fury-charged-strike-amazon-javazon-build"
    ]
  },
  {
    "id": "ama-bowazon",
    "class": "아마존",
    "name": "보우존 (다중 사격/속사)",
    "tags": [
      "물리",
      "활",
      "근성"
    ],
    "skills": [
      {
        "name": "속사",
        "priority": "1·max",
        "note": "다중 타격 — 단일/군집 겸용 (변형: 다중 사격 우선)"
      },
      {
        "name": "유도 화살",
        "priority": "2·max",
        "note": "보스·도망몹 확정타"
      },
      {
        "name": "다중 사격",
        "priority": "3·max",
        "note": "광역 클리어"
      },
      {
        "name": "치명적 일격",
        "priority": "4·max(10~20)",
        "note": "더블 데미지 확률"
      },
      {
        "name": "관통",
        "priority": "5·잔여",
        "note": "명중률 시너지"
      },
      {
        "name": "꿰뚫기",
        "priority": "1pt(~9pt)",
        "note": "면도칼 꼬리 병용 100% 관통 목표"
      }
    ],
    "stats": "힘: 장비 착용 최소(~100) / 민첩: 활 요구치+데미지 위해 대부분(~150~300) / 활력: 나머지 / 에너지: 0",
    "keyRunewords": [
      "Faith",
      "Fortitude",
      "Melody",
      "Call to Arms"
    ],
    "breakpointGoal": {
      "fcr": null,
      "fhr": 32
    },
    "mercenary": "2막 힘 표준 / 대안 축복의 조준·신성한 결빙. 무기 통찰 또는 사신의 통행료",
    "note": "물리 보우존이라 시전 속도 무관. 신념 룬워드 활(광신 오라)이 최다 인용, 예산형은 부리자/선율. 100% 관통 확보가 클리어 속도의 최대 변수. 선율은 예산형 활 룬워드(+3 활/석궁 스킬).",
    "sources": [
      "https://maxroll.gg/d2/guides/strafe-amazon",
      "https://www.icy-veins.com/d2/multiple-shot-guided-arrow-amazon-physical-bowazon-build"
    ]
  },
  {
    "id": "asn-trapsin",
    "class": "어쌔신",
    "name": "트랩신 (번개 파수기)",
    "tags": [
      "번개",
      "트랩",
      "최상위 티어"
    ],
    "skills": [
      {
        "name": "번개 파수기",
        "priority": "1·max",
        "note": "주력 트랩 (설치 비율 번개:죽음 파수기≈4:1)"
      },
      {
        "name": "감전 그물",
        "priority": "2·max(시너지)",
        "note": "번개 파수기 시너지"
      },
      {
        "name": "번개 줄기 파수기",
        "priority": "3·max(시너지)",
        "note": "시너지"
      },
      {
        "name": "죽음 파수기",
        "priority": "4·max",
        "note": "시체 폭발 연쇄 청소"
      },
      {
        "name": "화염 폭발",
        "priority": "5·잔여(시너지)",
        "note": ""
      },
      {
        "name": "쾌속·소멸·그림자 망토·정신 폭발",
        "priority": "1pt",
        "note": "트랩 설치속도는 시전 속도 아닌 쾌속 좌우"
      }
    ],
    "stats": "힘: 장비 착용 최소(~150) / 민첩: 불필요(하드코어는 막기 75%용) / 활력: 나머지 / 에너지: 0",
    "keyRunewords": [
      "Enigma",
      "Infinity",
      "Spirit",
      "Call to Arms"
    ],
    "breakpointGoal": {
      "fcr": 102,
      "fhr": 86
    },
    "mercenary": "2막 신성한 결빙 + 무한(전도로 번개 면역 해제)",
    "note": "적 번개 저항 감소(-x%)가 트랩에 적용 → 그리폰의 눈 + 무지개 보석을 다수 채용, 용병 무한으로 후반 폭증. 타격 회복 상충: 맥스롤 48% / 아이시베인즈 86%. 시전 속도 102%는 맥스롤 단일 명시.",
    "sources": [
      "https://maxroll.gg/d2/guides/lightning-sentry-assassin",
      "https://www.icy-veins.com/d2/lightning-death-sentry-assassin-trapsin-build"
    ]
  },
  {
    "id": "asn-martial-arts",
    "class": "어쌔신",
    "name": "무술 (불사조 강타/모자이크)",
    "tags": [
      "물리",
      "근접",
      "콤보"
    ],
    "skills": [
      {
        "name": "불사조 강타",
        "priority": "1·max",
        "note": "3차지 마무리기 — 전원소"
      },
      {
        "name": "천둥 발톱",
        "priority": "2·max(차지업)",
        "note": "차지 축적"
      },
      {
        "name": "얼음 칼날",
        "priority": "3·max(차지업)",
        "note": "차지 축적"
      },
      {
        "name": "호랑이 강타 또는 화염 주먹",
        "priority": "4·max(차지업)",
        "note": "물리 배수/화염"
      },
      {
        "name": "용의 발톱",
        "priority": "5",
        "note": "차지 방출용 발차기 (순수 킥신 변형은 이걸 1순위 최대 투자)"
      },
      {
        "name": "소멸·무기 막기·그림자 망토·정신 폭발",
        "priority": "1pt",
        "note": "생존·유틸"
      }
    ],
    "stats": "힘: 클로 등 장비 착용 최소 / 민첩: 장비분(순수 킥신은 무기막기 75%) / 활력: 나머지 / 에너지: 0",
    "keyRunewords": [
      "Mosaic",
      "Enigma",
      "Fortitude"
    ],
    "breakpointGoal": {
      "fcr": null,
      "fhr": 86
    },
    "mercenary": "2막 힘 또는 신성한 결빙 / 불사조 강타 변형은 힘 + 무한",
    "note": "모자이크 듀얼 클로가 핵심 — 마무리기로 타격 시 차지 소모 없이 전원소 100% 상시 유지. 공격 속도 기반이라 시전 속도는 텔포 스왑용(~105%)만. 타격 회복 상충: 맥스롤 48% / 아이시베인즈 86%. 방어는 샤코 + 귀 목걸이(물리피해감소).",
    "sources": [
      "https://maxroll.gg/d2/guides/phoenix-strike-assassin",
      "https://www.icy-veins.com/d2/mosaic-phoenix-strike-assassin-build"
    ]
  },
  {
    "id": "bar-whirlwind",
    "class": "바바리안",
    "name": "소용돌이",
    "tags": [
      "물리",
      "근접",
      "최상위 티어"
    ],
    "skills": [
      {
        "name": "소용돌이",
        "priority": "1·max",
        "note": "주력 이동타격"
      },
      {
        "name": "무기 숙련",
        "priority": "2·max",
        "note": "쓰는 무기 계열(검/도끼 등) 맞춤"
      },
      {
        "name": "전투 지시",
        "priority": "3·max",
        "note": "생명/마나 대폭 증가 — 필수"
      },
      {
        "name": "광폭화",
        "priority": "4",
        "note": "물리 면역 몹 처리(마법 데미지)"
      },
      {
        "name": "전투 명령·외침·자연 저항·물건 찾기",
        "priority": "1pt",
        "note": "버프·유틸"
      }
    ],
    "stats": "힘: 장비 요구치(~150) / 민첩: 장비 요구치 / 활력: 나머지 / 에너지: 0",
    "keyRunewords": [
      "Grief",
      "Beast",
      "Fortitude",
      "Lawbringer"
    ],
    "breakpointGoal": {
      "fcr": null,
      "fhr": 27
    },
    "mercenary": "2막(악몽) 힘. 무기 사신의 통행료(노쇠로 물리면역 해제) 또는 통찰, 갑옷 불굴",
    "note": "공격 속도 이득 미미, 회복은 타격 회복 27%만 신경. 물리면역은 용병 노쇠 또는 광폭화(마법)로 처리. 쌍수(비탄+야수/맹세 조합)가 표준. 수수께끼 텔포 사용 시 맥스롤은 스왑 63% 시전 속도 권장(상충).",
    "sources": [
      "https://maxroll.gg/d2/guides/whirlwind-barbarian-guide",
      "https://www.icy-veins.com/d2/whirlwind-barbarian-build"
    ]
  },
  {
    "id": "bar-frenzy",
    "class": "바바리안",
    "name": "광란",
    "tags": [
      "물리",
      "근접",
      "쌍수"
    ],
    "skills": [
      {
        "name": "광란",
        "priority": "1·max",
        "note": "연타로 이동/공격 속도 버프 유지"
      },
      {
        "name": "이중 휘두르기",
        "priority": "2·max(시너지)",
        "note": "광란 시너지"
      },
      {
        "name": "무기 숙련",
        "priority": "3·max",
        "note": "쓰는 무기 계열 맞춤"
      },
      {
        "name": "전투 지시",
        "priority": "4·max",
        "note": "필수 생존"
      },
      {
        "name": "광폭화",
        "priority": "5·max",
        "note": "맥스롤은 최대 투자 권장(물리면역 대응)"
      },
      {
        "name": "속도 증가·자연 저항·전투 명령",
        "priority": "1pt",
        "note": "유틸"
      }
    ],
    "stats": "힘: 장비 요구치 / 민첩: 장비 요구치 / 활력: 나머지 / 에너지: 0",
    "keyRunewords": [
      "Grief",
      "Oath",
      "Fortitude",
      "Lawbringer"
    ],
    "breakpointGoal": {
      "fcr": null,
      "fhr": 27
    },
    "mercenary": "2막 힘 / 대안 신성한 결빙",
    "note": "쌍수 필수(비탄 + 맹세/법 집행자). 주무기 시전 속도는 해당 없음, 텔포 스왑무기만 63%(맥스롤 단일). 소용돌이보다 기동성↑, 단일 대상 폭딜.",
    "sources": [
      "https://maxroll.gg/d2/guides/frenzy-barbarian",
      "https://www.icy-veins.com/d2/frenzy-barbarian-build"
    ]
  },
  {
    "id": "dru-wind",
    "class": "드루이드",
    "name": "윈드 드루이드 (회오리바람)",
    "tags": [
      "물리+냉기",
      "광역",
      "최상위 티어"
    ],
    "skills": [
      {
        "name": "회오리바람",
        "priority": "1·max",
        "note": "주력 물리 딜"
      },
      {
        "name": "허리케인",
        "priority": "2·max",
        "note": "보조 냉기 딜(지속)"
      },
      {
        "name": "회오리 갑옷",
        "priority": "3·max",
        "note": "원소 피해 흡수 + 시너지"
      },
      {
        "name": "돌개바람",
        "priority": "4·max(시너지)",
        "note": "회오리바람 시너지"
      },
      {
        "name": "참나무 정령",
        "priority": "1pt",
        "note": "생명 증가 정령"
      },
      {
        "name": "회색곰·정령 늑대",
        "priority": "1pt",
        "note": "탱커 소환(선행 필요)"
      }
    ],
    "stats": "힘: 장비 착용 최소 / 민첩: 장비 착용 최소 / 활력: 나머지 전부 / 에너지: 0",
    "keyRunewords": [
      "Enigma",
      "Heart of the Oak",
      "Spirit",
      "Infinity",
      "Call to Arms"
    ],
    "breakpointGoal": {
      "fcr": 99,
      "fhr": 63
    },
    "mercenary": "2막(악몽) 힘 + 사신의 통행료(노쇠로 물리면역 관통) / 대안 신성한 결빙·통찰",
    "note": "회오리바람(물리)+허리케인(냉기) 동시 딜로 단일 원소 면역 대응 용이. 시전 속도 99%(스타터)/163%(엔드 9프레임). 타격 회복 상충: 맥스롤 최소 42% / 아이시베인즈 63~99% — 실사용 공통 구간 60%+. 수수께끼 텔포가 엔드 핵심.",
    "sources": [
      "https://maxroll.gg/d2/guides/tornado-hurricane-druid",
      "https://www.icy-veins.com/d2/wind-druid-build"
    ]
  },
  {
    "id": "nec-summoner",
    "class": "네크로맨서",
    "name": "소환사",
    "tags": [
      "소환",
      "물리",
      "초보추천"
    ],
    "skills": [
      {
        "name": "해골 되살리기",
        "priority": "1·max",
        "note": "군단 코어"
      },
      {
        "name": "해골 숙련",
        "priority": "2·max",
        "note": "소환수 능력치"
      },
      {
        "name": "시체 폭발",
        "priority": "3·max",
        "note": "실질 광역 딜 — 피해증폭 연계 청소"
      },
      {
        "name": "피해 증폭",
        "priority": "1pt",
        "note": "저주 — 시체 폭발 연쇄 유발"
      },
      {
        "name": "골렘 숙련·소환수 저항·노쇠·되살리기",
        "priority": "1pt",
        "note": "생존·유틸"
      }
    ],
    "stats": "힘: 장비 착용 최소 / 민첩: 장비 요구치만 / 활력: 나머지 / 에너지: 0",
    "keyRunewords": [
      "Enigma",
      "Spirit",
      "Call to Arms",
      "Insight"
    ],
    "breakpointGoal": {
      "fcr": 75,
      "fhr": 86
    },
    "mercenary": "2막 힘 — 냉기 오라 회피로 시체 보존(시체 폭발용). 무기 통찰 또는 무한",
    "note": "피해증폭→시체 폭발 연쇄로 화면 청소. 해골+골렘+되살리기로 생존력 최상이라 초보/하드코어 추천. 시전 속도 상충: 맥스롤 125%(엔드) / 아이시베인즈 75%(실용) — 예산형 75% 채택. 용병에 냉기(신성한 결빙)를 피해야 시체가 얼지 않고 남음.",
    "sources": [
      "https://maxroll.gg/d2/guides/summoner-necromancer-guide",
      "https://www.icy-veins.com/d2/summoner-necromancer-build"
    ]
  },
  {
    "id": "nec-bone",
    "class": "네크로맨서",
    "name": "본 네크로 (뼈 창)",
    "tags": [
      "마법",
      "광역",
      "관통"
    ],
    "skills": [
      {
        "name": "뼈 창",
        "priority": "1·max",
        "note": "주력 광역 관통 딜"
      },
      {
        "name": "뼈 정령",
        "priority": "2·max",
        "note": "단일 추적 딜(변형은 이걸 우선)"
      },
      {
        "name": "뼈 감옥",
        "priority": "3·max(시너지)",
        "note": "시너지"
      },
      {
        "name": "뼈 방벽",
        "priority": "4·max(시너지)",
        "note": "시너지 + 방어"
      },
      {
        "name": "이빨",
        "priority": "5·max(시너지)",
        "note": "시너지"
      },
      {
        "name": "진흙 골렘·노쇠·시체 폭발·피해 증폭",
        "priority": "1pt",
        "note": "유틸"
      }
    ],
    "stats": "힘: 장비 착용 최소(~150 부근) / 민첩: 장비 요구치만 / 활력: 나머지 / 에너지: 0",
    "keyRunewords": [
      "Enigma",
      "Spirit",
      "White",
      "Insight"
    ],
    "breakpointGoal": {
      "fcr": 125,
      "fhr": 86
    },
    "mercenary": "2막(악몽) 신성한 결빙 / 대안 힘. 무기 통찰(마나)",
    "note": "마법 데미지라 원소 면역 무관·관통 우수. 뼈 계열 5스킬 전부 최대 투자(상호 시너지). 스킬 순서 상충: 맥스롤 뼈 창 우선(광역) / 아이시베인즈 뼈 정령 우선(단일) — 최대 투자 집합은 동일. 시전 속도 125%(9프레임): 오크의 심장+거미줄 그물 핵심. 백색은 예산 완드(+뼈창/뼈 스킬).",
    "sources": [
      "https://maxroll.gg/d2/guides/bone-spear-necromancer",
      "https://www.icy-veins.com/d2/bone-necromancer-build"
    ]
  },
  {
    "id": "pal-hammerdin",
    "class": "팔라딘",
    "name": "해머딘 (축복의 망치)",
    "tags": [
      "마법",
      "광역",
      "최상위 티어"
    ],
    "skills": [
      {
        "name": "축복의 망치",
        "priority": "1·max",
        "note": "주력 마법 딜(나선)"
      },
      {
        "name": "활력",
        "priority": "2·max(시너지)",
        "note": "축복의 망치 시너지 + 이동속도"
      },
      {
        "name": "집중",
        "priority": "3·max",
        "note": "핵심 오라 — 딜 증폭·방해 무시"
      },
      {
        "name": "축복의 조준",
        "priority": "4·max(시너지)",
        "note": "시너지"
      },
      {
        "name": "신성한 방패",
        "priority": "1pt",
        "note": "방어·차단 (아이시베인즈는 5번째 최대 투자 권장 — 상충)"
      },
      {
        "name": "정화·구원",
        "priority": "1pt",
        "note": "저주 해제·마나/생명 회복"
      }
    ],
    "stats": "힘: 장비 착용 최소 / 민첩: 신성한 방패 포함 차단 75%까지 / 활력: 나머지 / 에너지: 0",
    "keyRunewords": [
      "Enigma",
      "Heart of the Oak",
      "Spirit",
      "Insight",
      "Call to Arms"
    ],
    "breakpointGoal": {
      "fcr": 125,
      "fhr": 86
    },
    "mercenary": "2막(악몽) 신성한 결빙 + 통찰(명상 오라 — 마나 무한)",
    "note": "구원 오라 + 용병 통찰로 마나 완전 해결 → 에너지 투자 금지. 시전 속도 125%(9프레임)·타격 회복 86% 양 소스 합의. 저예산/자카룸의 사도 방패 시 75% 시전 속도. 5번째 최대 투자 스킬만 소스 이견(번개 저항 대 신성한 방패).",
    "sources": [
      "https://maxroll.gg/d2/guides/blessed-hammer-paladin",
      "https://www.icy-veins.com/d2/blessed-hammer-paladin-hammerdin-build"
    ]
  },
  {
    "id": "pal-smiter",
    "class": "팔라딘",
    "name": "스마이터 (강타)",
    "tags": [
      "물리",
      "보스 처치",
      "우버"
    ],
    "skills": [
      {
        "name": "강타",
        "priority": "1·max",
        "note": "방패 데미지 기반 확정타(명중 무관)"
      },
      {
        "name": "신성한 방패",
        "priority": "2·max",
        "note": "방패 딜·차단 핵심"
      },
      {
        "name": "광신",
        "priority": "3·max",
        "note": "공격속도·딜 오라"
      },
      {
        "name": "정화·활력·구제",
        "priority": "1pt",
        "note": "유틸·저항"
      }
    ],
    "stats": "힘: 장비 착용 최소(~150) / 민첩: 차단 75%까지(~150) / 활력: 나머지 / 에너지: 0",
    "keyRunewords": [
      "Grief",
      "Exile",
      "Fortitude",
      "Call to Arms"
    ],
    "breakpointGoal": {
      "fcr": null,
      "fhr": 48
    },
    "mercenary": "2막(악몽) 힘. 무기 사신의 통행료(노쇠)",
    "note": "우버 트리스트람/디아블로 클론 전용 킬러. 강타는 공격 속도 기반이라 시전 속도 불필요(텔포 유틸용만). 블록·딜이 방패 의존 → 추방(성기사 방패) + 신성한 방패 필수. 타격 회복 최소 48% / 아이시베인즈 27%→6프레임.",
    "sources": [
      "https://maxroll.gg/d2/guides/smite-paladin",
      "https://www.icy-veins.com/d2/smiter-paladin-build"
    ]
  },
  {
    "id": "sor-blizzard",
    "class": "소서리스",
    "name": "블리자드 소서 (눈보라)",
    "tags": [
      "냉기",
      "광역",
      "시즌 초반"
    ],
    "skills": [
      {
        "name": "눈보라",
        "priority": "1·max",
        "note": "주력 냉기 광역 딜"
      },
      {
        "name": "빙하의 가시",
        "priority": "2·max(시너지)",
        "note": "시너지 + 군집 빙결"
      },
      {
        "name": "얼음 작렬",
        "priority": "3·max(시너지)",
        "note": "시너지"
      },
      {
        "name": "얼음 화살",
        "priority": "4·max(시너지)",
        "note": "시너지"
      },
      {
        "name": "냉기 숙련",
        "priority": "5·max(관통 100%까지)",
        "note": "+스킬 감안 관통 상한 지점까지만"
      },
      {
        "name": "정전기장·순간이동·냉기 갑옷",
        "priority": "1pt",
        "note": "유틸"
      }
    ],
    "stats": "힘: 장비 착용 최소 / 민첩: 장비 최소(대개 불필요) / 활력: 나머지 / 에너지: 0",
    "keyRunewords": [
      "Enigma",
      "Spirit",
      "Insight",
      "Call to Arms",
      "Infinity"
    ],
    "breakpointGoal": {
      "fcr": 105,
      "fhr": 86
    },
    "mercenary": "2막(악몽) 힘. 엔드는 무한(전도)으로 냉기 면역 파괴, 통찰 마나",
    "note": "냉기 면역 몹 처리가 약점 → 용병 무한(전도) 또는 물리 보조. 시전 속도 105%(8프레임) 양 소스 합의. 타격 회복 상충: 맥스롤 최소 60% / 아이시베인즈 86%(6프레임). 래더 스타터 강력.",
    "sources": [
      "https://maxroll.gg/d2/guides/blizzard-sorceress",
      "https://www.icy-veins.com/d2/blizzard-sorceress-build"
    ]
  },
  {
    "id": "sor-fireball",
    "class": "소서리스",
    "name": "파이어볼/메테오 소서",
    "tags": [
      "화염",
      "광역",
      "시즌 초반"
    ],
    "skills": [
      {
        "name": "화염구",
        "priority": "1·max",
        "note": "단일·연사 주력"
      },
      {
        "name": "유성",
        "priority": "2·max",
        "note": "광역 낙하 딜"
      },
      {
        "name": "화염 화살",
        "priority": "3·max(시너지)",
        "note": "두 스킬 공유 시너지"
      },
      {
        "name": "화염 숙련",
        "priority": "4·max",
        "note": "화염 딜 증폭"
      },
      {
        "name": "온기·정전기장·순간이동",
        "priority": "1pt",
        "note": "유틸"
      }
    ],
    "stats": "힘: 장비 착용 최소 / 민첩: 장비 최소 / 활력: 나머지 / 에너지: 0",
    "keyRunewords": [
      "Enigma",
      "Spirit",
      "Heart of the Oak",
      "Insight",
      "Infinity"
    ],
    "breakpointGoal": {
      "fcr": 105,
      "fhr": 86
    },
    "mercenary": "2막(악몽) 힘. 엔드 무한. 정전기장 보조",
    "note": "유성(광역)+화염구(단일)가 시너지 완전 공유 → 래더 스타터 강력. 시전 속도 상충: 맥스롤 엔드 105% / 아이시베인즈 37% 표기 — 널리 인용되는 엔드타깃 105% 채택. 타격 회복 상충: 맥스롤 60% / 아이시베인즈 86%. 화염 면역은 정전기장·힘·무한으로 처리.",
    "sources": [
      "https://maxroll.gg/d2/guides/meteor-sorceress",
      "https://www.icy-veins.com/d2/fireball-sorceress-build"
    ]
  },
  {
    "id": "war-warlock-phase1",
    "class": "악마술사",
    "name": "악마술사 대표 빌드 (검증중)",
    "tags": [
      "신규",
      "검증중"
    ],
    "verify": "검증중",
    "skills": [],
    "stats": "검증중 — 스탯 방향 미확정(외부 2소스 확보 실패)",
    "keyRunewords": [
      "Authority",
      "Coven",
      "Void",
      "Vigilance"
    ],
    "breakpointGoal": {
      "fcr": null,
      "fhr": null
    },
    "mercenary": "검증중 — 권장 용병 미확정",
    "note": "악마술사는 신규 직업으로 스킬·스탯을 뒷받침할 검증된 외부 자료가 아직 부족해, 정확도를 위해 스킬·수치는 준비 중으로 비워 두었습니다(추정 기입 금지). 전용 세트 룬워드만 우선 연결했습니다. 자료가 공식화되면 갱신됩니다.",
    "sources": []
  }
];

export function allClasses() {
  const seen = new Set();
  const list = [];
  for (const b of BUILDS) if (!seen.has(b.class)) { seen.add(b.class); list.push(b.class); }
  return list;
}
export function buildsByClass(cls) {
  if (!cls || cls === "all") return BUILDS.slice();
  return BUILDS.filter((b) => b.class === cls);
}
