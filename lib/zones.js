// D2R 공포의 영역(Terror Zone) 데이터 + 로테이션/매칭 유틸
// 서버(API 라우트)와 클라이언트(page.js) 양쪽에서 공유.

// ⚠ kr(한국어명)은 D2R 공식 인게임 로컬라이징(koKR string table) 기준. 직역 금지.
//   (출처: D2R levels.json koKR 필드 — 게임 실제 표기와 1:1 대조)
export const TERROR_ZONES = [
  {act:1,kr:"핏빛 황무지 & 악의 소굴",en:"Blood Moor & Den of Evil",areas:[["핏빛 황무지","Blood Moor"],["악의 소굴","Den of Evil"]]},
  {act:1,kr:"차가운 평야 & 동굴",en:"Cold Plains & The Cave",areas:[["차가운 평야","Cold Plains"],["동굴","The Cave"]]},
  {act:1,kr:"매장지 · 묘실 · 영묘",en:"Burial Grounds, Crypt & Mausoleum",areas:[["매장지","Burial Grounds"],["묘실","The Crypt"],["영묘","The Mausoleum"]]},
  {act:1,kr:"바위 벌판",en:"Stony Field",areas:[["바위 벌판","Stony Field"]]},
  {act:1,kr:"트리스트럼",en:"Tristram",areas:[["트리스트럼","Tristram"]]},
  {act:1,kr:"어둠숲 & 지하 통로",en:"Dark Wood & Underground Passage",areas:[["어둠숲","Dark Wood"],["지하 통로","Underground Passage"]]},
  {act:1,kr:"검은 습지 & 구렁",en:"Black Marsh & The Hole",areas:[["검은 습지","Black Marsh"],["구렁","The Hole"]]},
  {act:1,kr:"잊힌 탑",en:"The Forgotten Tower",areas:[["탑 지하 1~5층","Tower Cellar Lvl 1-5"]]},
  {act:1,kr:"감옥 & 병영",en:"Jail & Barracks",areas:[["감옥 1~3층","Jail Lvl 1-3"],["병영","The Barracks"]]},
  {act:1,kr:"구덩이",en:"The Pit",areas:[["구덩이 1~2층","The Pit Lvl 1-2"]]},
  {act:1,kr:"대성당 & 지하 묘지",en:"Cathedral & Catacombs",areas:[["대성당","The Cathedral"],["지하 묘지 1~4층","Catacombs Lvl 1-4"]]},
  {act:1,kr:"비밀의 젖소방",en:"The Secret Cow Level",areas:[["비밀의 젖소방","Moo Moo Farm"]]},

  {act:2,kr:"하수도",en:"Lut Gholein Sewers",areas:[["하수도 1~3층","Sewers Lvl 1-3"]]},
  {act:2,kr:"바위투성이 황무지 & 바위 무덤",en:"Rocky Waste & Stony Tomb",areas:[["바위투성이 황무지","Rocky Waste"],["바위 무덤","Stony Tomb"]]},
  {act:2,kr:"메마른 언덕 & 망자의 전당",en:"Dry Hills & Halls of the Dead",areas:[["메마른 언덕","Dry Hills"],["망자의 전당 1~3층","Halls of the Dead"]]},
  {act:2,kr:"머나먼 오아시스",en:"Far Oasis",areas:[["머나먼 오아시스","Far Oasis"]]},
  {act:2,kr:"잊힌 도시 · 뱀의 골짜기 · 발톱 독사 사원",en:"Lost City, Valley of Snakes & Claw Viper Temple",areas:[["잊힌 도시","Lost City"],["뱀의 골짜기","Valley of Snakes"],["발톱 독사 사원","Claw Viper Temple"]]},
  {act:2,kr:"고대 토굴",en:"Ancient Tunnels",areas:[["고대 토굴","Ancient Tunnels"]]},
  {act:2,kr:"비전의 성역",en:"Arcane Sanctuary",areas:[["비전의 성역","Arcane Sanctuary"]]},
  {act:2,kr:"신비술사의 협곡 & 탈 라샤의 무덤",en:"Canyon of the Magi & Tal Rasha's Tombs",areas:[["신비술사의 협곡","Canyon of the Magi"],["탈 라샤의 무덤","Tal Rasha's Tombs"]]},

  {act:3,kr:"거미 숲 & 거미 동굴",en:"Spider Forest & Spider Cavern",areas:[["거미 숲","Spider Forest"],["거미 동굴","Spider Cavern"]]},
  {act:3,kr:"거대 습지",en:"Great Marsh",areas:[["거대 습지","Great Marsh"]]},
  {act:3,kr:"약탈자 밀림 & 약탈자 소굴",en:"Flayer Jungle & Flayer Dungeon",areas:[["약탈자 밀림","Flayer Jungle"],["약탈자 소굴","Flayer Dungeon"]]},
  {act:3,kr:"쿠라스트 시장 · 허물어진 사원 · 버려진 교회당",en:"Kurast Bazaar, Ruined Temple & Disused Fane",areas:[["쿠라스트 시장","Kurast Bazaar"],["허물어진 사원","Ruined Temple"],["버려진 교회당","Disused Fane"]]},
  {act:3,kr:"트라빈칼",en:"Travincal",areas:[["트라빈칼","Travincal"]]},
  {act:3,kr:"증오의 억류지",en:"Durance of Hate",areas:[["증오의 억류지 1~3층","Durance of Hate Lvl 1-3"]]},

  {act:4,kr:"평원 외곽 & 절망의 평원",en:"Outer Steppes & Plains of Despair",areas:[["평원 외곽","Outer Steppes"],["절망의 평원","Plains of Despair"]]},
  {act:4,kr:"저주받은 자들의 도시 & 불길의 강",en:"City of the Damned & River of Flame",areas:[["저주받은 자들의 도시","City of the Damned"],["불길의 강","River of Flame"]]},
  {act:4,kr:"혼돈의 성역",en:"Chaos Sanctuary",areas:[["혼돈의 성역","Chaos Sanctuary"]]},

  {act:5,kr:"핏빛 언덕",en:"Bloody Foothills",areas:[["핏빛 언덕","Bloody Foothills"]]},
  {act:5,kr:"혹한의 고산지 & 나락",en:"Frigid Highlands & Abaddon",areas:[["혹한의 고산지","Frigid Highlands"],["나락","Abaddon"]]},
  {act:5,kr:"아리앗 고원 & 아케론의 구덩이",en:"Arreat Plateau & Pit of Acheron",areas:[["아리앗 고원","Arreat Plateau"],["아케론의 구덩이","Pit of Acheron"]]},
  {act:5,kr:"수정 동굴 & 얼어붙은 강",en:"Crystalline Passage & Frozen River",areas:[["수정 동굴","Crystalline Passage"],["얼어붙은 강","Frozen River"]]},
  {act:5,kr:"빙하의 길 & 부랑자의 동굴",en:"Glacial Trail & Drifter Cavern",areas:[["빙하의 길","Glacial Trail"],["부랑자의 동굴","Drifter Cavern"]]},
  {act:5,kr:"얼어붙은 동토 & 지옥불 구덩이",en:"Frozen Tundra & Infernal Pit",areas:[["얼어붙은 동토","Frozen Tundra"],["지옥불 구덩이","Infernal Pit"]]},
  {act:5,kr:"고대인의 길 & 얼음 지하실",en:"Ancients' Way & Icy Cellar",areas:[["고대인의 길","Ancients' Way"],["얼음 지하실","Icy Cellar"]]},
  {act:5,kr:"니흘라탁의 사원 & 고뇌/고통/보트의 전당",en:"Nihlathak's Temple & Halls",areas:[["니흘라탁의 사원","Nihlathak's Temple"],["고뇌의 전당","Halls of Anguish"],["고통의 전당","Halls of Pain"],["보트의 전당","Halls of Vaught"]]},
  {act:5,kr:"세계석 성채 · 파괴의 왕좌 · 세계석 보관실",en:"Worldstone Keep, Throne & Chamber",areas:[["세계석 성채 1~3층","Worldstone Keep Lvl 1-3"],["파괴의 왕좌","Throne of Destruction"],["세계석 보관실","Worldstone Chamber"]]},
];

