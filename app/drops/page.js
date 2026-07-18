"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { FARM_TARGETS, searchTargets, resolveSpots } from "../../lib/farm-targets";

const TYPES = [
  ["all", "전체"], ["rune", "룬"], ["runeword-mat", "룬워드 재료"], ["unique", "고유"],
];

// type → 기존 아이템 등급색 클래스(.ti-{cat}/.ti-tag-{cat}). 라벨은 사이트 정본(app/new-items/page.js:13) 표기.
const TYPE_CLASS = { rune: "rune", "runeword-mat": "rw", unique: "unique" };
const TYPE_LABEL = { rune: "룬", "runeword-mat": "룬워드 재료", unique: "고유" };

// 내부 링크 — 라벨은 app/components/TabNav.js의 탭 이름 그대로(같은 곳을 탭마다 다른 말로 부르지 않는다).
// links.* 가 falsy면 버튼을 렌더하지 않는다(죽은 링크·비활성 버튼 금지).
const LINKS = [
  ["runewords", "/runewords", "룬워드"],
  ["planner", "/planner", "룬 재고"],
  ["cube", "/cube", "호라드릭 큐브"],
  ["breakpoints", "/breakpoints", "프레임 기준"],
  ["prices", "/prices", "시세 지수"],
  ["terrorZone", "/terror-zone", "공포의 영역"],
  ["grail", "/grail", "아이템 (연대기)"],
];

// 스팟이 하나도 없는 목표의 사유. lib/farm-targets.js의 warn 원문은 개발 메모(반말 + `1345개 TC`·`armo3`
// 같은 내부 용어)라 화면에 그대로 뿌리지 않는다 — 화면 문구는 여기서 존댓말로 갖는다.
// 사유는 목표마다 다르므로 id로 건다. 없으면 아래 고정 카피만 나간다(없는 사유를 지어내지 않는다).
const NO_DATA_DETAIL = {
  "unique-shako":
    "샤코의 방어구 베이스는 게임의 드롭 표에 아이템 코드로 직접 등장하지 않고, 방어구 등급을 가리키는 내부 코드로만 참조됩니다. 그 코드가 어떤 아이템을 내주는지의 규칙은 공개된 게임 데이터에 없습니다.",
};

/**
 * note는 마크다운 표기(`식별자` · **강조**)를 쓴다 — 그대로 뿌리면 백틱·별표가 화면에 남는다.
 * 여기서 처리하는 건 실제로 쓰인 두 구문뿐이다(실측: 백틱 9 · 볼드 1). 문장은 건드리지 않는다.
 */
/** 스팟 칩 1개. "몬스터 · 지역" 2단이되, 둘이 같으면(비밀의 젖소방) 한 번만 쓴다. */
function SpotChip({ row }) {
  const area = !row.areaKr ? "지역 미상" : row.areaKr === row.kr ? null : row.areaKr;
  // ⚠는 "보이는 이 값의 근거가 약하다"일 때만. "지역 미상"은 그 자체로 완전한 고지라 ⚠를 겹치지 않는다
  // (7스팟 중 5개가 warn 보유 — 칩마다 달면 경고가 기본값이 되어 뜻을 잃는다).
  const weak = Boolean(row.areaKr && row.warn);
  return (
    <span className="chip">
      {row.kr}
      {area && <span className="en"> · {area}</span>}
      {weak && " ⚠"}
    </span>
  );
}

/** 카드 하단 경고 블록 문장들. 정보 없음 / 근거 약함은 다른 것이라 문장을 나눈다. */
function warnLines(rows) {
  const out = [];
  const unknown = rows.filter((r) => !r.areaKr);
  const weak = rows.filter((r) => r.areaKr && r.warn);
  if (unknown.length) {
    out.push(
      `${unknown.length}곳은 지역을 표시하지 못했습니다 — 게임 데이터에 몬스터가 어느 지역에 있는지 연결하는 정보가 없습니다. 몬스터 이름은 확인된 값입니다.`
    );
  }
  if (weak.length) {
    const areas = [...new Set(weak.map((r) => r.areaKr))].join("·");
    out.push(`${areas} 표기는 게임 데이터의 직접 근거가 아니라 이 사이트의 기존 파밍·공포의 영역 정보를 따랐습니다.`);
  }
  return out;
}

