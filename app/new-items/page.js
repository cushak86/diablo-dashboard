"use client";

import { useMemo, useState, useEffect } from "react";
import { ITEMS } from "../../lib/items";
import { krRuneText } from "../../lib/rune-names";
import { schedulePush } from "../../lib/sync";
import { indexOf, matches } from "../../lib/item-search";
import { UNIQUE_STATS } from "../../lib/unique-stats";
import ItemTip, { StatList } from "../components/ItemTip";

// 옵션은 그레일과 같은 축으로 조회한다 — grail-collect 가 `u:`·`s:`·`j:`·`c:` 접두로 id 를 만든다.
// 룬워드·조각상·소모품·베이스(34종)는 유니크가 아니라 옵션이 없다 — 그런 항목엔 버튼을 안 낸다.
const STAT_PREFIX = { unique: "u:", set: "s:", jewel: "j:", charm: "c:" };
const statsOf = (it) => {
  const p = STAT_PREFIX[it.cat];
  return p ? UNIQUE_STATS[`${p}${it.en}`] : null;
};

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
  const [openItem, setOpenItem] = useState(null);   // 옵션 모달로 연 항목

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
            aria-label="아이템 한글·영문 검색"
            className="ti-input"
            type="text"
            placeholder="검색: 예) 공허, ㅁㄴㄷ, 지옥파수꾼, dreadfang, 잠복하는…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="ti-chips">
            {CATS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`ti-chip ${activeCat === id ? "on" : ""}`}
                aria-pressed={activeCat === id}
                onClick={() => setActiveCat(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ti-sublbl">보기</div>
          <div className="ti-chips">
            <button
              type="button"
              className={`ti-chip ${favOnly ? "on" : ""}`}
              aria-pressed={favOnly}
              onClick={() => setFavOnly((v) => !v)}
            >
              ★ 즐겨찾기만
            </button>
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
                    {/* 이 페이지는 "트레더리 한→영 검색"이다. 한글로 찾아 영문명을 복사하는 것이 전부인데,
                        원래 <span onClick> 이라 그 동작만 키보드에서 사라져 있었다. aria-label 로
                        무엇을 복사하는지도 들리게 한다("복사" 72개가 전부 같은 이름이었다). */}
                    <button
                      type="button"
                      className="ti-copy"
                      aria-label={`${it.en} 복사`}
                      onClick={() => copy(it.en)}
                    >
                      복사
                    </button>
                  </div>
                  {/* meta 는 "룬워드 · Hel + Shael + Ral · 3소켓 갑옷" 형태다 — 룬 이름만 한글로 바꿔 보여준다.
                      lib/items.js 값은 그대로 둔다(검색 색인·Traderie 링크가 영문 원문에 묶여 있다). */}
                  <div className="ti-meta">{krRuneText(it.meta)}</div>
                  {/*
                    옵션을 서버 렌더 HTML 안에 둔다. 2026-08-09 이전에는 모달(ItemTip)에만 있었고
                    ItemTip 은 `if (!open) return null` 이라 옵션이 프리렌더 HTML 에 한 줄도
                    실리지 않았다 — 크롤러에게 이 페이지는 이름 목록일 뿐이었다.
                    네이티브 <details> 라 JS 0줄이고, 접혀 있어도 내용은 HTML 에 존재한다.
                    이 카드는 role="button" 래퍼가 아니라서(옵션 버튼이 따로 있다)
                    /runewords 와 달리 stopPropagation 이 필요 없다.
                  */}
                  {statsOf(it)?.length > 0 && (
                    <details className="ti-details">
                      <summary>전체 옵션 {statsOf(it).length}개</summary>
                      <ul className="ti-details-list">
                        {statsOf(it).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </details>
                  )}
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
                  {/* 옵션이 있는 항목만. 없는 걸 눌렀다 빈 창이 뜨는 게 최악이다. */}
                  {statsOf(it) && (
                    <button
                      type="button"
                      className="ti-btn alt"
                      aria-label={`${it.kr} 옵션 보기`}
                      onClick={() => setOpenItem(it)}
                    >
                      옵션
                    </button>
                  )}
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
      {/* 껍데기는 공용(app/components/ItemTip) — /grail·/runewords 와 같은 창이다. */}
      <ItemTip
        open={!!openItem}
        onClose={() => setOpenItem(null)}
        title={openItem?.kr}
        subtitle={openItem?.en}
        type={openItem ? CAT_LABEL[openItem.cat] : ""}
        footer="옵션은 D2R 공식 문자열 그대로입니다. 값이 굴러가는 항목은 범위로 표시됩니다."
      >
        {openItem?.meta && <div className="rw-tip-base">{openItem.meta}</div>}
        <StatList lines={openItem ? statsOf(openItem) : null} />
      </ItemTip>
      {toast && <div className="ti-toast show">{toast}</div>}
    </main>
  );
}