export function actLabel(a){return {1:"액트 I",2:"액트 II",3:"액트 III",4:"액트 IV",5:"액트 V"}[a];}

// 결정론적 모의 로테이션 (실데이터 없을 때 폴백)
export function mockZoneForDate(date){
  const n = TERROR_ZONES.length;
  const h = Math.floor(date.getTime()/3600000);
  return TERROR_ZONES[((h%n)+n)%n];
}

// ---- d2emu zone ID → 지역 매핑 ----
// d2emu /api/v1/tz 응답은 {current:[id,...], next:[id,...]} 형태의 숫자 zone ID 배열.
// (매핑 출처: d2emu 공개 트래커 데이터) 대부분 TERROR_ZONES 인덱스와 1:1 대응하며,
// d2emu가 하나로 묶는 그룹(id 110)만 별도 병합 엔트리로 처리.
// ⚠ "얼어붙은 동토 & 지옥불 구덩이"(인덱스 34, d2runewizard 실데이터로 뒤늦게 발견되어 추가됨)의
//   d2emu ID는 아직 확인 못함 — d2emu 승인 후 실 응답으로 확정해서 채울 것.
const D2EMU_ID_TO_INDEX = {
  2:0, 3:1, 17:2, 4:3, 38:4, 5:5, 6:6, 20:7, 28:8, 12:9, 33:10, 39:11,
  47:12, 41:13, 42:14, 43:15, 44:16, 65:17, 74:18, 66:19,
  76:20, 77:21, 78:22, 80:23, 83:24, 100:25,
  104:26, 106:27, 108:28,
  112:31, 113:32, 115:33, 118:35, 121:36, 128:37,
};
const D2EMU_MERGED = {
  110: { act:5, kr:"핏빛 언덕 · 혹한의 고산지 · 나락", en:"Bloody Foothills, Frigid Highlands & Abaddon",
         areas:[["핏빛 언덕","Bloody Foothills"],["혹한의 고산지","Frigid Highlands"],["나락","Abaddon"]] },
};

