"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { mockZoneForDate, actLabel } from "../../lib/zones";
import UberDiabloWidget from "../components/UberDiabloWidget";

const pad = (n) => String(n).padStart(2, "0");
const RING_C = 2 * Math.PI * 92; // 578.05

/* ---------------- 사운드 ---------------- */
function useSound(soundOn) {
  const ctxRef = useRef(null);
  const ensure = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    if (ctxRef.current && ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);
  const beep = useCallback((f = 660, dur = 0.18, type = "sine", gain = 0.25) => {
    if (!soundOn) return;
    const ctx = ensure(); if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur + 0.02);
  }, [soundOn, ensure]);
  const chime = useCallback((arr) => arr.forEach((f, i) => setTimeout(() => beep(f, 0.24, "triangle", 0.28), i * 160)), [beep]);
  const speak = useCallback((text) => {
    if (!soundOn || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR"; u.rate = 1; u.pitch = 1; u.volume = 1;
    const kr = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith("ko"));
    if (kr) u.voice = kr;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  }, [soundOn]);
  return { beep, chime, speak, ensure };
}

/* ---------------- 소품 컴포넌트 ---------------- */
function Badge({ act }) {
  if (!act) return null;
  return <span className={`badge a${act}`}>{actLabel(act)}</span>;
}
function Chips({ areas }) {
  if (!areas || !areas.length) return null;
  return (
    <div className="chips">
      {areas.map(([kr, en], i) => (
        <span className="chip" key={i}>{kr} <span className="en">· {en}</span></span>
      ))}
    </div>
  );
}

