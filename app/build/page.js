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
                </div>
                <div className="rw-kr">{b.class}</div>
              </div>

              <div className="rw-meta">
                {b.tags.map((t) => (
                  <span className="rw-mtag" key={t}>{t}</span>
                ))}
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
          <b>연결</b> — 룬워드는 <b>룬워드</b> 탭, 프레임 목표는 <b>프레임 기준</b> 탭, 룬 확보는 <b>룬 재고</b> 탭에서
          이어서 확인하세요.
        </div>
      </div>
    </main>
  );
}
