"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BUILDS, allClasses, buildsByClass } from "../../lib/builds";
import { RW } from "../../lib/runewords";

// 룬워드 id(en) → 한국어명 조회. 카드에는 한글명 표기, 링크는 /runewords 허브로.
const RW_KR = Object.fromEntries(RW.map((r) => [r.en, r.kr]));

// 소유 파일(globals.css 미수정) 제약상 섹션 헤더/보조 텍스트는 인게임 색상 변수로 인라인 스타일.
const HD = { fontSize: 11, fontWeight: 800, letterSpacing: ".16em", color: "var(--gold)", textTransform: "uppercase", marginTop: 14, marginBottom: 6 };
const DIM = { fontSize: 12, color: "#8a8a8a", lineHeight: 1.55 };
const LIST = { margin: "0", paddingLeft: 18, ...DIM };
const ROW = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" };

// 브레이크포인트 표기: null=물리빌드라 무관/미검증, 숫자=%, 문자열=그대로.
const bp = (v, whenNull) => (v === null || v === undefined ? whenNull : typeof v === "number" ? `${v}%` : v);

// 스킬 포인트 배지: 숫자 20=마스터(20/20), 그 외 숫자=N점, 문자열=그대로. null/undefined=미표기.
const ptLabel = (p) => (p === null || p === undefined ? null : typeof p === "number" ? (p >= 20 ? `${p}/20` : `${p}점`) : p);
const PT = { marginLeft: 6, fontSize: 10, fontWeight: 800, color: "var(--gold)", border: "1px solid #4a4030", borderRadius: 4, padding: "0 5px", whiteSpace: "nowrap" };

// 티어 배지 — 등급색. S=금 · A=초록 · B=파랑 · C=회 · D/F=적. "S*"·"—"도 앞글자로 판정.
const tierClass = (t) => "bd-t-" + (t?.[0] || "x").toLowerCase();
const TIER_COLOR = { s: "#e8c15a", a: "#68c07a", b: "#5aa9e8", c: "#9a9a9a", d: "#c1554a", f: "#c1554a", x: "#6a6a6a" };
const tierStyle = (t) => {
  const c = TIER_COLOR[(t?.[0] || "x").toLowerCase()] || TIER_COLOR.x;
  return { marginLeft: 8, fontSize: 13, fontWeight: 900, color: c, border: `1.5px solid ${c}`, borderRadius: 6, padding: "0 7px", verticalAlign: "middle" };
};
// 티어 순서(요약 그리드 정렬). S*는 S 옆.
const TIER_RANK = { S: 0, "S*": 1, A: 2, B: 3, C: 4, D: 5, F: 6, "—": 9 };

// 추천 장비 슬롯 표기 순서. builds.js의 gear 키와 일치. 없는 슬롯은 건너뛴다.
const SLOT_ORDER = ["투구", "갑옷", "무기", "방패", "장갑", "벨트", "신발", "반지", "목걸이", "부적"];
const SLOT_LBL = { fontSize: 11, fontWeight: 800, color: "var(--gold)", minWidth: 32, flexShrink: 0 };
// 용병(2막) 장비 슬롯 표기 순서. builds.js의 mercGear 키와 일치.
const MERC_SLOT_ORDER = ["무기", "갑옷", "투구"];

