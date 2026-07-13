"use client";

import { useState } from "react";

// 브레이크포인트: [필요 %, 결과 프레임]. 25fps 기준, 프레임이 낮을수록 빠름.
// 각 프레임에 도달하는 "최소 %"만 기재(중복 구간 제거). 출처는 하단 note 참고.
const CLASSES = [
  {
    kr: "아마존", en: "Amazon",
    fcr: [[0, 19], [7, 18], [14, 17], [22, 16], [32, 15], [48, 14], [68, 13], [99, 12], [152, 11]],
    fhr: [[0, 11], [6, 10], [13, 9], [20, 8], [32, 7], [52, 6], [86, 5], [174, 4]],
  },
  {
    kr: "어쌔신", en: "Assassin",
    fcr: [[0, 16], [8, 15], [16, 14], [27, 13], [42, 12], [65, 11], [102, 10], [174, 9]],
    fhr: [[0, 9], [8, 8], [15, 7], [27, 6], [48, 5], [86, 4], [200, 3]],
  },
  {
    kr: "바바리안", en: "Barbarian",
    fcr: [[0, 13], [9, 12], [20, 11], [37, 10], [63, 9], [105, 8], [200, 7]],
    fhr: [[0, 9], [8, 8], [15, 7], [27, 6], [48, 5], [86, 4], [200, 3]],
  },
  {
    kr: "드루이드", en: "Druid",
    fcr: [[0, 18], [4, 17], [10, 16], [19, 15], [30, 14], [46, 13], [68, 12], [99, 11], [163, 10]],
    fhr: [[0, 14], [3, 13], [7, 12], [13, 11], [19, 10], [29, 9], [42, 8], [63, 7], [99, 6], [174, 5]],
  },
  {
    kr: "네크로맨서", en: "Necromancer",
    fcr: [[0, 15], [9, 14], [18, 13], [30, 12], [48, 11], [75, 10], [125, 9]],
    fhr: [[0, 13], [5, 12], [10, 11], [16, 10], [26, 9], [39, 8], [56, 7], [86, 6], [152, 5]],
  },
  {
    kr: "팔라딘", en: "Paladin",
    fcr: [[0, 15], [9, 14], [18, 13], [30, 12], [48, 11], [75, 10], [125, 9]],
    fhr: [[0, 9], [7, 8], [15, 7], [27, 6], [48, 5], [86, 4], [200, 3]],
  },
  {
    kr: "소서리스", en: "Sorceress",
    fcr: [[0, 13], [9, 12], [20, 11], [37, 10], [63, 9], [105, 8], [200, 7]],
    fhr: [[0, 15], [5, 14], [9, 13], [14, 12], [20, 11], [30, 10], [42, 9], [60, 8], [86, 7], [142, 6]],
  },
  {
    kr: "악마술사", en: "Warlock",
    fcr: [[0, 15], [9, 14], [18, 13], [30, 12], [48, 11], [75, 10], [125, 9]],
    fhr: [[0, 13], [5, 12], [10, 11], [16, 10], [26, 9], [39, 8], [56, 7], [86, 6], [152, 5], [377, 4]],
  },
];

const STATS = {
  fcr: { label: "시전 속도 (FCR)", col: "필요 FCR", desc: "스킬을 시전하는 데 걸리는 프레임. 소환·저주·마법 계열 캐릭터의 핵심 스탯." },
  fhr: { label: "타격 회복 (FHR)", col: "필요 FHR", desc: "피격 후 경직에서 회복하는 프레임. 낮을수록 스턴락에 덜 걸림." },
};

