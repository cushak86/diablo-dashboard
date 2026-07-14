"use client";

import { useEffect, useMemo, useState } from "react";
import { RUNES } from "../../lib/cube";
import { RW } from "../../lib/runewords";
import { STATUS, planRuneword } from "../../lib/rune-planner";
import { schedulePush } from "../../lib/sync";

const LS_KEY = "runes:v1";
const MAX = 99; // 룬당 재고 상한(엔진은 안전정수까지 받지만 입력은 여기서 막는다)

const FILTERS = [
  ["ready", "즉시 제작"],
  ["cubable", "큐브로 가능"],
  ["short", "부족"],
];

export default function PlannerPage() {
  // 재고: {룬이름: 개수}. 초기 빈 객체 → SSR/클라 첫 렌더 일치(하이드레이션 안전), 마운트 후 로드.
  const [stock, setStock] = useState({});
  const [show, setShow] = useState({ ready: true, cubable: true, short: false });
  const [verifiedOnly, setVerifiedOnly] = useState(false); // 3.x 신규 7종 숨기기(기본 OFF = 전부 표시)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setStock(JSON.parse(raw));
    } catch {}
  }, []);

  const setCount = (name, n) => {
    const v = Math.max(0, Math.min(MAX, Number.isFinite(n) ? Math.floor(n) : 0));
    setStock((prev) => {
      const nx = { ...prev };
      if (v === 0) delete nx[name];
      else nx[name] = v;
      try { localStorage.setItem(LS_KEY, JSON.stringify(nx)); } catch {}
      schedulePush();
      return nx;
    });
  };

  const reset = () => {
    setStock({});
    try { localStorage.removeItem(LS_KEY); } catch {}
  };

  const results = useMemo(
    () => RW.map((rw) => ({ rw, ...planRuneword(rw, stock) })),
    [stock]
  );

  const counts = useMemo(() => ({
    ready: results.filter((r) => r.status === STATUS.READY).length,
    cubable: results.filter((r) => r.status === STATUS.CUBABLE).length,
    short: results.filter((r) => r.status === STATUS.SHORT).length,
  }), [results]);

  const visible = results.filter((r) => {
    if (verifiedOnly && r.rw.isNew) return false;
    if (r.status === STATUS.READY) return show.ready;
    if (r.status === STATUS.CUBABLE) return show.cubable;
    return show.short;
  });

  const total = Object.values(stock).reduce((a, b) => a + b, 0);

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">룬 재고 시뮬레이터</div>
          <h1 className="zname">내 룬으로 만들 수 있는 룬워드</h1>
          <p className="zen">
            가진 룬 개수를 넣으면 룬워드 99종을 <b>즉시 제작 / 큐브로 가능 / 부족</b>으로 갈라줍니다. 큐브 승급
            (하위 룬 여러 개 + 보석 → 상위 룬 1개)까지 계산하므로, <b>등급이 섞인 재고</b>도 그대로 판정합니다.
            재고는 이 브라우저에 저장됩니다.
          </p>
          <p className="zen rp-warn">
            ⚠ <b>각 룬워드는 단독 기준</b>입니다 — “이것 하나만 만든다면 가능한가”. 여러 개를 동시에 만들 수 있다는
            뜻이 아닙니다. (예: Ber 2개로 Infinity와 Last Wish가 각각 “즉시 제작”이어도, 둘 다 만들려면 Ber 3개가 필요합니다.)
          </p>
        </div>

        <div className="card">
          <div className="eyebrow blood">룬 재고 입력</div>
          <div className="rp-grid">
            {RUNES.map(([name], i) => {
              const v = stock[name] || 0;
              return (
                <div key={name} className={`rp-cell ${v > 0 ? "on" : ""}`}>
                  <div className="rp-cell-name">
                    <span className="rp-idx">{i + 1}</span> {name}
                  </div>
                  <div className="rp-stepper">
                    <button className="rp-btn" onClick={() => setCount(name, v - 1)} aria-label={`${name} 감소`}>−</button>
                    <input
                      className="rp-num"
                      type="number"
                      min="0"
                      max={MAX}
                      value={v}
                      onChange={(e) => setCount(name, parseInt(e.target.value, 10))}
                      aria-label={`${name} 개수`}
                    />
                    <button className="rp-btn" onClick={() => setCount(name, v + 1)} aria-label={`${name} 증가`}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rp-toolbar">
            <span className="rw-mtag">보유 룬 {total}개</span>
            <button className="chk-reset" onClick={reset}>재고 비우기</button>
          </div>
        </div>

        <div className="card">
          <div className="eyebrow gold">판정 결과</div>
          <div className="rp-toolbar">
            {FILTERS.map(([id, label]) => (
              <button
                key={id}
                className={`btn ${show[id] ? "btn-on" : "btn-off"}`}
                onClick={() => setShow((s) => ({ ...s, [id]: !s[id] }))}
              >
                {label} {counts[id]}
              </button>
            ))}
            <button
              className={`btn ${verifiedOnly ? "btn-on" : "btn-off"}`}
              onClick={() => setVerifiedOnly((v) => !v)}
              title="3.x 신규 룬워드는 룬 조합이 비공식이라 검증되지 않았습니다"
            >
              검증된 것만
            </button>
          </div>

          {total === 0 && <p className="zen">위에서 가진 룬을 입력하세요.</p>}

          {total > 0 && visible.length === 0 && (
            <p className="zen">
              표시할 결과가 없습니다 — 위 필터를 켜보세요. (즉시 제작 {counts.ready} · 큐브로 가능 {counts.cubable} ·
              부족 {counts.short})
            </p>
          )}

          <div className="rw-list">
            {visible.map(({ rw, status, missing, gems, consumed }) => (
              <div key={rw.en} className="rw-card">
                <div className="rw-head">
                  <div className="rw-name">
                    {rw.kr}
                    {rw.isNew && <span className="rw-newtag">NEW 3.x · 검증 필요</span>}
                  </div>
                  <div className="rw-kr">{rw.en}</div>
                  <span className={`rp-tag rp-${status.toLowerCase()}`}>
                    {status === STATUS.READY ? "즉시 제작" : status === STATUS.CUBABLE ? "큐브로 가능" : "부족"}
                  </span>
                </div>

                <div className="rw-runes">
                  {rw.runes.map((rune, i) => (
                    <span className="rw-rune" key={i}>{rune}</span>
                  ))}
                </div>

                {status === STATUS.SHORT && (
                  <div className="rw-meta">
                    {missing.map((m) => (
                      <span key={m.rune} className="rp-mtag-short">{m.rune} {m.count}개 부족</span>
                    ))}
                  </div>
                )}

                {status === STATUS.CUBABLE && (
                  <div className="rw-meta">
                    <span className="rw-mtag">
                      소비: {Object.entries(consumed).map(([n, c]) => `${n}×${c}`).join(" · ")}
                    </span>
                    {Object.entries(gems).map(([name, c]) => (
                      <span key={name} className="rp-mtag-gem">{name} {c}개</span>
                    ))}
                  </div>
                )}

                <div className="rw-meta">
                  <span className="rw-mtag">{rw.sockets}소켓</span>
                  <span className="rw-mtag">{rw.base}</span>
                  <span className="rw-mtag">clvl {rw.clvl}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="zen">
            <b>보석은 판정에 넣지 않습니다.</b> 큐브 승급에 필요한 보석 <i>이름과 개수</i>만 표시합니다 — 보석 재고를
            판정하려면 보석 등급 사다리 데이터가 필요한데, 이 대시보드에는 없습니다. 표시된 보석은 직접 확인하세요.
          </p>
        </div>
      </div>
    </main>
  );
}