/* ---------------- 메인 ---------------- */
export default function TerrorZonePage() {
  const [now, setNow] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);       // 서버 응답 (current/mode 등)
  const [soundOn, setSoundOn] = useState(false);
  const [banner, setBanner] = useState("");
  const firedRef = useRef({});
  const lastHourRef = useRef(null);
  const bannerTimer = useRef(null);
  const sound = useSound(soundOn);

  const fetchTZ = useCallback(async () => {
    try {
      const r = await fetch("/api/terror-zone", { cache: "no-store" });
      const j = await r.json();
      setData(j);
    } catch {
      setData({ mode: "mock", reason: "client-fetch-error", current: null });
    }
  }, []);

  // 최초 + 60초마다 갱신
  useEffect(() => {
    fetchTZ();
    const id = setInterval(fetchTZ, 60000);
    return () => clearInterval(id);
  }, [fetchTZ]);

  // 1초 틱
  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const showBanner = useCallback((msg) => {
    setBanner(msg);
    clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(""), 9000);
  }, []);

  const secElapsed = now.getMinutes() * 60 + now.getSeconds();
  const secLeft = 3600 - secElapsed;
  const progress = secLeft / 3600;
  const mm = Math.floor(secLeft / 60), ss = secLeft % 60;
  const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;

  const mode = data?.mode || "mock";
  const isLive = mode === "live";

  // 현재/다음 존
  const current = data?.current || mockZoneForDate(now);
  const next = isLive ? (data?.next || null) : mockZoneForDate(new Date(now.getTime() + 3600000));

  // 정각 변경 감지 → 라이브면 재요청, 알림
  useEffect(() => {
    if (lastHourRef.current !== null && lastHourRef.current !== hourKey) {
      if (isLive) fetchTZ();
      showBanner(`공포의 영역이 변경되었습니다!`);
      sound.chime([523, 659, 784, 1046]);
      sound.speak(
        isLive
          ? "공포의 영역이 변경되었습니다. 최신 지역을 확인하세요."
          : `공포의 영역이 변경되었습니다. 현재 지역은 ${current.kr} 입니다.`
      );
    }
    lastHourRef.current = hourKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hourKey]);

  // 10/5/1분 전 알림
  useEffect(() => {
    if (!firedRef.current[hourKey]) firedRef.current[hourKey] = new Set();
    const fired = firedRef.current[hourKey];
    const marks = [
      { at: 600, label: "10분 전" },
      { at: 300, label: "5분 전" },
      { at: 60, label: "1분 전" },
    ];
    for (const m of marks) {
      if (secLeft <= m.at && secLeft > m.at - 2 && !fired.has(m.at)) {
        fired.add(m.at);
        const tail = next ? ` — 다음: ${next.kr}` : "";
        showBanner(`${m.label}${tail}`);
        sound.beep(880, 0.16, "sine", 0.28);
        setTimeout(() => sound.beep(660, 0.16, "sine", 0.24), 180);
        sound.speak(
          next
            ? `공포의 영역 변경 ${m.label}. 다음 지역은 ${next.kr} 입니다.`
            : `공포의 영역 변경 ${m.label} 입니다.`
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secLeft, hourKey]);

  const toggleSound = () => {
    if (!soundOn) {
      setSoundOn(true); sound.ensure();
      if (window.speechSynthesis) window.speechSynthesis.getVoices();
      setTimeout(() => sound.beep(784, 0.14, "triangle", 0.22), 50);
    } else {
      setSoundOn(false);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  };

  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const lastUpdateStr = data?.lastUpdate
    ? new Date(data.lastUpdate).toLocaleTimeString("ko-KR")
    : null;

  // 마운트 전(시계 하이드레이션 불일치 방지) + 최초 실데이터 도착 전에는 로딩 셸만 렌더.
  // (data가 null인 동안 모의로 폴백하면 "모의→실시간" 깜빡임이 생기므로 폴백을 미룬다.)
  if (!mounted || !data) {
    return (
      <main>
        <div className="wrap stack">
          <div className="card cur tz-loading">
            <div className="eyebrow blood tz-loading-eyebrow">
              <span className="glowdot" /> 공포의 영역 불러오는 중…
            </div>
            <div className="tz-loading-sk zname-sk" />
            <div className="tz-loading-sk chip-sk" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="wrap stack">
        <div className="tzcontrols">
          <span className="clock">{clock}</span>
          <button className={`btn ${soundOn ? "btn-on" : "btn-off"}`} onClick={toggleSound}>
            {soundOn ? "🔊 소리 켜짐" : "🔈 소리 켜기"}
          </button>
        </div>

        {banner && <div className="banner">📢 {banner}</div>}

        {/* 현재 존 */}
        <div className="card cur">
          <div className="curgrid">
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="glowdot" />
                <span className="eyebrow blood">현재 공포의 영역</span>
                <span className={`modechip ${isLive ? "mode-live" : "mode-mock"}`}>
                  {isLive ? "● 실시간" : "◈ 모의"}
                </span>
              </div>
              <div style={{ marginTop: 10 }}><Badge act={current.act} /></div>
              <h1 className="zname">{current.kr}</h1>
              <p className="zen">{current.en}</p>
              <div style={{ marginTop: 14 }}>
                <div className="lbl">포함 지역</div>
                <Chips areas={current.areas} />
              </div>
              {isLive && lastUpdateStr && (
                <p className="zen" style={{ marginTop: 10, fontSize: 11 }}>
                  마지막 제보 {lastUpdateStr}
                </p>
              )}
            </div>

            <div className="ring">
              <svg width="220" height="220">
                <circle cx="110" cy="110" r="92" stroke="#2a2020" strokeWidth="12" fill="none" />
                <circle cx="110" cy="110" r="92" stroke="#c1272d" strokeWidth="12" fill="none"
                  strokeLinecap="round" strokeDasharray={RING_C}
                  strokeDashoffset={(RING_C * (1 - progress)).toFixed(2)}
                  style={{ transition: "stroke-dashoffset .9s linear", filter: "drop-shadow(0 0 6px rgba(193,39,45,.6))" }} />
              </svg>
              <div className="mid">
                <div className="mmss">{pad(mm)}:{pad(ss)}</div>
                <div className="sub">다음 변경까지</div>
              </div>
            </div>
          </div>
        </div>

        {/* 진행 바 */}
        <div>
          <div className="pbar-top">
            <span>{pad(now.getHours())}:00</span>
            <span>정각 로테이션</span>
            <span>{pad((now.getHours() + 1) % 24)}:00</span>
          </div>
          <div className="pbar"><span style={{ width: `${((1 - progress) * 100).toFixed(2)}%` }} /></div>
        </div>

        {/* 다음 존 + 알림 안내 */}
        <div className="grid2">
          <div className="card">
            <div className="eyebrow gold">다음 공포의 영역</div>
            {next ? (
              <>
                <div style={{ marginTop: 10 }}><Badge act={next.act} /></div>
                <h2 className="zname" style={{ fontSize: 20, marginTop: 8 }}>{next.kr}</h2>
                <p className="zen">{next.en}</p>
                <div style={{ marginTop: 12 }}><Chips areas={next.areas} /></div>
              </>
            ) : (
              <p className="zen" style={{ marginTop: 12, fontSize: 14, color: "#a5a5a5" }}>
                실시간 소스는 <b style={{ color: "var(--parch)" }}>다음 지역</b>을 제공하지 않습니다.
                정각 전후 유저 제보로 확정되며, 변경 시 자동 갱신됩니다.
              </p>
            )}
          </div>

          <div className="card">
            <div className="eyebrow mute">알림 안내</div>
            <ul className="info" style={{ marginTop: 10 }}>
              <li><span className="dot">●</span><span>변경 <b>10분 · 5분 · 1분 전</b> 사운드 + 음성 안내</span></li>
              <li><span className="dot">●</span><span><b>정각</b> 변경 시 차임 + 변경 멘트</span></li>
              <li><span className="dot">●</span><span>브라우저 정책상 <b>소리 켜기</b>를 먼저 눌러야 재생됩니다</span></li>
            </ul>
            <div className="note">
              <span className={`modechip ${isLive ? "mode-live" : "mode-mock"}`}>
                {isLive ? "● 실시간" : "◈ 모의 데이터"}
              </span>
              &nbsp;
              {isLive
                ? <>현재{next ? " · 다음" : ""} 지역은 <a href={data?.providedBy || "#"} target="_blank" rel="noreferrer">{data?.provider || "실시간"}</a> 데이터입니다.</>
                : <>토큰 미설정 또는 API 오류로 모의 로테이션을 표시 중입니다. (사유: {data?.reason || "loading"})</>}
            </div>
          </div>
        </div>

        <UberDiabloWidget />

        <details className="card gloss">
          <summary className="gloss-sum">
            <span className="eyebrow gold">신규 유저 용어 안내</span>
            <span className="gloss-arrow" aria-hidden="true">▾</span>
          </summary>
          <div className="gloss-body">
            <ul className="info">
              <li><span className="dot">●</span><span><b>공포의 영역(TZ, Terror Zone)</b> — 매시 정각마다 바뀌는 강화 사냥터. 지정 지역 몬스터가 강해지고 경험치·드랍이 상향됩니다.</span></li>
              <li><span className="dot">●</span><span><b>전령(Herald)</b> — 공포의 영역에 등장하는 특수 정예 몬스터. 파괴 부적을 드랍합니다.</span></li>
              <li><span className="dot">●</span><span><b>위압적인 고대인(Colossal Ancients)</b> — 각 막 공포 액트보스가 드랍하는 조각상 5종을 모아 소환하는 강화 보스. 고유 주얼을 보상으로 줍니다.</span></li>
              <li><span className="dot">●</span><span><b>붉은 차원문(Red Portal)</b> — 특정 조건을 만족하면 열리는 특수 포탈. 위압적인 고대인 등 추가 콘텐츠로 연결됩니다.</span></li>
              <li><span className="dot">●</span><span><b>파괴 부적(Destruction Charm)</b> — 원소별 거대 부적. ‘잠복하는’ 상태로 드랍되어 ‘새로워진’ 등급으로 강화됩니다.</span></li>
              <li><span className="dot">●</span><span><b>악마술사의 군림</b> — 현재 시즌(패치 3.2)의 이름입니다(Reign of the Warlock).</span></li>
            </ul>
          </div>
        </details>

        <footer>D2R Terror Zone Navigator · 3.2 패치 지역 기준 · {isLive ? `실시간 (${data?.provider || "live"})` : "모의 데이터"}</footer>
      </div>
    </main>
  );
}
