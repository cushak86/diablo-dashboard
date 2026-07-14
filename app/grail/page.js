"use client";

import { useMemo, useState, useEffect } from "react";
import { COLLECT, scopeOf } from "../../lib/grail-collect";
import { loadState, persist, inScope, SCOPES } from "../../lib/grail-store";
import { schedulePush } from "../../lib/sync";

const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
function chosung(s) {
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) out += CHO[Math.floor((c - 0xac00) / 588)];
  }
  return out;
}
function norm(s) {
  return (s || "").toLowerCase().replace(/['’\-\s·()]/g, "");
}

const AUG = COLLECT.map((x) => ({ ...x, _kr: norm(x.kr), _en: norm(x.en), _cho: chosung(x.kr) }));

const CATS = [
  ["all", "전체"], ["unique", "고유"], ["set", "세트"], ["jewel", "고유 주얼"],
  ["charm", "파괴 부적"], ["rune", "룬"], ["rw", "룬워드"],
];

function pct(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

const SCOPE_LABEL = { new: "3.x 신규", classic: "클래식", all: "전체" };

export default function GrailPage() {
  const [collected, setCollected] = useState(() => new Set());
  const [scope, setScope] = useState("new");     // 기본 new — 기존 사용자의 화면·진행률이 그대로 유지된다
  const [readOnly, setReadOnly] = useState(false);
  const [noticeSeen, setNoticeSeen] = useState(true);  // 마운트 전엔 안내를 띄우지 않는다
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [todoOnly, setTodoOnly] = useState(false);

  // 마운트 후 로드(SSR/클라 첫 렌더 일치 → 하이드레이션 안전).
  // grail-store가 v1→v2 승격·구버전 재합류·미래버전 방어를 처리한다.
  useEffect(() => {
    const st = loadState(read, scopeOf);
    setCollected(st.ids);
    setScope(st.scope);
    setReadOnly(!!st.readOnly);
    setNoticeSeen(!!st.noticeSeen);
    if (!st.readOnly) persist(write, st, scopeOf);  // 승격·재합류 결과를 즉시 고정
  }, []);

  function save(ids, nextScope = scope, seen = noticeSeen) {
    persist(write, { ids, scope: nextScope, noticeSeen: seen, readOnly }, scopeOf);
    schedulePush();
  }

  function toggle(id) {
    if (readOnly) return;
    setCollected((prev) => {
      const nx = new Set(prev);
      if (nx.has(id)) nx.delete(id);
      else nx.add(id);
      save(nx);
      return nx;
    });
  }

  function changeScope(next) {
    setScope(next);
    setNoticeSeen(true);
    save(collected, next, true);
  }

  function dismissNotice() {
    setNoticeSeen(true);
    save(collected, scope, true);
  }

  function reset() {
    if (readOnly) return;
    if (typeof window !== "undefined" && !window.confirm("수집 기록을 모두 초기화할까요?")) return;
    const empty = new Set();
    setCollected(empty);
    save(empty);
  }

  // 표시되는 모든 수치는 **이 하나의 필터 결과**에서 파생한다.
  // (예전에는 totals·doneByCat이 전역 COLLECT를 순회해, 클래식을 합치면 신규 화면의 분모까지 오염됐다.)
  const visible = useMemo(() => COLLECT.filter((x) => inScope(x.scope, scope)), [scope]);

  const totals = useMemo(() => {
    const t = {};
    visible.forEach((x) => { t[x.cat] = (t[x.cat] || 0) + 1; });
    return t;
  }, [visible]);

  const doneByCat = useMemo(() => {
    const d = {};
    visible.forEach((x) => { if (collected.has(x.id)) d[x.cat] = (d[x.cat] || 0) + 1; });
    return d;
  }, [visible, collected]);

  const overallDone = useMemo(
    () => visible.reduce((n, x) => n + (collected.has(x.id) ? 1 : 0), 0),
    [visible, collected]
  );

  const hits = useMemo(() => {
    const raw = query.trim();
    const nq = norm(raw);
    const isCho = /^[ㄱ-ㅎ]+$/.test(raw.replace(/\s/g, ""));
    return AUG.filter((x) => {
      if (!inScope(x.scope, scope)) return false;
      if (todoOnly && collected.has(x.id)) return false;
      if (activeCat !== "all" && x.cat !== activeCat) return false;
      if (!nq && !isCho) return true;
      if (isCho) return x._cho.includes(raw.replace(/\s/g, ""));
      return x._kr.includes(nq) || x._en.includes(nq);
    });
  }, [query, activeCat, todoOnly, collected, scope]);

  const shownCats = CATS.filter(([id]) => id !== "all" && (activeCat === "all" || activeCat === id));
  const overallPct = pct(overallDone, visible.length);
  // 보조 지표: scope !== "all"일 때만. all이면 위 줄과 같은 값이라 중복이다.
  const allDone = useMemo(() => COLLECT.reduce((n, x) => n + (collected.has(x.id) ? 1 : 0), 0), [collected]);
  const hasClassicUnchecked = scope === "new" && !noticeSeen;

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">홀리 그레일</div>
          <h1 className="zname">악마술사의 군림 수집 트래커</h1>
          <p className="zen">
            신규 고유·세트·주얼·파괴 부적과 33룬, 룬워드에 더해 <b>클래식 고유 385 · 세트 부위 127</b>까지 체크할 수
            있습니다. 진행률은 <b>선택한 범위</b> 기준으로 집계되며 이 브라우저에 저장됩니다(로그인 불필요).
            한글·초성·영문 검색을 지원합니다.
          </p>
          {readOnly && (
            <p className="zen gr-warn">
              ⚠ 이 브라우저에 저장된 수집 기록이 <b>더 최신 버전</b>입니다. 데이터를 보호하기 위해 편집을 막았습니다 —
              페이지를 새로고침해 주세요.
            </p>
          )}
          {hasClassicUnchecked && (
            <p className="zen gr-notice">
              ✦ <b>클래식 항목이 추가됐습니다</b> — 고유 385종·세트 부위 127종. 지금 화면은 예전과 동일한
              <b> 3.x 신규</b> 범위입니다. 아래에서 범위를 바꿔 보세요.{" "}
              <button className="chk-reset" onClick={dismissNotice}>알겠습니다</button>
            </p>
          )}
        </div>

        <div className="card">
          <div className="rp-toolbar">
            {SCOPES.map((sc) => (
              <button
                key={sc}
                className={`btn ${scope === sc ? "btn-on" : "btn-off"}`}
                onClick={() => changeScope(sc)}
              >
                {SCOPE_LABEL[sc]}
              </button>
            ))}
          </div>
          <div className="pbar-top">
            <span>{SCOPE_LABEL[scope]} 수집 진행률</span>
            <span><b className="chk-pct">{overallPct}%</b> · {overallDone} / {visible.length}</span>
          </div>
          <div className="pbar"><span style={{ width: `${overallPct}%` }} /></div>
          {scope !== "all" && (
            <div className="gr-sub">모든 항목 기준 {pct(allDone, COLLECT.length)}% · {allDone} / {COLLECT.length}</div>
          )}
        </div>

        <div className="card ti-searchbar">
          <input
            className="ti-input"
            type="text"
            placeholder="검색: 예) 공허, ㅁㄴㄷ, enigma, Ber…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="ti-chips">
            {CATS.map(([id, label]) => (
              <div
                key={id}
                className={`ti-chip ${activeCat === id ? "on" : ""}`}
                onClick={() => setActiveCat(id)}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="ti-sublbl">보기</div>
          <div className="ti-chips">
            <div className={`ti-chip ${todoOnly ? "on" : ""}`} onClick={() => setTodoOnly((v) => !v)}>
              미수집만
            </div>
            <button type="button" className="chk-reset" onClick={reset}>기록 초기화</button>
          </div>
          <div className="ti-count">{hits.length}개 표시</div>
        </div>

        {shownCats.map(([id, label]) => {
          const items = hits.filter((x) => x.cat === id);
          if (!items.length) return null;
          const d = doneByCat[id] || 0;
          const t = totals[id] || 0;
          return (
            <div className="card chk-sec" key={id}>
              <div className="chk-sec-hd">
                <div className="chk-sec-name">{label}</div>
                <div className="chk-sec-count">{d} / {t} · {pct(d, t)}%</div>
              </div>
              <div className="pbar"><span style={{ width: `${pct(d, t)}%` }} /></div>
              <div className="grail-grid">
                {items.map((x) => {
                  const on = collected.has(x.id);
                  return (
                    <button
                      type="button"
                      key={x.id}
                      className={`chk ${on ? "on" : ""}`}
                      aria-pressed={on}
                      onClick={() => toggle(x.id)}
                    >
                      <span className="chk-box">✓</span>
                      <span className="chk-main">
                        <span className="chk-kr">{x.kr}</span>
                        {x.en !== x.kr && <span className="chk-sub">{x.en}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {hits.length === 0 && (
          <div className="ti-empty">표시할 항목이 없습니다. 필터·검색을 조정해 보세요.</div>
        )}

        <div className="note">
          <b>수록 범위</b> — 악마술사의 군림 신규 고유·세트·주얼·파괴 부적, 33룬, 룬워드 목록을
          커뮤니티 자료 기반으로 정리했습니다(<b>비공식 · 검증 필요</b>). 클래식 전체 고유/세트는
          현재 데이터셋에 없어 제외했으며, 수치·수록 항목은 갱신될 수 있습니다.
        </div>
      </div>
    </main>
  );
}
