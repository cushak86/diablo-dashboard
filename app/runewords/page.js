"use client";

import { useMemo, useState, useEffect } from "react";
import { runewordCubeCost } from "../../lib/cube";
import { runeLabel } from "../../lib/rune-names";
import { RW } from "../../lib/runewords";
import { schedulePush } from "../../lib/sync";
import { indexOf, matches } from "../../lib/item-search";
import ItemTip, { StatList } from "../components/ItemTip";

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

  // ESC·포커스 복귀·오버레이는 ItemTip 이 처리한다 — 여기서 또 하면 리스너가 이중으로 붙는다.
  const openTip = (r) => setOpenRW(r);

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
            aria-label="룬워드 검색"
            className="ti-input"
            type="text"
            placeholder="검색: 예) 수수께끼, 무한, enigma, jahithber, ㅅㅅㄲ…"
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
          <div className="ti-sublbl">정렬 · 보기</div>
          <div className="ti-chips">
            {[["default", "기본"], ["level", "레벨↑"], ["sockets", "소켓↑"]].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`ti-chip ${sort === id ? "on" : ""}`}
                aria-pressed={sort === id}
                onClick={() => setSort(id)}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              className={`ti-chip ${favOnly ? "on" : ""}`}
              aria-pressed={favOnly}
              onClick={() => setFavOnly((v) => !v)}
            >
              ★ 즐겨찾기만
            </button>
          </div>
          <div className="ti-count">{hits.length}개 룬워드</div>
        </div>

        {/*
          카드에서 role="button" 을 뺐다(2026-08-09).
          ARIA 에서 button 은 자손이 표현적(presentational)으로 취급되는 역할이라, 그 안에 넣은
          details 99개의 옵션이 스크린리더에 통째로 노출되지 않았다 — 같은 날 오전에 "옵션을
          서버 렌더 HTML 로 끌어냈다"고 커밋해 놓고 정작 보조기술 사용자에게는 여전히 없는
          상태였다. 크롤러만 보고 사람을 안 본 것이다. (button 안에 대화형 요소를 두는 것 자체가
          HTML 상 허용되지 않기도 하다.) 모달은 카드 아래 명시적 버튼으로 연다 — 카드 전체 클릭이라는
          편의는 잃지만 같은 정보가 details 로 카드 안에 이미 있으므로 실질 손실이 없다.
          **여기에 role="button" 을 다시 넣지 마라.**
        */}
        <div className="rw-list">
          {hits.map((r) => (
            <div className="rw-card" key={r.en}>
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
                  <span className="rw-rune" key={i}>{runeLabel(rune)}</span>
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
              {/*
                전체 옵션을 **서버 렌더 HTML 안에** 둔다. 2026-08-09 이전에는 모달(ItemTip)에만 있었고
                ItemTip 은 `if (!open) return null` 이라, 룬워드 99개의 옵션이 프리렌더 HTML 에
                한 줄도 실리지 않았다. 크롤러에게 이 페이지는 한 줄 요약(r.stat)만 있는 목록이었다.
                네이티브 <details> 라 JS 0줄이고, 접힌 상태여도 내용은 HTML 에 존재한다.
                모달은 그대로 둔다 — 넓은 화면에서 더 편하다.

                ⚠️ stopPropagation 필수: 이 카드가 role="button" + onClick(모달 열기) 래퍼라
                   summary 클릭이 모달까지 함께 연다(rw-fav·rw-copy 가 같은 이유로 이미 쓰고 있다).
                   키보드 조작도 같은 이유로 막는다 — Enter/Space 가 카드 핸들러로 올라가면
                   details 가 열리는 동시에 모달이 뜬다.
              */}
              {r.stats?.length > 0 && (
                <details className="rw-details">
                  {/* 카드가 더는 role=button 이 아니므로 stopPropagation 이 필요 없다 —
                      클릭이 올라갈 상위 핸들러 자체가 없어졌다. */}
                  <summary>전체 옵션 {r.stats.length}개</summary>
                  <ul className="rw-details-list">
                    {r.stats.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </details>
              )}
              <button
                type="button"
                className="rw-more"
                aria-label={`${r.kr} ${r.en} 옵션 큰 화면으로 보기`}
                onClick={() => openTip(r)}
              >
                큰 화면으로 보기 ▸
              </button>
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

      {/* 껍데기는 공용(app/components/ItemTip) — ESC·포커스 복귀·오버레이가 거기 있다.
          속은 이 탭 고유다: 룬 조합·복사·큐브 파밍 난이도. footer 를 안 쓰는 이유는
          요구 레벨 **뒤에** 큐브 블록이 와야 해서다(footer 는 항상 마지막이다). */}
      <ItemTip
        open={!!openRW}
        onClose={() => setOpenRW(null)}
        title={openRW ? `${openRW.kr}${openRW.isNew ? " · NEW 3.x" : ""}` : ""}
        subtitle={openRW?.en}
        type="룬워드"
      >
        {openRW && (
          <>
            <div className="rw-tip-base">{openRW.base} · {openRW.sockets}소켓</div>
            <div className="rw-tip-runes">
              {openRW.runes.map((rune, i) => (
                <span className="rw-rune" key={i}>{runeLabel(rune)}</span>
              ))}
              <button type="button" className="rw-copy" onClick={() => copy(openRW.runes.join(""))}>복사</button>
            </div>
            <StatList lines={openRW.stats} />
            <div className="rw-tip-req">요구 레벨 {openRW.clvl}</div>
            {cubeCost && (
              <div className="rw-tip-cube">
                <div className="rw-tip-cube-hd">큐브 파밍 난이도</div>
                <div className="rw-tip-cube-line">
                  최고 룬 <span className="rw-rune">{runeLabel(cubeCost.highest)}</span> · {runeLabel(cubeCost.fromRune)}{" "}
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
          </>
        )}
      </ItemTip>

      {toast && <div className="ti-toast show">{toast}</div>}
    </main>
  );
}