export default function BreakpointsPage() {
  const [stat, setStat] = useState("fcr");
  const [calcCls, setCalcCls] = useState("Sorceress");
  const [input, setInput] = useState("");
  const s = STATS[stat];

  // 계산기: 선택 직업+스탯에서 보유 % 기준 현재/다음 브레이크포인트
  const cls = CLASSES.find((c) => c.en === calcCls);
  const rows = cls[stat];
  const val = Math.max(0, Number(input) || 0);
  let curIdx = 0;
  for (let i = 0; i < rows.length; i++) if (val >= rows[i][0]) curIdx = i;
  const cur = rows[curIdx];
  const next = rows[curIdx + 1];
  const showResult = input.trim() !== "";

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">프레임(FCR/FHR)</div>
          <h1 className="zname">직업별 브레이크포인트 · {s.label}</h1>
          <p className="zen">
            디아블로2 레저렉션은 25fps(초당 25프레임)로 동작합니다. 속도는 특정 임계값(브레이크포인트)에서만
            한 프레임씩 빨라지므로, 그 사이 수치는 낭비입니다. 각 프레임에 도달하는 <b>최소 %</b>만 표기했습니다.
          </p>
        </div>

        <div className="card bp-toolbar">
          <div className="bp-toggle">
            {Object.entries(STATS).map(([id, v]) => (
              <button
                key={id}
                className={`bp-pill ${stat === id ? "on" : ""}`}
                onClick={() => setStat(id)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="bp-desc">{s.desc}</p>
        </div>

        <div className="card bp-calc">
          <div className="bp-calc-title">브레이크포인트 계산기</div>
          <div className="bp-calc-classes">
            {CLASSES.map((c) => (
              <button
                key={c.en}
                className={`ti-chip ${calcCls === c.en ? "on" : ""}`}
                onClick={() => setCalcCls(c.en)}
              >
                {c.kr}
              </button>
            ))}
          </div>
          <div className="bp-calc-input">
            <label className="bp-calc-lbl">
              보유 {stat.toUpperCase()}
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="예) 105"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <span>%</span>
            </label>
            {showResult && (
              <div className="bp-calc-out">
                현재 <b className="bp-calc-frm">{cur[1]}프레임</b>
                <span className="bp-calc-dim"> ({cur[0]}% 구간)</span>
                {next ? (
                  <span className="bp-calc-next">
                    {" · "}다음 구간까지 <b>+{next[0] - val}%</b> → {next[1]}프레임 ({next[0]}%)
                  </span>
                ) : (
                  <span className="bp-calc-next"> · 최고 구간 도달 🎉</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bp-grid">
          {CLASSES.map((c) => {
            const isSel = c.en === calcCls;
            return (
              <div className={`bp-card ${isSel ? "bp-card-sel" : ""}`} key={c.en}>
                <div className="bp-cls">
                  {c.kr} <span className="bp-cls-en">{c.en}</span>
                </div>
                <table className="bp-table">
                  <thead>
                    <tr>
                      <th>{s.col}</th>
                      <th className="bp-th-f">프레임</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c[stat].map(([pct, frm]) => (
                      <tr
                        key={pct}
                        className={isSel && showResult && pct === cur[0] ? "bp-row-on" : ""}
                      >
                        <td className="bp-pct">{pct}%</td>
                        <td className="bp-frm">{frm}f</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <div className="note">
          <b>읽는 법</b> — 표의 %는 장비·스킬에서 얻은 <b>총합</b> 수치입니다. 해당 % <b>이상</b>이면 그 프레임에
          도달하고, 다음 구간 전까지는 더 올려도 프레임이 그대로입니다(예: 소서리스 FCR 63%든 104%든 똑같이 9프레임).
          <br />
          <b>FHR 주의</b> — 팔라딘·드루이드 등 일부 직업은 착용 무기(양손/창/지팡이)나 홀리 실드 여부에 따라 FHR 구간이
          달라집니다. 위 표는 기본(1H·일반 무기) 기준입니다.
          <br />
          <b>IAS(공격 속도)</b> — 공격 속도(IAS) 구간은 <b>무기 종류·무기 기본 속도(WSM)·스킬 애니메이션·광신
          (Fanaticism) 등 오라/스킬 보정</b>이 함께 얽혀 결정되므로, FCR/FHR처럼 하나의 정적 표로 만들 수 없습니다.
          실제 착용 무기와 스킬을 넣어{" "}
          <a href="https://d2.maxroll.gg/" target="_blank" rel="noopener"
            title="무기·스킬 조합별 IAS 프레임을 직접 계산">Maxroll D2 계산기 ↗</a>
          로 직접 확인하세요.
          <br />
          <b>출처</b> — 클래식 7개 직업: Maxroll.gg / 악마술사(Warlock): 3.0 패치 실측 표. 최신 3.2 기준.
        </div>
      </div>
    </main>
  );
}
