import { OG_IMAGE } from "../../lib/site-pages";
import PageGuide from "../components/PageGuide";
import PageSchema from "../components/PageSchema";
import { SPOTS, FARM_TARGETS } from "../../lib/farm-targets";

const SPOT_NAMES = Object.values(SPOTS).map((s) => s.kr).join(" · ");
const TYPES = [...new Set(FARM_TARGETS.map((t) => t.type))];
// 공포의 영역에서만 열리는 경로를 가진 목표 수 — 데이터에서 센다.
const TZ_ONLY = FARM_TARGETS.filter((t) => (t.spots?.tz || []).some((s) => !(t.spots?.plain || []).includes(s))).length;

export const metadata = {
  title: "D2R 드롭 위치 — 이 아이템 어디서 나오나 (한글 검색)",
  description:
    `디아블로2 레저렉션(D2R) 드롭 위치 가이드. 베르·자·이스트 룬, 수수께끼(Enigma)·영혼(Spirit)·소집(CTA) 등 룬워드 재료, 조던의 돌(SoJ)이 어느 몬스터·지역에서 나올 수 있는지 게임 데이터의 드롭 표에서 직접 추출해 한글로 정리. 목표 ${FARM_TARGETS.length}종 · 파밍처 ${Object.keys(SPOTS).length}곳. 한글명·초성·영문명 검색. 공포의 영역에서만 열리는 경로도 구분해 표시. 지옥(Hell) 기준.`,
  alternates: { canonical: "/drops" },
  openGraph: {
    images: OG_IMAGE,
    url: "/drops",
    title: "D2R 드롭 위치 — 이 아이템 어디서 나오나 | D2R 대시보드",
    description:
      "고룬·룬워드 재료·인기 고유 아이템이 어디서 나오는지 한글로 검색. 근거는 통념이 아니라 게임 데이터의 드롭 표.",
  },
};

export default function DropsLayout({ children }) {
  return (
    <>
      <PageSchema path="/drops" />
      {children}
      <PageGuide
        eyebrow="드롭 위치 안내"
        capsule={`이 페이지는 "이 아이템이 어디서 나올 수 있나"를 게임 데이터의 드롭 표(트레저 클래스)에서 직접 찾아 답합니다. 목표 ${FARM_TARGETS.length}종(고룬·룬워드 재료·인기 고유)을 파밍처 ${Object.keys(SPOTS).length}곳(${SPOT_NAMES})과 대조했고, 지옥 난이도 기준입니다. 드롭 '확률'은 다루지 않습니다 — 경로가 있는지만 답하며, 공포의 영역에서만 열리는 경로 ${TZ_ONLY}건은 따로 표시합니다.`}
        sections={[
          {
            h: "드롭 표(트레저 클래스)란 무엇인가요?",
            p: "디아블로2의 몬스터는 각자 '트레저 클래스'라는 드롭 표에 연결돼 있고, 그 표는 다시 다른 표를 가리키는 트리 구조입니다. 예를 들어 지옥 메피스토의 표는 3막 상위 표를 거쳐 룬 표로 이어지고, 어떤 룬 표까지 닿느냐가 그 몬스터가 줄 수 있는 최고 룬을 정합니다. 이 페이지의 모든 답은 그 트리를 끝까지 따라가 얻은 것이라, '카운테스는 이스트까지'처럼 널리 알려진 말과 다를 때는 데이터를 우선합니다.",
            list: TYPES.map((t) => ({ k: t, v: `${FARM_TARGETS.filter((x) => x.type === t).length}종` })),
          },
          {
            h: "공포의 영역에서는 왜 더 좋은 것이 나오나요?",
            p: "공포의 영역에서 몬스터는 캐릭터 레벨에 맞춰 더 높은 레벨이 되고, 별도의 드롭 표(황폐화 표)로 바뀝니다. 그 표는 일반 표보다 높은 룬 표까지 닿기 때문에, 평소에는 나올 수 없던 룬이 같은 몬스터에게서 나올 수 있습니다. 이 페이지는 그런 경로를 '공포의 영역에서만'으로 구분해 보여줍니다. 고유 아이템은 몬스터 레벨이 아이템 레벨(qlvl) 이상이어야 나올 수 있으므로, 레벨이 오르는 공포의 영역에서는 나올 수 있는 고유의 폭도 넓어집니다.",
          },
          {
            h: "왜 확률은 안 알려주나요?",
            p: "드롭 확률은 파티 인원·플레이어 수 설정·마법 아이템 발견 확률·몬스터 종류(일반·챔피언·고유)에 따라 크게 달라져 숫자 하나로 적으면 오히려 오해를 만듭니다. 이 페이지는 '나올 수 있는가'라는 확실한 사실만 답하고, 얼마나 자주 나오는지는 다루지 않습니다. 룬을 얻은 뒤에는 룬 재고·룬 추천 탭에서 무엇을 만들 수 있는지 바로 확인할 수 있습니다.",
          },
        ]}
        faq={[
          { q: "일반 난이도나 악몽 난이도도 있나요?", a: "지옥 난이도만 다룹니다. 고룬과 인기 고유의 대부분은 지옥에서만 나오거나 지옥이 압도적으로 유리합니다." },
          { q: "지역이 '미확인'으로 표시됩니다.", a: "게임 데이터에 그 몬스터와 지역을 잇는 항목이 없어 데이터만으로 확정하지 못한 경우입니다. 추측으로 채우지 않고 미확인으로 남겼습니다." },
          { q: "특정 아이템이 목록에 없습니다.", a: "자주 찾는 목표부터 실었습니다. 사이트 소개 페이지의 메일로 알려주시면 같은 방식으로 추출해 추가합니다." },
        ]}
      />
    </>
  );
}
