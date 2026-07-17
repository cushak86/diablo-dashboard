"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { runewordCubeCost } from "../../lib/cube";
import { RW } from "../../lib/runewords";
import { schedulePush } from "../../lib/sync";
import { indexOf, matches } from "../../lib/item-search";

const CATS = [
  ["all", "전체"], ["new", "신규 3.x"], ["weapon", "무기"], ["armor", "갑옷"], ["helm", "투구"], ["shield", "방패"],
];


// _aka = 옛 한국어 표기. 2026-07-17에 이름 정본을 diablo-mdb로 맞추며 37개가 바뀌었다(정신→영혼 등).
// 표시는 새 이름이지만 사용자는 옛 이름으로 검색하므로 도달 경로를 남긴다. 초성도 양쪽 다.
// extra = 룬 조합("TalThulOrtAmn") — 이 탭 고유 축이다. "talthul" 로도 찾힌다.
const AUG = RW.map((r) => ({
  ...r,
  ...indexOf(r, { kr: r.kr, en: r.en, aka: r.aka, extra: r.runes.join("") }),
}));

export default function RunewordsPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [toast, setToast] = useState("");
  const [openRW, setOpenRW] = useState(null);
  const [sort, setSort] = useState("default");
  const [favs, setFavs] = useState(() => new Set());
  const [favOnly, setFavOnly] = useState(false);
  const lastFocusRef = useRef(null);
  const dialogRef = useRef(null);

  function copy(text) {
    const done = () => {
      setToast(`"${text}" 복사됨`);
      setTimeout(() => setToast(""), 1400);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      done();
    }
  }

  // 즐겨찾기: 마운트 후 localStorage 로드(초기값이 빈 Set이라 SSR/클라 첫 렌더 일치 → 하이드레이션 안전).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fav:rw");
      if (raw) setFavs(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  function toggleFav(en) {
    setFavs((prev) => {
      const nx = new Set(prev);
      if (nx.has(en)) nx.delete(en);
      else nx.add(en);
      try { localStorage.setItem("fav:rw", JSON.stringify([...nx])); } catch {}
      schedulePush();
      return nx;
    });
  }

  function openTip(r, e) {
    lastFocusRef.current = e.currentTarget;
    setOpenRW(r);
  }

  useEffect(() => {
    if (openRW) {
      const onKey = (e) => {
        if (e.key === "Escape") setOpenRW(null);
      };
      document.addEventListener("keydown", onKey);
      dialogRef.current?.focus();
      return () => document.removeEventListener("keydown", onKey);
    }
    if (lastFocusRef.current) {
      lastFocusRef.current.focus();
      lastFocusRef.current = null;
    }
  }, [openRW]);

  const hits = useMemo(() => {
    const raw = query.trim();
    const arr = AUG.filter((r) => {
      if (favOnly && !favs.has(r.en)) return false;
      if (activeCat === "new" && !r.isNew) return false;
      if (activeCat !== "all" && activeCat !== "new" && !r.cats.includes(activeCat)) return false;
      return matches(r, raw);
    });
    if (sort === "level") arr.sort((a, b) => a.clvl - b.clvl);
    else if (sort === "sockets") arr.sort((a, b) => a.sockets - b.sockets);
    return arr;
  }, [query, activeCat, favOnly, favs, sort]);

  const cubeCost = openRW ? runewordCubeCost(openRW.runes) : null;

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">룬워드</div>
          <h1 className="zname">룬워드 조합 · 룬 순서/소켓/베이스</h1>
          <p className="zen">
            룬은 <b>정해진 순서</b>로, <b>정확한 소켓 수</b>의 지정 베이스에 넣어야 룬워드가 발동합니다. 순서가
            하나라도 틀리면 일반 소켓 아이템이 됩니다. 한글·영문·룬 이름(예: jah, ber)으로 검색하세요.
            <b> 카드를 누르면 인게임 전체 옵션을 툴팁으로 확인</b>할 수 있습니다.
          </p>
        </div>

        <div className="card ti-searchbar">
          <input
            className="ti-input"
            type="text"
            placeholder="검색: 예) 수수께끼, 무한, enigma, jahithber, ㅅㅅㄲ…"
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
          <div className="ti-sublbl">정렬 · 보기</div>
          <div className="ti-chips">
            {[["default", "기본"], ["level", "레벨↑"], ["sockets", "소켓↑"]].map(([id, label]) => (
              <div
                key={id}
                className={`ti-chip ${sort === id ? "on" : ""}`}
                onClick={() => setSort(id)}
              >
                {label}
              </div>
            ))}
            <div
              className={`ti-chip ${favOnly ? "on" : ""}`}
              onClick={() => setFavOnly((v) => !v)}
            >
              ★ 즐겨찾기만
            </div>
          </div>
          <div className="ti-count">{hits.length}개 룬워드</div>
        </div>

        <div className="rw-list">
          {hits.map((r) => (
            <div
              className="rw-card"
              key={r.en}
              role="button"
              tabIndex={0}
              aria-label={`${r.kr} ${r.en} 전체 옵션 보기`}
              onClick={(e) => openTip(r, e)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openTip(r, e);
                }
              }}
            >
              <div className="rw-head">
                <div className="rw-name">
                  {r.kr}
                  {r.isNew && <span className="rw-newtag">NEW 3.x</span>}
                </div>
                <div className="rw-kr">{r.en}</div>
                <button
                  type="button"
                  className={`rw-fav ${favs.has(r.en) ? "on" : ""}`}
                  aria-label={favs.has(r.en) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                  aria-pressed={favs.has(r.en)}
                  onClick={(e) => { e.stopPropagation(); toggleFav(r.en); }}
                >
                  {favs.has(r.en) ? "★" : "☆"}
                </button>
              </div>
              <div className="rw-runes">
                {r.runes.map((rune, i) => (
                  <span className="rw-rune" key={i}>{rune}</span>
                ))}
                <button
                  type="button"
                  className="rw-copy"
                  onClick={(e) => {
                    e.stopPropagation();
                    copy(r.runes.join(""));
                  }}
                >
                  복사
                </button>
              </div>
              <div className="rw-meta">
                <span className="rw-mtag">{r.sockets}소켓</span>
                <span className="rw-mtag">{r.base}</span>
                <span className="rw-mtag">Lv {r.clvl}</span>
              </div>
              <div className="rw-stat">{r.stat}</div>
              <div className="rw-more">전체 옵션 보기 ▸</div>
            </div>
          ))}
        </div>
        {hits.length === 0 && (
          <div className="ti-empty">검색 결과가 없습니다. 초성·띄어쓰기 없이 다시 시도해 보세요.</div>
        )}

        <div className="note">
          <b>수록 범위</b> — 악마술사의 군림(패치 3.0~3.2) 신규 룬워드 7종 + D2R 전체 클래식·래더 룬워드까지
          <b>총 99종</b>을 모두 수록했습니다. 룬 순서·소켓 수·베이스·요구 레벨을 정본 기준으로 정리했습니다.
          <br />
          <b>이름 표기</b> — <b>한글명(공식 클라이언트 표기)을 기준</b>으로 하고, 커뮤니티·거래에서 표준으로
          쓰이는 영문명을 보조로 함께 표기했습니다. 검색은 한글·영문·룬 이름 모두 지원합니다.
          <br />
          <b>주의</b> — 룬은 <b>왼쪽→오른쪽 순서 그대로</b> 소켓에 넣어야 합니다. 순서/소켓 수/베이스 종류가 하나라도
          다르면 발동하지 않습니다.
        </div>
      </div>

      {openRW && (
        <div className="rw-tip-overlay" onClick={() => setOpenRW(null)}>
          <div
            className="rw-tip"
            role="dialog"
            aria-modal="true"
            aria-label={`${openRW.kr} 룬워드 전체 옵션`}
            ref={dialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="rw-tip-close" aria-label="닫기" onClick={() => setOpenRW(null)}>
              ×
            </button>
            <div className="rw-tip-name">
              {openRW.kr}
              {openRW.isNew && " · NEW 3.x"}
            </div>
            <div className="rw-tip-kr">{openRW.en}</div>
            <div className="rw-tip-type">룬워드</div>
            <div className="rw-tip-base">{openRW.base} · {openRW.sockets}소켓</div>
            <div className="rw-tip-runes">
              {openRW.runes.map((rune, i) => (
                <span className="rw-rune" key={i}>{rune}</span>
              ))}
              <button type="button" className="rw-copy" onClick={() => copy(openRW.runes.join(""))}>복사</button>
            </div>
            <ul className="rw-tip-stats">
              {openRW.stats.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <div className="rw-tip-req">요구 레벨 {openRW.clvl}</div>
            {cubeCost && (
              <div className="rw-tip-cube">
                <div className="rw-tip-cube-hd">큐브 파밍 난이도</div>
                <div className="rw-tip-cube-line">
                  최고 룬 <span className="rw-rune">{cubeCost.highest}</span> · {cubeCost.fromRune}{" "}
                  <b>{cubeCost.runeCount.toLocaleString("en-US")}</b>개로 조합
                  {cubeCost.gems.length > 0 && (
                    <span className="rw-tip-cube-dim">
                      {" "}(+보석 {cubeCost.gems.reduce((s, g) => s + g.count, 0).toLocaleString("en-US")}개)
                    </span>
                  )}
                </div>
                <a className="ti-btn alt rw-tip-cube-link" href="/cube">큐브 조합기 열기 ↗</a>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="ti-toast show">{toast}</div>}
    </main>
  );
}
