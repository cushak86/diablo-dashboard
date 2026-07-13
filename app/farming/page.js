"use client";

import { useMemo, useState, useEffect } from "react";

// KST 달력 기준 문자열(YYYY-MM-DD). Vercel(UTC)에서도 한국 날짜로 판정 → 자정 자동 리셋 근거.
function kstDateStr(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);
}
// KST 기준 이번 주 월요일(YYYY-MM-DD) → 주간 리셋 키.
function kstWeekKey(d = new Date()) {
  const [y, m, day] = kstDateStr(d).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  const wd = (dt.getUTCDay() + 6) % 7; // 월=0
  dt.setUTCDate(dt.getUTCDate() - wd);
  return `W:${dt.toISOString().slice(0, 10)}`;
}

const DAILY = [
  { id: "countess", kr: "카운테스", sub: "저주받은 탑 · 룬 파밍" },
  { id: "hellforge", kr: "지옥 대장간(헬 포지)", sub: "난이도별 룬 보상" },
  { id: "cows", kr: "비밀 소 레벨", sub: "왕의 목장 · 물량 파밍" },
  { id: "tz", kr: "공포 지역(TZ) 순회", sub: "경험치·표적 파밍" },
  { id: "andy", kr: "안다리엘 런", sub: "1막 보스 · 고효율 드랍" },
  { id: "meph", kr: "메피스토 런", sub: "3막 보스 · MF 파밍" },
  { id: "pindle", kr: "핀들스킨 / 니흘라탁", sub: "5막 초고속 런" },
  { id: "chaos", kr: "카오스 생츄어리", sub: "디아블로 런" },
];
const WEEKLY = [
  { id: "uber", kr: "우버 트리스트람", sub: "안니힐러스 횃불 파밍" },
  { id: "clone", kr: "우버 디아블로(클론)", sub: "소집 이벤트 참여" },
  { id: "ancients", kr: "위압적인 고대인(붉은 차원문)", sub: "조각상 5종 → 보상" },
  { id: "goal", kr: "주간 목표(자유)", sub: "래더·거래 개인 목표" },
];

function pct(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

export default function FarmingPage() {
  // map: { [taskId]: periodKey } — 해당 주기 키와 일치할 때만 완료. 지난 주기 키는 자동으로 미완료 처리(암묵적 리셋).
  const [map, setMap] = useState(() => ({}));
  const [period, setPeriod] = useState({ day: "", week: "" });
  const [resetIn, setResetIn] = useState({ day: "", week: "" });

  // 주기 키·저장값은 마운트 후 계산/로드(초기 빈 값 → 첫 렌더 전부 미완료 → 하이드레이션 안전).
  useEffect(() => {
    setPeriod({ day: kstDateStr(), week: kstWeekKey() });
    try {
      const raw = localStorage.getItem("farm:v1");
      if (raw) setMap(JSON.parse(raw) || {});
    } catch {}
  }, []);

  // 다음 리셋까지 남은 시간(KST 자정 / 다음 월요일). 표시용 — 1분마다 갱신.
  useEffect(() => {
    function tick() {
      // 자정/월요일 롤오버 대응: tick마다 주기 키 재계산해 바뀌면 갱신(변화 없으면 동일 참조 유지 → 무의미 렌더 방지).
      const d = kstDateStr(), w = kstWeekKey();
      setPeriod((p) => (p.day === d && p.week === w ? p : { day: d, week: w }));
      const now = new Date();
      const kstNow = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60000);
      const endDay = new Date(kstNow); endDay.setHours(24, 0, 0, 0);
      const dow = (kstNow.getDay() + 6) % 7;
      const endWeek = new Date(kstNow); endWeek.setDate(kstNow.getDate() + (7 - dow)); endWeek.setHours(0, 0, 0, 0);
      const fmt = (ms) => {
        const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
        return h >= 24 ? `${Math.floor(h / 24)}일 ${h % 24}시간` : `${h}시간 ${m}분`;
      };
      setResetIn({ day: fmt(endDay - kstNow), week: fmt(endWeek - kstNow) });
    }
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  function keyFor(cadence) {
    return cadence === "daily" ? period.day : period.week;
  }
  function checked(task, cadence) {
    const k = keyFor(cadence);
    return !!k && map[task.id] === k;
  }
  function toggle(task, cadence) {
    const k = keyFor(cadence);
    if (!k) return;
    setMap((prev) => {
      const nx = { ...prev };
      if (nx[task.id] === k) delete nx[task.id];
      else nx[task.id] = k;
      try { localStorage.setItem("farm:v1", JSON.stringify(nx)); } catch {}
      return nx;
    });
  }

  const dailyDone = useMemo(() => DAILY.filter((t) => checked(t, "daily")).length, [map, period]);
  const weeklyDone = useMemo(() => WEEKLY.filter((t) => checked(t, "weekly")).length, [map, period]);

  function section(title, cadence, list, done, resetLabel) {
    return (
      <div className="card chk-sec">
        <div className="chk-sec-hd">
          <div className="chk-sec-name">{title}</div>
          <div className="chk-sec-count">{done} / {list.length} · {pct(done, list.length)}%</div>
        </div>
        <div className="pbar"><span style={{ width: `${pct(done, list.length)}%` }} /></div>
        <div className="chk-hint">{resetLabel}</div>
        <div className="chk-list">
          {list.map((t) => {
            const on = checked(t, cadence);
            return (
              <button
                type="button"
                key={t.id}
                className={`chk ${on ? "on" : ""}`}
                aria-pressed={on}
                onClick={() => toggle(t, cadence)}
              >
                <span className="chk-box">✓</span>
                <span className="chk-main">
                  <span className="chk-kr">{t.kr}</span>
                  <span className="chk-sub">{t.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">파밍 체크리스트</div>
          <h1 className="zname">일일 · 주간 파밍 루틴</h1>
          <p className="zen">
            오늘 할 파밍과 이번 주 목표를 체크하세요. 체크 상태는 일일 항목이 <b>매일 자정(KST)</b>,
            주간 항목이 <b>매주 월요일 0시(KST)</b>에 자동으로 비워집니다 — 개인 루틴 관리용이며 게임 내
            실제 리셋 주기와 다를 수 있습니다. 헬 포지(1회성 퀘스트)·우버/클론처럼 고정 리셋이 없는
            항목도 반복 루틴 체크 목적으로 포함했습니다. 진행 상황은 이 브라우저에 저장됩니다.
          </p>
        </div>

        {section("일일", "daily", DAILY, dailyDone, resetIn.day ? `초기화까지 약 ${resetIn.day}` : "매일 자정(KST) 초기화")}
        {section("주간", "weekly", WEEKLY, weeklyDone, resetIn.week ? `초기화까지 약 ${resetIn.week}` : "매주 월요일(KST) 초기화")}

        <div className="note">
          <b>참고</b> — 공포 지역(TZ)은 1시간 주기로 변하므로 별도 <a href="/terror-zone">공역</a> 탭에서
          현재 지역을 확인하세요. 항목은 커뮤니티에서 통용되는 대표 파밍처 예시이며(<b>비공식 · 검증 필요</b>),
          개인 루틴에 맞게 취사선택하면 됩니다.
        </div>
      </div>
    </main>
  );
}
