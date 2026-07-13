"use client";

import { useMemo, useState, useEffect } from "react";
import { RW } from "../../lib/runewords";
import { ITEMS } from "../../lib/items";
import { RUNES } from "../../lib/cube";

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

// 수집 대상 = 신규 고유/세트(개별부위)/고유주얼/파괴부적 + 33룬 + 룬워드(99종).
// id는 카테고리 접두사로 네임스페이스(중복·충돌 방지). statue/base/misc(재료·소모품)와 세트헤더(slug=null)는 제외.
function buildCollect() {
  const out = [];
  ITEMS.forEach((it) => {
    if (it.cat === "unique") out.push({ id: `u:${it.en}`, kr: it.kr, en: it.en, cat: "unique" });
    else if (it.cat === "set" && it.slug) out.push({ id: `s:${it.en}`, kr: it.kr, en: it.en, cat: "set" });
    else if (it.cat === "jewel") out.push({ id: `j:${it.en}`, kr: it.kr, en: it.en, cat: "jewel" });
    else if (it.cat === "charm") out.push({ id: `c:${it.en}`, kr: it.kr, en: it.en, cat: "charm" });
  });
  RUNES.forEach(([n]) => out.push({ id: `rune:${n}`, kr: n, en: n, cat: "rune" }));
  RW.forEach((r) => out.push({ id: `rw:${r.en}`, kr: r.kr, en: r.en, cat: "rw" }));
  return out;
}

const COLLECT = buildCollect();
const AUG = COLLECT.map((x) => ({ ...x, _kr: norm(x.kr), _en: norm(x.en), _cho: chosung(x.kr) }));

const CATS = [
  ["all", "전체"], ["unique", "고유"], ["set", "세트"], ["jewel", "고유 주얼"],
  ["charm", "파괴 부적"], ["rune", "룬"], ["rw", "룬워드"],
];

function pct(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

export default function GrailPage() {
  const [collected, setCollected] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [todoOnly, setTodoOnly] = useState(false);

  // 수집 상태: 마운트 후 localStorage 로드(초기 빈 Set → SSR/클라 첫 렌더 일치 → 하이드레이션 안전).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("grail:v1");
      if (raw) setCollected(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  function toggle(id) {
    setCollected((prev) => {
      const nx = new Set(prev);
      if (nx.has(id)) nx.delete(id);
      else nx.add(id);
      try { localStorage.setItem("grail:v1", JSON.stringify([...nx])); } catch {}
      return nx;
    });
  }

  function reset() {
    if (typeof window !== "undefined" && !window.confirm("수집 기록을 모두 초기화할까요?")) return;
    setCollected(new Set());
    try { localStorage.removeItem("grail:v1"); } catch {}
  }

  const totals = useMemo(() => {
    const t = {};
    COLLECT.forEach((x) => { t[x.cat] = (t[x.cat] || 0) + 1; });
    return t;
  }, []);

  const doneByCat = useMemo(() => {
    const d = {};
    COLLECT.forEach((x) => { if (collected.has(x.id)) d[x.cat] = (d[x.cat] || 0) + 1; });
    return d;
  }, [collected]);

  const overallDone = useMemo(
    () => COLLECT.reduce((n, x) => n + (collected.has(x.id) ? 1 : 0), 0),
    [collected]
  );

  const hits = useMemo(() => {
    const raw = query.trim();
    const nq = norm(raw);
    const isCho = /^[ㄱ-ㅎ]+$/.test(raw.replace(/\s/g, ""));
    return AUG.filter((x) => {
      if (todoOnly && collected.has(x.id)) return false;
      if (activeCat !== "all" && x.cat !== activeCat) return false;
      if (!nq && !isCho) return true;
      if (isCho) return x._cho.includes(raw.replace(/\s/g, ""));
      return x._kr.includes(nq) || x._en.includes(nq);
    });
  }, [query, activeCat, todoOnly, collected]);

  const shownCats = CATS.filter(([id]) => id !== "all" && (activeCat === "all" || activeCat === id));
  const overallPct = pct(overallDone, COLLECT.length);

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">홀리 그레일</div>
          <h1 className="zname">악마술사의 군림 수집 트래커</h1>
          <p className="zen">
            신규 고유·세트·주얼·파괴 부적과 33룬, 룬워드 수집을 체크하세요. 진행률은 카테고리별·전체로 집계되며
            이 브라우저에 저장됩니다(로그인 불필요). 한글·초성·영문 검색을 지원합니다.
          </p>
        </div>

        <div className="card">
          <div className="pbar-top">
            <span>전체 수집 진행률</span>
            <span><b className="chk-pct">{overallPct}%</b> · {overallDone} / {COLLECT.length}</span>
          </div>
          <div className="pbar"><span style={{ width: `${overallPct}%` }} /></div>
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