export default function BuildPage() {
  const [cls, setCls] = useState("all");
  const classes = useMemo(() => allClasses(), []);
  const hits = useMemo(() => buildsByClass(cls), [cls]);

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">빌드 가이드</div>
          <h1 className="zname">직업별 추천 빌드 · 스킬/스탯/장비 한눈에</h1>
          <p className="zen">
            8직업 대표 빌드를 카드로 정리했습니다. 스킬 찍는 <b>우선순위</b>, 스탯 분배 방향(힘/민/체/에),
            핵심 <b>룬워드</b>·용병 세팅까지. 카드의 룬워드는 <b>룬워드</b> 탭, 프레임 목표는 <b>프레임 기준</b> 탭,
            룬 확보는 <b>룬 재고</b> 탭으로 이어집니다.
          </p>
        </div>

        {/* 재미로 보는 티어표 — maxroll S14 종합 티어 기준 그리드. 클릭 시 해당 클래스 필터. */}
        <div className="card">
          <div className="eyebrow gold">재미로 보는 티어표</div>
          <p className="zen" style={{ marginBottom: 10 }}>
            <b>maxroll 시즌14</b> 등급을 옮긴 참고표입니다(<b>공식 순위 아님 · 재미로</b>). 아래는 <b>종합</b> 기준이며,
            카드마다 <b>래더 시작 · 밀집 청소</b> 등급도 함께 표시됩니다 — 같은 빌드도 축마다 크게 다릅니다.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["S", "S*", "A", "B", "C", "D", "F"].map((tier) => {
              const inTier = BUILDS.filter((b) => b.tier?.overall === tier);
              if (!inTier.length) return null;
              const c = TIER_COLOR[tier[0].toLowerCase()] || TIER_COLOR.x;
              return (
                <div key={tier} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ ...tierStyle(tier), marginLeft: 0, minWidth: 34, textAlign: "center", flexShrink: 0 }}>{tier}</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 2 }}>
                    {inTier.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        className="rw-mtag"
                        style={{ cursor: "pointer", borderColor: `${c}55` }}
                        onClick={() => setCls(b.class)}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ ...DIM, marginTop: 10 }}>
            무술(모자이크)은 <b>S*</b> — 모자이크 변형 기준입니다(순수 불사조는 D). <b>—</b>는 해당 축 미등재(낮음이 아니라 데이터 없음).
          </p>
        </div>

        <div className="card ti-searchbar">
          <div className="ti-sublbl">직업 필터</div>
          <div className="ti-chips">
            <div
              className={`ti-chip ${cls === "all" ? "on" : ""}`}
              onClick={() => setCls("all")}
            >
              전체
            </div>
            {classes.map((c) => (
              <div
                key={c}
                className={`ti-chip ${cls === c ? "on" : ""}`}
                onClick={() => setCls(c)}
              >
                {c}
              </div>
            ))}
          </div>
          <div className="ti-count">{hits.length}개 빌드</div>
        </div>

        <div className="rw-list">
          {hits.map((b) => (
            <article className="rw-card" key={b.id} style={{ cursor: "default" }}>
              <div className="rw-head">
                <div className="rw-name">
                  {b.name}
                  {b.verify && <span className="rw-newtag">{b.verify}</span>}
                  {/* 종합 티어를 이름 옆에 크게 — 등급색은 S~D 로 갈린다. */}
                  {b.tier && <span style={tierStyle(b.tier.overall)}>{b.tier.overall}</span>}
                </div>
                <div className="rw-kr">{b.class}</div>
              </div>

              <div className="rw-meta">
                {b.tags.map((t) => (
                  <span className="rw-mtag" key={t}>{t}</span>
                ))}
                {/* 3축 병기 — 종합만으론 왜곡(소용돌이 종합C/밀집F). maxroll S14 근거. */}
                {b.tier && (
                  <span className="rw-mtag bd-tier-axes">
                    종합 {b.tier.overall} · 래더 {b.tier.ladder} · 밀집 {b.tier.density}
                  </span>
                )}
              </div>

              <div style={HD}>스킬 우선순위</div>
              {b.skills.length > 0 ? (
                <ol style={LIST}>
                  {b.skills.map((s) => (
                    <li key={s.name}>
                      <b style={{ color: "var(--parch)" }}>{s.name}</b>
                      {ptLabel(s.points) && <span style={PT}>{ptLabel(s.points)}</span>}
                      {s.note && <span> — {s.note}</span>}
                    </li>
                  ))}
                </ol>
              ) : (
                <div style={DIM}>데이터 확보 중 — 검증되면 갱신됩니다.</div>
              )}

              <div style={HD}>스탯 방향 (힘/민/체/에)</div>
              <div style={DIM}>{b.stats}</div>

              <div style={HD}>핵심 룬워드</div>
              <div className="ti-chips">
                {b.keyRunewords.map((id) => (
                  <Link className="ti-chip" href="/runewords" key={id}>
                    {RW_KR[id] || id} ↗
                  </Link>
                ))}
              </div>

              {b.gear && (
                <>
                  <div style={HD}>추천 장비 (슬롯별)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {SLOT_ORDER.filter((s) => b.gear[s]?.length).map((slot) => (
                      <div key={slot} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span style={SLOT_LBL}>{slot}</span>
                        <span style={DIM}>
                          {b.gear[slot].map((g, i) => (
                            <span key={g.name}>
                              {i > 0 && <span style={{ color: "#555" }}> · </span>}
                              <b style={{ color: "var(--parch)" }}>{g.name}</b>
                              {g.note && <span style={{ color: "#8a8a8a" }}> ({g.note})</span>}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={HD}>프레임 목표</div>
              <div style={{ ...ROW, marginBottom: 4 }}>
                <span style={DIM}>시전 속도 {bp(b.breakpointGoal.fcr, "물리 무관")} · 타격 회복 {bp(b.breakpointGoal.fhr, "검증중")}</span>
              </div>
              <div style={ROW}>
                <Link className="ti-btn alt" href="/breakpoints">프레임 기준 ↗</Link>
                <Link className="ti-btn alt" href="/planner">룬 재고 계산 ↗</Link>
              </div>

              <div style={HD}>용병</div>
              <div style={DIM}>{b.mercenary}</div>
              {b.mercGear && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                  {MERC_SLOT_ORDER.filter((s) => b.mercGear[s]?.length).map((slot) => (
                    <div key={slot} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      <span style={SLOT_LBL}>{slot}</span>
                      <span style={DIM}>
                        {b.mercGear[slot].map((g, i) => (
                          <span key={g.name}>
                            {i > 0 && <span style={{ color: "#555" }}> · </span>}
                            <b style={{ color: "var(--parch)" }}>{g.name}</b>
                            {g.note && <span style={{ color: "#8a8a8a" }}> ({g.note})</span>}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {b.note && <div className="rw-stat">{b.note}</div>}

              {b.sources?.length > 0 && (
                <div style={{ ...DIM, marginTop: 9, fontSize: 11 }}>
                  출처:{" "}
                  {b.sources.map((u, i) => (
                    <span key={u}>
                      {i > 0 && " · "}
                      <a href={u} target="_blank" rel="noopener noreferrer" style={{ color: "#9a9a9a" }}>
                        {new URL(u).hostname.replace(/^www\./, "")}
                      </a>
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
        {hits.length === 0 && (
          <div className="ti-empty">해당 직업 빌드가 아직 없습니다.</div>
        )}

        <div className="note">
          <b>수록 범위</b> — 8직업 대표 빌드 <b>{BUILDS.length}개</b>. 스킬·스탯·프레임 수치는 공개 공략
          (맥스롤·아이시베인즈 등)을 <b>최소 2소스 교차검증</b>했습니다. 소스 간 수치가 갈리는 경우 카드 메모에
          양쪽을 병기했습니다.
          <br />
          <b>정확도</b> — 검증이 끝나지 않은 항목은 <b>검증중</b> 배지로 고지합니다(날조 금지). 현재 검증중인
          빌드는 없습니다. 신규 직업 <b>악마술사</b>는 기술의 한국어 표기를 인게임 표기로 확정해 반영했습니다.
          <br />
          <b>추천 장비</b> — 슬롯별 장비는 <b>게임 사실이 아닌 추천</b>입니다(맥스롤·아이시 대조, 이견은 병기).
          장비명은 아이템 정본과 일치시켰습니다. 신규 직업 <b>악마술사</b>는 공략이 제한적이라 맥스롤 공략 단독 기준으로
          반영했습니다(교차 소스 확보 시 갱신).
          <br />
          <b>연결</b> — 룬워드는 <b>룬워드</b> 탭, 프레임 목표는 <b>프레임 기준</b> 탭, 룬 확보는 <b>룬 재고</b> 탭에서
          이어서 확인하세요.
        </div>
      </div>
    </main>
  );
}
