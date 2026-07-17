"use client";

import { useMemo, useState, useEffect } from "react";
import { ITEMS } from "../../lib/items";
import { schedulePush } from "../../lib/sync";
import { indexOf, matches } from "../../lib/item-search";

const TRADERIE_BASE = "https://traderie.com/diablo2resurrected";

const CATS = [
  ["all", "전체"], ["rw", "룬워드"], ["unique", "고유"], ["jewel", "고유 주얼"],
  ["set", "세트"], ["statue", "고대인 조각상"], ["charm", "파괴 부적"], ["base", "마법서 베이스"], ["misc", "세계석 조각"],
];
const CAT_LABEL = { rw: "룬워드", unique: "고유", jewel: "주얼", set: "세트", statue: "조각상", charm: "부적", base: "베이스", misc: "소모품" };


// 이 파일은 별칭 필드명이 `alias` 다(/grail·/runewords 는 `aka`). 공용 모듈이 필드명을 강제하지 않아
// 각자 자기 이름으로 넘긴다 — 데이터 파일을 건드리지 않으려는 것이다(en 은 사용자 즐겨찾기 키다).
const AUG_ITEMS = ITEMS.map((it) => ({
  ...it,
  ...indexOf(it, { kr: it.kr, en: it.en, aka: it.alias }),
}));

export default function NewItemsPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [toast, setToast] = useState("");
  const [favs, setFavs] = useState(() => new Set());
  const [favOnly, setFavOnly] = useState(false);

  // 즐겨찾기: 마운트 후 localStorage 로드(초기값 빈 Set → 하이드레이션 안전).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fav:ni");
      if (raw) setFavs(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  function toggleFav(en) {
    setFavs((prev) => {
      const nx = new Set(prev);
      if (nx.has(en)) nx.delete(en);
      else nx.add(en);
      try { localStorage.setItem("fav:ni", JSON.stringify([...nx])); } catch {}
      schedulePush();
      return nx;
    });
  }

  const hits = useMemo(() => {
    const raw = query.trim();
    return AUG_ITEMS.filter((it) => {
      if (favOnly && !favs.has(it.en)) return false;
      if (activeCat !== "all" && it.cat !== activeCat) return false;
      return matches(it, raw);
    });
  }, [query, activeCat, favOnly, favs]);

  function copy(en) {
    const done = () => {
      setToast(`"${en}" 복사됨`);
      setTimeout(() => setToast(""), 1400);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(en).then(done).catch(done);
    } else {
      done();
    }
  }

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">신규 아이템</div>
          <h1 className="zname">악마술사의 군림 신규 아이템 · 트레더리 검색기</h1>
          <p className="zen">
            트레더리(Traderie)에서 한글 검색이 안 되는 확장팩·래더 13/14 신규 아이템의 한글명 → 영문명 변환 + 거래
            링크. 한글명 · 초성(ㄱㅎ) · 영문명 모두 검색 가능 — 영문명을 클릭하면 복사됩니다.
          </p>
        </div>

        <div className="card ti-searchbar">
          <input
            className="ti-input"
            type="text"
            placeholder="검색: 예) 공허, ㅁㄴㄷ, 지옥파수꾼, dreadfang, 잠복하는…"
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
            <div
              className={`ti-chip ${favOnly ? "on" : ""}`}
              onClick={() => setFavOnly((v) => !v)}
            >
              ★ 즐겨찾기만
            </div>
          </div>
          <div className="ti-count">{hits.length}개 아이템</div>
        </div>

        <div className="ti-list">
          {hits.map((it) => {
            const prod = it.slug ? `${TRADERIE_BASE}/product/${it.slug}` : null;
            const srch = `${TRADERIE_BASE}/products?search=${encodeURIComponent(it.en)}`;
            return (
              <div className="ti-card" key={it.en}>
                <div className="ti-names">
                  <div className={`ti-kr ti-${it.cat}`}>
                    {it.kr} <span className={`ti-tag ti-tag-${it.cat}`}>{CAT_LABEL[it.cat]}</span>
                  </div>
                  <div className="ti-en">
                    {it.en}
                    <span className="ti-copy" onClick={() => copy(it.en)}>
                      복사
                    </span>
                  </div>
                  <div className="ti-meta">{it.meta}</div>
                </div>
                <div className="ti-links">
                  <button
                    type="button"
                    className={`ti-fav ${favs.has(it.en) ? "on" : ""}`}
                    aria-label={favs.has(it.en) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                    aria-pressed={favs.has(it.en)}
                    onClick={() => toggleFav(it.en)}
                  >
                    {favs.has(it.en) ? "★" : "☆"}
                  </button>
                  {prod && (
                    <a className="ti-btn" href={prod} target="_blank" rel="noopener">
                      트레더리 ↗
                    </a>
                  )}
                  <a className="ti-btn alt" href={srch} target="_blank" rel="noopener">
                    검색 ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        {hits.length === 0 && (
          <div className="ti-empty">검색 결과가 없습니다. 초성·띄어쓰기 없이 다시 시도해 보세요.</div>
        )}

        <div className="note">
          <b>사용법</b> — 한글로 검색 → [트레더리] 버튼으로 해당 아이템 거래 페이지 이동, 또는 영문명을 복사해
          트레더리 검색창에 붙여넣기. 개별 페이지 링크가 없는 아이템은 [검색] 버튼(영문명 검색 결과)을
          이용하세요.
          <br />
          <b>범위</b> — 악마술사의 군림(패치 3.0, 래더 13) 신규 아이템 전체. 래더 14(패치 3.2)는 밸런스 패치로
          신규 거래 아이템 추가가 없어 이 목록이 최신입니다.
          <br />
          <b>참고</b> — 광기(Mania)/히스테리아(Hysteria)는 기존 룬워드 허슬(Hustle)의 무기/갑옷 버전이 개명된
          것입니다. 한글명은 공식 한국어 클라이언트 표기 기준입니다.
        </div>
      </div>
      {toast && <div className="ti-toast show">{toast}</div>}
    </main>
  );
}
