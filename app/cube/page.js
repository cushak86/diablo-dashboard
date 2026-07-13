"use client";

import { useMemo, useState } from "react";
import { RUNES, GEMS, needCount, combine } from "../../lib/cube";

const nf = (n) => n.toLocaleString("en-US");

export default function CubePage() {
  const [targetIdx, setTargetIdx] = useState(30); // Jah
  const [sourceIdx, setSourceIdx] = useState(29); // Ber

  const result = useMemo(() => combine(sourceIdx, targetIdx), [sourceIdx, targetIdx]);

  const onTarget = (i) => {
    setTargetIdx(i);
    if (sourceIdx >= i) setSourceIdx(Math.max(0, i - 1));
  };

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">호라드릭 큐브</div>
          <h1 className="zname">룬 업그레이드 레시피 · 룬 조합기</h1>
          <p className="zen">
            낮은 룬을 <b>같은 룬 여러 개(+보석)</b>로 큐브에 돌려 상위 룬으로 업그레이드합니다. 엘~둔(Thul)까지는 같은 룬
            3개, <b>움(Um)부터</b>는 2개 + 지정 보석이 필요합니다. 룬워드용 고급 룬 파밍의 핵심 도구입니다.
          </p>
        </div>

        {/* 룬 조합기 */}
        <div className="card">
          <div className="eyebrow blood">룬 조합기</div>
          <div className="cube-lbl">목표 룬</div>
          <div className="cube-pillrow">
            {RUNES.map(([name], i) =>
              i === 0 ? null : (
                <button
                  key={name}
                  className={`cube-pill ${i === targetIdx ? "on" : ""}`}
                  onClick={() => onTarget(i)}
                >
                  {name}
                </button>
              )
            )}
          </div>
          <div className="cube-lbl">보유(하위) 룬</div>
          <div className="cube-pillrow">
            {RUNES.map(([name], i) =>
              i >= targetIdx ? null : (
                <button
                  key={name}
                  className={`cube-pill alt ${i === sourceIdx ? "on" : ""}`}
                  onClick={() => setSourceIdx(i)}
                >
                  {name}
                </button>
              )
            )}
          </div>

          {result && (
            <div className="cube-result">
              <div className="cube-result-line">
                <span className="cube-big">{nf(result.runeCount)}</span>
                <span className="cube-rune">{RUNES[sourceIdx][0]}</span>
                <span className="cube-arrow">→</span>
                <span className="cube-rune cube-rune-hi">{RUNES[targetIdx][0]}</span>
                <span className="cube-x1">×1</span>
              </div>
              {result.gems.length > 0 && (
                <div className="cube-gems">
                  <span className="cube-gems-lbl">추가 보석</span>
                  {result.gems.map((g, idx) => (
                    <span className="cube-gem" key={idx}>
                      {g.name} ×{nf(g.count)}
                    </span>
                  ))}
                </div>
              )}
              {result.gems.length > 0 && (
                <div className="cube-gemtotal">
                  보석 합계 <b>{nf(result.gems.reduce((s, g) => s + g.count, 0))}개</b>
                  <span className="cube-gemtotal-dim"> · {result.gems.length}종</span>
                </div>
              )}
              <div className="cube-note">
                {RUNES[targetIdx][0]} 요구 레벨 {RUNES[targetIdx][1]} · 위 수량은 {RUNES[sourceIdx][0]}만 모아 큐브를
                반복 업그레이드했을 때의 총 소모량입니다.
              </div>
            </div>
          )}
        </div>

        {/* 업그레이드 레시피 표 (전체) */}
        <div className="card">
          <div className="eyebrow gold">룬 업그레이드 레시피 (전체)</div>
          <div className="cube-tablewrap">
            <table className="cube-table">
              <thead>
                <tr>
                  <th>만들 룬</th>
                  <th>Lv</th>
                  <th>필요 재료</th>
                </tr>
              </thead>
              <tbody>
                {RUNES.map(([name, lvl], i) =>
                  i === 0 ? null : (
                    <tr key={name}>
                      <td className="cube-td-rune">{name}</td>
                      <td className="cube-td-lvl">{lvl}</td>
                      <td>
                        <span className="cube-mat">
                          {RUNES[i - 1][0]} ×{needCount(i)}
                        </span>
                        {GEMS[i] && <span className="cube-mat cube-mat-gem">+ {GEMS[i]}</span>}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 보석 승급 레시피 표 (정적) */}
        <div className="card">
          <div className="eyebrow gold">보석 승급 레시피</div>
          <p className="zen" style={{ marginTop: 6 }}>
            같은 <b>종류·등급</b> 보석 3개를 큐브에 넣으면 한 단계 위 등급으로 승급합니다. 6종 보석
            (자수정·황옥·사파이어·루비·에메랄드·다이아몬드)과 해골 모두 동일합니다.
          </p>
          <div className="cube-tablewrap">
            <table className="cube-table">
              <thead>
                <tr>
                  <th>만들 등급</th>
                  <th>필요 재료</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["흠집난 (Flawed)", "조각난 (Chipped)"],
                  ["일반 (Standard)", "흠집난 (Flawed)"],
                  ["완벽에 가까운 (Flawless)", "일반 (Standard)"],
                  ["완벽한 (Perfect)", "완벽에 가까운 (Flawless)"],
                ].map(([out, mat]) => (
                  <tr key={out}>
                    <td className="cube-td-rune">{out}</td>
                    <td>
                      <span className="cube-mat">{mat} ×3</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cube-note">
            출처 — 보석 승급 레시피는 D2R 3.2 인게임 기준(Maxroll·PureDiablo·D2R World·Inven Global 교차 검증).
          </div>
        </div>

        <div className="note">
          <b>파밍 팁</b> — 룬워드용 고급 룬(움~조드)은 드롭이 극히 드물어 <b>저급 룬 업그레이드</b>가 현실적입니다.
          카운테스(액트1 망각의 탑)·헬포지 퀘스트·공포의 영역(TZ) 런으로 저급 룬과 보석을 대량 확보한 뒤 큐브로 압축하세요.
          <br />
          <b>규칙 요약</b> — 엘→둔(Thul)까지는 같은 룬 3개. <b>아문(Amn)부터 보석 추가</b>. <b>움(Um)부터</b>는 2개 + 보석.
          보석 등급은 6단계마다 상승(조각난→흠집난→일반→완벽에 가까운).
          <br />
          <b>출처</b> — 큐브 레시피는 D2R 3.2 인게임 기준(diablo2.io·maxroll·d2r.world 교차 검증).
        </div>
      </div>
    </main>
  );
}
