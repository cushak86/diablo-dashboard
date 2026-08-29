import { OG_IMAGE } from "../../lib/site-pages";
import PageGuide from "../components/PageGuide";
import PageSchema from "../components/PageSchema";
import { RUNES, GEMS, combine } from "../../lib/cube";

// 예시 수치는 lib/cube.js 의 규칙으로 계산한다 — 손으로 적지 않는다.
const idx = (n) => RUNES.findIndex(([r]) => r === n);
const NO_GEM = GEMS.filter((g) => !g).length; // 보석 없이 승급되는 결과 룬 수(엘~둔 구간)
const FIRST_GEM = RUNES[GEMS.findIndex(Boolean)][0]; // 보석이 처음 필요한 결과 룬
const FIRST_TWO = RUNES[21][0]; // 2개로 승급되기 시작하는 룬(needCount)
const IST_TO_BER = combine(idx("Ist"), idx("Ber"));
const EL_TO_ZOD = combine(0, RUNES.length - 1);

export const metadata = {
  title: "호라드릭 큐브 · 룬 업그레이드 레시피 & 룬 조합기",
  description:
    `디아블로2 레저렉션(D2R) 호라드릭 큐브 룬 업그레이드 레시피(엘→조드, ${RUNES.length}룬) 전체 표와 룬 조합기. 목표 룬을 만드는 데 필요한 하위 룬 개수·보석을 자동 계산. 룬워드용 룬 파밍 실전 가이드.`,
  alternates: { canonical: "/cube" },
  openGraph: {
    images: OG_IMAGE,
    url: "/cube",
    title: "호라드릭 큐브 룬 조합기 | D2R 대시보드",
    description:
      "룬 업그레이드 레시피 전체표 + 목표 룬 조합 계산기(하위 룬·보석 자동 계산).",
  },
};

export default function CubeLayout({ children }) {
  return (
    <>
      <PageSchema path="/cube" />
      {children}
      <PageGuide
        eyebrow="호라드릭 큐브 안내"
        capsule={`호라드릭 큐브는 2막 퀘스트로 얻는 아이템 조합 도구이며, 룬 ${RUNES.length}종은 큐브에서 하위 룬 여러 개를 상위 룬 하나로 승급할 수 있습니다. 이 페이지는 엘부터 조드까지의 승급 표와, 목표 룬을 만들 때 필요한 하위 룬 개수와 보석을 계산하는 조합기를 제공합니다. 예를 들어 이스트만으로 베르 하나를 만들려면 이스트 ${IST_TO_BER.runeCount}개가 필요합니다.`}
        sections={[
          {
            h: "룬 승급 규칙은 무엇인가요?",
            p: `엘에서 ${RUNES[20][0]}까지는 같은 룬 3개가 다음 룬 1개가 되고, ${FIRST_TWO}부터 조드까지는 2개가 1개가 됩니다. 낮은 구간(${NO_GEM}단계)은 보석이 필요 없지만 ${FIRST_GEM}부터는 정해진 보석 하나를 함께 넣어야 하며, 등급이 올라갈수록 조각난 → 흠집난 → 일반 → 완벽에 가까운 보석으로 요구 보석도 높아집니다. 승급은 한 번에 한 단계씩만 됩니다.`,
            list: [
              { k: `엘 → ${RUNES[20][0]}`, v: "3개 → 1개" },
              { k: `${FIRST_TWO} → 조드`, v: "2개 → 1개" },
              { k: "보석", v: `${FIRST_GEM}부터 필요 · 결과 룬마다 종류가 정해져 있다` },
            ],
          },
          {
            h: "하위 룬을 모아 고룬을 만드는 것이 이득인가요?",
            p: `계산기는 정직하게 곱셈을 합니다 — 엘만으로 조드를 만들면 엘 ${EL_TO_ZOD.runeCount.toLocaleString("ko-KR")}개가 든다는 식입니다. 실전에서는 중간 등급(푸울~이스트)까지는 카운테스 등에서 자연히 쌓이므로 승급이 유용하고, 그 위는 시장에서 룬끼리 바꾸는 편이 승급 비율(2:1)보다 유리한 경우가 많습니다. 조합기는 '가능한가'와 '몇 개인가'를 알려주고, 이득 여부는 시세 탭과 함께 판단하세요.`,
          },
          {
            h: "룬워드를 목표로 할 때는 어떻게 쓰나요?",
            p: "룬워드 탭의 각 항목에는 필요한 룬 중 가장 높은 룬을 엘부터 만들 때의 총 소모량이 적혀 있고, 룬 재고 탭은 실제로 가진 룬(등급이 섞여 있어도)으로 어떤 룬워드가 즉시·큐브로·부족인지 판정합니다. 이 페이지는 그 둘의 바탕이 되는 승급 규칙 자체를 다룹니다.",
          },
        ]}
        faq={[
          { q: "승급이 래더에서만 되나요?", a: "아닙니다. 현재는 래더·비래더 모두에서 됩니다. 과거 원작 시절 고룬 승급이 래더 전용이던 때가 있어 혼동이 남아 있습니다." },
          { q: "보석은 어디서 구하나요?", a: "몬스터 드롭과 상자에서 나오며, 같은 등급 보석 3개를 큐브에 넣으면 한 등급 위 보석이 됩니다. 필요한 보석 종류는 결과 룬마다 다르므로 계산기 결과를 확인하세요." },
          { q: "큐브에 룬을 넣었는데 아무 일도 없습니다.", a: "개수(3개 또는 2개), 같은 종류인지, 필요한 보석이 정확히 하나인지 확인하세요. 다른 아이템이 함께 들어 있어도 레시피가 성립하지 않습니다." },
        ]}
      />
    </>
  );
}
