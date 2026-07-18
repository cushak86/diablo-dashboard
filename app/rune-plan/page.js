"use client";

import { useEffect, useMemo, useState } from "react";
import { RUNES } from "../../lib/cube";
import { RW } from "../../lib/runewords";
import { STATUS, suggest, sanitizeStock } from "../../lib/rune-planner";

const LS_KEY = "runes:v1"; // 룬 재고 탭(/planner)과 공유하는 저장소

export default function RunePlanPage() {
  // 재고: {룬이름: 개수}. 초기 빈 객체 → SSR/클라 첫 렌더 일치(하이드레이션 안전), 마운트 후 로드.
  // 이 탭은 재고를 읽기만 한다 — 입력은 /planner. 룬 칩 클릭은 재고가 아니라 "역참조 선택"이다.
  const [stock, setStock] = useState({});
  const [sel, setSel] = useState(null); // 선택된 룬 이름(역참조). null = 추천 모드.

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setStock(sanitizeStock(JSON.parse(raw)));
    } catch {}
  }, []);

  const owned = useMemo(
    () => new Set(Object.keys(stock).filter((k) => stock[k] > 0)),
    [stock]
  );
  const total = Object.values(stock).reduce((a, b) => a + b, 0);

  const rows = useMemo(() => suggest(RW, stock), [stock]);

  // 추천 모드: 완성·큐브가능은 항상, 부족은 recipe에 내 룬이 든 것만(먼 목표 소음 제거).
  // 역참조 모드: 그 룬을 쓰는 룬워드 전체(보유 무관 — "이 룬 어디 써?" 플래닝).
  const visible = useMemo(() => {
    if (sel) return rows.filter((r) => r.rw.runes.includes(sel));
    return rows.filter(
      (r) => r.status !== STATUS.SHORT || r.rw.runes.some((x) => owned.has(x))
    );
  }, [rows, sel, owned]);

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">룬 추천</div>
          <h1 className="zname">내 룬으로 완성에 가까운 룬워드</h1>
          <p className="zen">
            <b>룬 재고</b> 탭에 넣은 룬을 기준으로, 완성에 가까운 룬워드부터 보여줍니다. 아래에서 <b>룬을 누르면</b> 그
            룬을 쓰는 룬워드만 골라 볼 수 있습니다 (“이 룬 어디 써?”). 재고는 룬 재고 탭과 공유됩니다.
          </p>
          {total === 0 && (
            <p className="zen rp-warn">
              아직 재고가 없습니다. <a className="rp-golink" href="/planner">룬 재고 입력하러 가기 →</a>{" "}
              (룬을 누르면 추천은 못 봐도 “이 룬 어디 써?”는 지금도 확인됩니다.)
            </p>
          )}
        </div>

        <div className="card">
          <div className="eyebrow blood">룬 선택 (역참조)</div>
          <p className="zen rp-hint">
            {sel ? (
              <>선택: <b>{sel}</b> — 다시 누르면 해제하고 추천으로 돌아갑니다.</>
            ) : (
              <>보유한 룬은 강조됩니다. 룬을 눌러 그 룬을 쓰는 룬워드만 보세요.</>
            )}
          </p>
          <div className="rw-runes">
            {RUNES.map(([name]) => {
              const cnt = stock[name] || 0;
              const cls = `rw-rune rs-chip ${cnt > 0 ? "has" : ""} ${sel === name ? "on" : ""}`;
              return (
                <button
                  key={name}
                  type="button"
                  className={cls}
                  aria-pressed={sel === name}
                  onClick={() => setSel((s) => (s === name ? null : name))}
                >
                  {name}
                  {cnt > 0 && <b>{cnt}</b>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="eyebrow gold">
            {sel ? `‘${sel}’ 룬을 쓰는 룬워드` : "가까운 목표 추천"} · {visible.length}종
          </div>

          {!sel && total === 0 && (
            <p className="zen">룬 재고를 입력하면 추천이 나타납니다.</p>
          )}
          {!sel && total > 0 && visible.length === 0 && (
            <p className="zen">보유한 룬을 쓰는 룬워드가 없습니다. 룬을 더 모아보세요.</p>
          )}
          {sel && visible.length === 0 && (
            <p className="zen">이 룬을 쓰는 룬워드가 없습니다.</p>
          )}

          <div className="rw-list">
            {visible.map(({ rw, status, missing, shortCount }) => (
              <div key={rw.en} className="rw-card">
                <div className="rw-head">
                  <div className="rw-name">
                    {rw.kr}
                    {rw.isNew && <span className="rw-newtag">NEW 3.x</span>}
                  </div>
                  <div className="rw-kr">{rw.en}</div>
                  <span className={`rp-tag rp-${status.toLowerCase()}`}>
                    {status === STATUS.READY
                      ? "완성"
                      : status === STATUS.CUBABLE
                      ? "큐브로 가능"
                      : `${shortCount}개 남음`}
                  </span>
                </div>

                <div className="rw-runes">
                  {rw.runes.map((rune, i) => (
                    <span
                      className={`rw-rune ${owned.has(rune) ? "have" : ""} ${sel === rune ? "on" : ""}`}
                      key={i}
                    >
                      {rune}
                    </span>
                  ))}
                </div>

                {status === STATUS.SHORT && (
                  <div className="rw-meta">
                    {missing.map((m) => (
                      <span key={m.rune} className="rp-mtag-short">{m.rune} {m.count}개 부족</span>
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
            <b>각 룬워드는 단독 기준</b>입니다 — “이것 하나만 만든다면 가능한가”. 여러 개를 동시에 만들 수 있다는 뜻은
            아닙니다. 큐브 승급(하위 룬 + 보석 → 상위 룬)까지 계산합니다. 상세 판정·소비 보석은 <a className="rp-golink" href="/planner">룬 재고</a> 탭을 보세요.
          </p>
        </div>
      </div>
    </main>
  );
}
