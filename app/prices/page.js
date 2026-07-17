"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { CATALOG, RUNE_UNITS } from "../../lib/price-catalog";
import { getBaseline, BASELINE, AS_OF, STALE_MONTHS, monthsSinceAsOf } from "../../lib/price-baseline";
import { indexOf, matches } from "../../lib/item-search";

const TIER_RANK = { S: 0, A: 1, B: 2, C: 3, D: 4, HR: 5 };


const AUG = CATALOG.map((c) => ({ ...c, ...indexOf(c, { kr: c.kr, en: c.en }) }));
// 기준선 표도 같은 인덱스를 쓴다 — 예전엔 검색할 때마다 norm/chosung 을 다시 계산했다.
const AUG_BASE = BASELINE.map((b) => ({ ...b, ...indexOf(b, { kr: b.kr, en: b.en }) }));

function fmtAgo(t) {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}

export default function PricesPage() {
  // 기준선 나이. 렌더 중 new Date()를 부르면 SSR/CSR 값이 갈려 하이드레이션이 깨진다 → 마운트 후 계산.
  const [staleMonths, setStaleMonths] = useState(null);
  useEffect(() => setStaleMonths(monthsSinceAsOf()), []);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null); // {key, kr, en}
  const [data, setData] = useState(null); // GET 응답
  const [loading, setLoading] = useState(false);

  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [hp, setHp] = useState(""); // 허니팟
  const [msg, setMsg] = useState(null); // {type, text}
  const [busy, setBusy] = useState(false);
  const detailRef = useRef(null);

  // 아이템 선택 시 상세/제보 패널로 스크롤 — 긴 검색 그리드 아래에 렌더되므로 화면 밖 방지.
  useEffect(() => {
    if (selected && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selected]);

  const hits = useMemo(() => {
    const raw = query.trim();
    if (!raw) return AUG.slice(0, 40);
    return AUG.filter((x) => matches(x, raw)).slice(0, 60);
  }, [query]);

  const baseline = useMemo(() => (selected ? getBaseline(selected.key) : null), [selected]);

  // 기준선 시세표(항상 표시) — 검색어로 필터, 티어순 정렬. 선택 불필요하게 지표를 노출.
  const baseHits = useMemo(() => {
    const raw = query.trim();
    const arr = AUG_BASE.filter((b) => matches(b, raw));
    return [...arr].sort((a, b) => (TIER_RANK[a.tier] ?? 9) - (TIER_RANK[b.tier] ?? 9));
  }, [query]);

  async function load(key) {
    setLoading(true);
    setData(null);
    try {
      const r = await fetch(`/api/price?itemKey=${encodeURIComponent(key)}`);
      setData(await r.json());
    } catch {
      setData({ units: [], total: 0, recent: [], redis: false });
    } finally {
      setLoading(false);
    }
  }

  function pick(item) {
    setSelected(item);
    setMsg(null);
    setPrice("");
    setNote("");
    setUnit("");
    load(item.key);
  }

  async function submit(e) {
    e.preventDefault();
    if (!selected || busy) return;
    if (!unit) return setMsg({ type: "err", text: "단위(룬)를 선택해 주세요." });
    if (!price) return setMsg({ type: "err", text: "가격을 입력해 주세요." });
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey: selected.key, unit, price: Number(price), note, website: hp }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        setMsg({ type: "ok", text: "제보 감사합니다! 집계에 반영됩니다." });
        setPrice("");
        setNote("");
        load(selected.key);
      } else {
        setMsg({ type: "err", text: j.error || "제보에 실패했습니다." });
      }
    } catch {
      setMsg({ type: "err", text: "네트워크 오류로 제보에 실패했습니다." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">시세 지수</div>
          <h1 className="zname">아이템 시세 지수 · 익명 제보</h1>
          <p className="zen">
            아이템을 검색해 커뮤니티 제보 기반 <b>룬 단위 중앙값</b>을 확인하고, 직접 시세를 제보하세요. 제보는
            <b> 익명</b>이며 로그인이 필요 없습니다. 중앙값은 룬 종류별로 따로 집계되고, 이상치는 제외됩니다. 표본이
            3건 미만이면 참고용 표시만 제공됩니다 — 수치는 <b>비공식·참고용</b>입니다. 아래 <b>기준선 시세표</b>는
            주요·고가 아이템의 스탠다드·래더 시즌 초 대략 값어치(고룬 단위)를 <b>선택 없이 바로</b> 보여줍니다.
          </p>
        </div>

        {/* 기준선 시세표 — 항상 표시. 검색으로 필터, 행 클릭 시 상세/제보 로드. */}
        <div className="card">
          <div className="eyebrow gold">
            기준선 시세표 <span className="px-low">· 정적 · 비공식 · as-of {AS_OF}</span>
          </div>
          {staleMonths !== null && staleMonths >= STALE_MONTHS && (
            <p className="zen px-stale">
              ⚠ 이 기준선은 <b>{staleMonths}개월 전({AS_OF}) 수집</b>본입니다. 시세는 시즌·패치에 따라 크게 움직이므로
              지금 값과 다를 수 있습니다 — 아래 커뮤니티 제보를 함께 보세요.
            </p>
          )}
          <p className="zen" style={{ marginTop: 6 }}>
            주요·고가 아이템의 <b>스탠다드 / 래더 시즌 초</b> 대략 값어치(고룬 단위). 아래 검색으로 필터하거나
            행을 눌러 커뮤니티 제보 시세도 확인하세요. Data courtesy of diablo2.io.
          </p>
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.7fr 1fr 1fr",
                gap: 8,
                padding: "6px 4px",
                fontSize: 12,
                opacity: 0.6,
              }}
            >
              <span>아이템</span>
              <span>스탠다드</span>
              <span>래더 시즌 초</span>
            </div>
            {baseHits.map((b) => (
              <button
                type="button"
                key={b.key}
                onClick={() => pick({ key: b.key, kr: b.kr, en: b.en })}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.7fr 1fr 1fr",
                  gap: 8,
                  alignItems: "center",
                  textAlign: "left",
                  width: "100%",
                  padding: "8px 4px",
                  border: 0,
                  borderTop: "1px solid rgba(199,179,119,0.14)",
                  background: selected?.key === b.key ? "rgba(199,179,119,0.08)" : "transparent",
                  color: "inherit",
                  font: "inherit",
                  cursor: "pointer",
                }}
              >
                <span>
                  <b>{b.kr}</b>{" "}
                  <span className="chk-sub" style={{ display: "inline" }}>{b.en}</span>
                  {b.tier && <span className="px-low"> · {b.tier}</span>}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{b.std}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{b.ladder}</span>
              </button>
            ))}
            {baseHits.length === 0 && (
              <div className="px-msg" style={{ marginTop: 8 }}>검색과 일치하는 기준선 항목이 없습니다.</div>
            )}
          </div>
        </div>

        {/* 상세/제보 패널 — 목록 위에 렌더(선택 시 화면 밖에 생기지 않도록). 폼을 시세 요약 바로 다음에 배치. */}
        {selected && (
          <div className="card chk-sec" ref={detailRef}>
            <div className="chk-sec-hd">
              <div className="chk-sec-name">
                {selected.kr} <span className="chk-sub" style={{ display: "inline" }}>· {selected.en}</span>
              </div>
              <div className="chk-sec-count">
                {loading ? "불러오는 중…" : `제보 ${data?.total || 0}건`}
              </div>
            </div>

            {baseline && (
              <div className="px-base">
                <div className="ti-sublbl">
                  기준선 지표 <span className="px-low">· 정적 · 비공식{baseline.tier ? ` · ${baseline.tier}티어` : ""}</span>
                </div>
                <div className="px-unit-grid">
                  <div className="px-unit">
                    <div className="px-unit-name">스탠다드</div>
                    <div className="px-unit-med">{baseline.std}</div>
                    <div className="px-unit-cnt">비-래더</div>
                  </div>
                  <div className="px-unit">
                    <div className="px-unit-name">래더 시즌 초</div>
                    <div className="px-unit-med">{baseline.ladder}</div>
                    <div className="px-unit-cnt">ladder start</div>
                  </div>
                </div>
                {baseline.note && <div className="px-msg">{baseline.note}</div>}
              </div>
            )}

            {data && data.redis === false && (
              <div className="px-msg err">제보 저장소가 아직 설정되지 않았습니다. 제보는 저장되지 않습니다.</div>
            )}

            {!loading && data && (data.units?.length ? (
              <>
              <div className="ti-sublbl" style={{ marginBottom: 6 }}>제보 기반 중앙값 <span className="px-low">· 동적 · 커뮤니티</span></div>
              <div className="px-unit-grid">
                {data.units.map((u) => (
                  <div className="px-unit" key={u.unit}>
                    <div className="px-unit-name">{u.unit}</div>
                    <div className="px-unit-med">{u.median}</div>
                    <div className="px-unit-cnt">
                      {u.count < 3 ? <span className="px-low">표본 부족 ({u.count})</span> : `${u.count}건`}
                    </div>
                  </div>
                ))}
              </div>
              </>
            ) : (
              <div className="px-msg">아직 제보가 없습니다. 첫 제보를 남겨보세요.</div>
            ))}

            <form className="px-form" onSubmit={submit}>
              <div className="ti-sublbl">시세 제보 (단위: 룬)</div>
              <div className="ti-chips">
                {RUNE_UNITS.map((u) => (
                  <div
                    key={u}
                    className={`ti-chip ${unit === u ? "on" : ""}`}
                    onClick={() => setUnit(u)}
                  >
                    {u}
                  </div>
                ))}
              </div>
              <input
                className="ti-input"
                style={{ marginTop: 10 }}
                type="number"
                inputMode="decimal"
                min="0"
                max="9999"
                step="0.5"
                placeholder={`가격 (예: 2 = ${unit || "룬"} 2개)`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <input
                className="ti-input"
                style={{ marginTop: 10 }}
                type="text"
                maxLength={80}
                placeholder="메모 (선택 · 예: 옵션·거래처)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              {/* 허니팟 — 사람에겐 안 보임 */}
              <input
                className="px-hp"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
              />
              {msg && <div className={`px-msg ${msg.type === "err" ? "err" : "ok"}`}>{msg.text}</div>}
              <button type="submit" className="ti-btn" style={{ marginTop: 10 }} disabled={busy}>
                {busy ? "제보 중…" : "제보하기"}
              </button>
            </form>

            {!loading && data?.recent?.length > 0 && (
              <div className="px-recent">
                <div className="ti-sublbl">최근 제보</div>
                {data.recent.map((r, i) => (
                  <div className="px-rec" key={i}>
                    <span className="px-rec-price">{r.price} {r.unit}</span>
                    {r.note && <span className="px-rec-note">{r.note}</span>}
                    <span className="px-rec-t">{fmtAgo(r.t)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="card ti-searchbar">
          <input
            className="ti-input"
            type="text"
            placeholder="아이템 검색: 공허, ㅁㄴㄷ, enigma, infinity…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="ti-count">{hits.length}개 표시</div>
          <div className="grail-grid" style={{ marginTop: 12 }}>
            {hits.map((x) => (
              <button
                type="button"
                key={x.key}
                className={`chk ${selected?.key === x.key ? "on" : ""}`}
                aria-pressed={selected?.key === x.key}
                onClick={() => pick(x)}
              >
                <span className="chk-main">
                  <span className="chk-kr">{x.kr}</span>
                  {x.en !== x.kr && <span className="chk-sub">{x.en}</span>}
                </span>
              </button>
            ))}
          </div>
          {hits.length === 0 && <div className="ti-empty">검색 결과가 없습니다.</div>}
        </div>

        <div className="note">
          <b>안내</b> — 시세는 사용자 익명 제보의 <b>룬 단위별 중앙값(이상치 제외)</b>입니다. 표본이 적을수록
          신뢰도가 낮으니 표본 수를 함께 확인하세요. 수치는 커뮤니티 통용값 기반 <b>비공식·참고용</b>이며 실제 거래를
          보증하지 않습니다. <b>기준선 지표</b>는 제보와 별개인 <b>정적·비공식</b> 참고값으로, 주요 아이템의 스탠다드/래더
          시즌 초 대략적 값어치를 고룬 단위로 나타냅니다(as-of {AS_OF}). Data courtesy of diablo2.io.
        </div>
      </div>
    </main>
  );
}
