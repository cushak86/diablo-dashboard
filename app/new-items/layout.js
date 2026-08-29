import { OG_IMAGE } from "../../lib/site-pages";
import PageGuide from "../components/PageGuide";
import PageSchema from "../components/PageSchema";
import { ITEMS } from "../../lib/items";

const CAT = { rw: "룬워드", unique: "고유", set: "세트", jewel: "고유 주얼", charm: "파괴 부적", statue: "고대인 조각상", base: "마법서 베이스", misc: "세계석 조각" };
const COUNTS = Object.keys(CAT).map((c) => ({ k: CAT[c], v: `${ITEMS.filter((i) => i.cat === c).length}종` })).filter((x) => x.v !== "0종");

export const metadata = {
  title: "신규 아이템 · 트레더리(Traderie) 한→영 검색",
  description:
    `디아블로2 레저렉션 악마술사의 군림(패치 3.0+) 신규 아이템 ${ITEMS.length}종의 한글명→영문명 변환과 트레더리(Traderie) 거래 링크. 룬워드·고유·세트·파괴 부적·마법서 베이스 등 한글/초성/영문 검색 지원.`,
  alternates: { canonical: "/new-items" },
  openGraph: {
    images: OG_IMAGE,
    url: "/new-items",
    title: "신규 아이템 · 트레더리 한→영 검색 | D2R 대시보드",
    description:
      "악마술사의 군림 신규 아이템 한글→영문 변환 + 트레더리 거래 링크. 한글·초성·영문 검색.",
  },
};

export default function NewItemsLayout({ children }) {
  return (
    <>
      <PageSchema path="/new-items" />
      {children}
      <PageGuide
        eyebrow="신규 아이템 안내"
        capsule={`악마술사의 군림(Reign of the Warlock) 확장으로 추가된 아이템 ${ITEMS.length}종을 한글명·영문명·별칭으로 정리했습니다. 해외 거래 사이트 트레더리(Traderie)는 영문명으로만 검색되기 때문에, 한글로 찾아 영문명을 복사하거나 바로 거래 목록으로 이동할 수 있게 했습니다. 고유·세트 항목은 게임 데이터에서 생성한 옵션도 함께 볼 수 있습니다.`}
        sections={[
          {
            h: "어떤 아이템이 실려 있나요?",
            p: "확장으로 새로 생긴 것만 다룹니다 — 신규 룬워드, 악마술사 전용 마법서를 포함한 고유 아이템, 신규 세트, 우버 고대인 보상 주얼, 파괴 부적(잠복하는/새로워진), 고대인 조각상 재료, 마법서 베이스, 세계석 조각입니다. 기존 클래식 고유·세트는 아이템 연대기 탭에 있습니다.",
            list: COUNTS,
          },
          {
            h: "파괴 부적은 왜 두 종류인가요?",
            p: "'잠복하는' 부적은 공포의 영역 전령이 떨어뜨리는 기본형이고, '새로워진' 부적은 잠복하는 부적에 룬·최상급 보석·우버 고대인 재료를 더해 호라드릭 큐브로 만드는 강화형입니다. 두 단계가 별개 아이템이라 각각 따로 실었습니다. 각 부적은 원소(마법·물리·냉기·번개·화염·독) 하나를 담당하며, 착용하면 그 원소에 면역인 몬스터의 면역이 깨지는 대신 자신의 저항이 깎입니다.",
          },
          {
            h: "검색은 어떻게 하나요?",
            p: "한글명, 초성(예: ㄱㅍㅅㄱㄴ), 영문명, 그리고 커뮤니티에서 통용되는 별칭 어느 것으로도 찾힙니다. 별칭은 옛 표기나 음차를 모아 둔 것이라 게임의 공식 표기와 다를 수 있지만, 표시되는 이름은 공식 한글을 따릅니다. 즐겨찾기는 이 브라우저에만 저장됩니다.",
          },
        ]}
        faq={[
          { q: "트레더리는 어떤 사이트인가요?", a: "여러 게임의 이용자 간 거래를 중개하는 외부 사이트입니다. 이 페이지는 검색 링크만 제공하며 거래 자체에는 관여하지 않습니다. 거래는 외부 사이트의 규칙과 위험 아래 이뤄집니다." },
          { q: "신규 룬워드의 옵션도 정확한가요?", a: "패치 3.3 기준 게임 데이터에서 생성한 값입니다. 룬 조합과 소켓 수도 같은 데이터로 대조했습니다." },
          { q: "빠진 아이템이 있습니다.", a: "사이트 소개 페이지의 메일로 이름을 알려주세요. 게임 데이터에서 확인되는 것은 추가합니다." },
        ]}
      />
    </>
  );
}