// d2emu의 id 배열에서 매핑되는 첫 지역을 반환 (Python 레퍼런스 구현과 동일 동작)
export function d2emuZoneFromIds(ids){
  const list = Array.isArray(ids) ? ids : [ids];
  for (const raw of list){
    const id = Number(raw);
    if (D2EMU_MERGED[id]) return D2EMU_MERGED[id];
    if (id in D2EMU_ID_TO_INDEX) return TERROR_ZONES[D2EMU_ID_TO_INDEX[id]];
  }
  return null;
}

// ---- 영문 지역명(예: d2runewizard "highestProbabilityZone.zone") → TERROR_ZONES 매칭 ----
// 표기 차이(The/and/&/구두점)에 강하도록 토큰 겹침 기반 퍼지 매칭.
const STOP = new Set(["the","and","of","a","an","&","lvl","level","levels"]);
function tokens(s){
  return String(s||"")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g," ")
    .split(/\s+/)
    .filter(t=>t && !STOP.has(t));
}
// 각 존의 검색 토큰 세트 미리 계산
const ZONE_TOKENS = TERROR_ZONES.map(z=>{
  const bag = new Set(tokens(z.en));
  z.areas.forEach(([,en])=>tokens(en).forEach(t=>bag.add(t)));
  return bag;
});

// 반환: {zone, score} 또는 null
export function matchZone(apiZoneName){
  const qt = tokens(apiZoneName);
  if(!qt.length) return null;
  let best=null, bestScore=0;
  for(let i=0;i<TERROR_ZONES.length;i++){
    const bag = ZONE_TOKENS[i];
    let hit=0;
    for(const t of qt) if(bag.has(t)) hit++;
    // 정규화 점수: 질의 토큰 대비 매칭 비율
    const score = hit / qt.length;
    if(score>bestScore){ bestScore=score; best=TERROR_ZONES[i]; }
  }
  if(bestScore>=0.5 && best) return {zone:best, score:bestScore};
  return null;
}