function TargetCard({ target }) {
  const rows = resolveSpots(target);
  const plain = rows.filter((r) => !r.tzOnly);
  const tz = rows.filter((r) => r.tzOnly);
  const warns = warnLines(rows);
  const links = LINKS.filter(([key]) => target.links?.[key]);
  const cls = TYPE_CLASS[target.type];

  return (
    <div className="card">
      <div className={`ti-kr ti-${cls}`}>
        {target.kr} <span className={`ti-tag ti-tag-${cls}`}>{TYPE_LABEL[target.type]}</span>
      </div>
      <div className="ti-en">
        {target.en}
        {target.itemCode ? ` · ${target.itemCode}` : ""}
      </div>

      {rows.length > 0 && (
        <div className="fm-sec">
          {plain.length > 0 && (
            <>
              {/* TZ 그룹이 없으면 "공포의 영역 없이도"가 혼자 떠서 무엇과 대비되는지가 없다. */}
              <div className="lbl">{tz.length > 0 ? "공포의 영역 없이도" : "나오는 곳"}</div>
              <div className="chips">
                {plain.map((r) => (
                  <SpotChip key={r.spotId} row={r} />
                ))}
              </div>
            </>
          )}
          {tz.length > 0 && (
            <>
              <div className="lbl" style={{ marginTop: plain.length > 0 ? 14 : 0 }}>
                공포의 영역에서만 <span className="fm-tz">공포의 영역</span>
              </div>
              <div className="chips">
                {tz.map((r) => (
                  <SpotChip key={r.spotId} row={r} />
                ))}
              </div>
            </>
          )}
          {warns.length > 0 && (
            <p className="zen rp-warn" style={{ marginTop: 12 }}>
              ⚠ {warns.join(" ")}
            </p>
          )}
        </div>
      )}

      {rows.length === 0 && target.uberOnly && (
        <div className="fm-sec">
          {/* 우버 전용은 "모른다"가 아니라 "일반 드롭이 없다는 걸 안다"는 확정 사실 → ⚠(불확실)이 아니라 안내로 표기.
              출처(우버 디아블로 vs 우버 트리스트람)는 아이템마다 다르므로 target.rewardSource로 개별 표기. */}
          <p className="zen rp-warn">
            이 아이템은 <b>일반 몬스터 드롭으로는 나오지 않습니다</b> — 만들어지려면 아이템 레벨 110이 필요한데,
            일반 사냥 대상 몬스터는 지옥에서도 최고 99입니다.
            {target.rewardSource && <> <b>{target.rewardSource}</b> 처치 보상 전용입니다.</>}
          </p>
        </div>
      )}

      {rows.length === 0 && !target.uberOnly && (
        <div className="fm-sec">
          <p className="zen gr-warn">
            ⚠ 어디서 나오는지 데이터로 확정하지 못했습니다.
            {NO_DATA_DETAIL[target.id] && (
              <>
                <br />
                <br />
                {NO_DATA_DETAIL[target.id]}
              </>
            )}
            <br />
            <br />
            통념으로 채울 수는 있습니다. 하지만 이 탭은 게임 데이터로 확인된 것만 싣습니다 — 그래서 비워 둡니다.
          </p>
        </div>
      )}

      {target.tcPath && (
        <details className="gloss fm-why">
          <summary>
            <span className="eyebrow mute">왜 이 곳인가 — 근거 경로</span>
            <span className="gloss-arrow" aria-hidden="true">▾</span>
          </summary>
          <div className="gloss-body">
            <div className="cube-result-line">
              {target.tcPath.map((step, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className="cube-arrow">→</span>}
                  <span className="rw-mtag">{step}</span>
                </Fragment>
              ))}
            </div>
            <p className="ti-meta">
              왼쪽 표가 오른쪽 표를 불러오고, 마지막이 실제 아이템 코드입니다. 게임의 드롭 표를 그대로 따라간
              경로이며, <b>얼마나 자주 나오는지(확률)는 다루지 않습니다.</b>
            </p>
          </div>
        </details>
      )}

      {target.note && (
        <p className="ti-meta" style={{ marginTop: 14 }}>
          {target.note}
        </p>
      )}

      {links.length > 0 && (
        <div className="ti-links" style={{ marginTop: 14 }}>
          {links.map(([key, href, label]) => (
            <Link key={key} className="ti-btn" href={href}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DropsPage() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("all");

  const hits = useMemo(() => {
    // searchTargets("")는 빈 배열을 돌려준다 — 그대로 부르면 첫 화면이 텅 빈다. 빈 쿼리는 전체로 폴백.
    const base = query.trim() ? searchTargets(query) : FARM_TARGETS;
    return activeType === "all" ? base : base.filter((t) => t.type === activeType);
  }, [query, activeType]);

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">드롭 위치</div>
          <h1 className="zname">D2R 드롭 위치 — 이 아이템 어디서 나오나</h1>
          <p className="zen">
            고룬·룬워드 재료·인기 고유 아이템이 <b>어느 몬스터·지역에서 나올 수 있는지</b>를 게임 데이터의 드롭
            표에서 직접 추출해 정리했습니다. 한글명 · 초성(ㅂㄹ) · 영문명 모두 검색 가능합니다. 이 탭의 모든
            경로는 <b>지옥(Hell) 기준</b>이며, 얼마나 자주 나오는지(확률)는 다루지 않습니다.
          </p>
        </div>

        <div className="card ti-searchbar">
          <input
            className="ti-input"
            type="text"
            placeholder="검색: 예) 베르, ㅂㄹ, ber, 에니그마, 조던링, 샤코"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="ti-chips">
            {TYPES.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`ti-chip ${activeType === id ? "on" : ""}`}
                aria-pressed={activeType === id}
                onClick={() => setActiveType(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ti-count">{hits.length}개 목표</div>
        </div>

        <div className="stack">
          {hits.map((t) => (
            <TargetCard key={t.id} target={t} />
          ))}
        </div>
        {hits.length === 0 && (
          <div className="ti-empty">검색 결과가 없습니다. 초성·띄어쓰기 없이 다시 시도해 보세요.</div>
        )}

        <details className="card gloss">
          <summary>
            <span className="eyebrow gold">신규 유저 용어 안내</span>
            <span className="gloss-arrow" aria-hidden="true">▾</span>
          </summary>
          <div className="gloss-body">
            <ul className="info">
              <li>
                <span className="dot">●</span>
                <span>
                  <b>드롭 표</b> — 게임이 “무엇을 떨굴지” 고를 때 참조하는 표. 표가 다른 표를 부르는 계단
                  구조라, 이 탭은 그 계단을 끝까지 따라가 아이템에 닿는지만 확인합니다.
                </span>
              </li>
              <li>
                <span className="dot">●</span>
                <span>
                  <b>근거 경로</b> — 그 계단을 그대로 적은 것. <code>Act 3 (H) Good → Runes 15 → r30</code>은
                  “지옥 3막의 표가 룬 표 15를 부르고, 그 안에 r30(베르 룬)이 있다”는 뜻입니다.
                </span>
              </li>
              <li>
                <span className="dot">●</span>
                <span>
                  <b>r30 같은 코드</b> — 게임 데이터가 아이템을 부르는 내부 이름입니다.
                </span>
              </li>
              <li>
                <span className="dot">●</span>
                <span>
                  <b>공포의 영역(TZ, Terror Zone)</b> — 매시 정각마다 바뀌는 강화 사냥터. 드롭 표가
                  상향됩니다. (→ 공포의 영역 탭)
                </span>
              </li>
            </ul>
          </div>
        </details>

        <div className="note">
          <b>범위</b> — 인기 목표 {FARM_TARGETS.length}개 한정입니다. 여기서 답하는 것은 <b>“나올 수 있는가”</b>(경로가
          존재하는가)이며, <b>“얼마나 자주 나오는가”(확률)는 다루지 않습니다.</b>
          <br />
          <b>근거</b> — 모든 지역·몬스터는 게임 데이터의 드롭 표에서 추출한 값입니다. 통념으로 채우지 않았고,
          데이터로 확정하지 못한 것은 <b>⚠로 표시하거나 비워 뒀습니다.</b>
        </div>
      </div>
    </main>
  );
}
