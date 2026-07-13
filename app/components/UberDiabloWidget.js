"use client";

import { useEffect, useState, useCallback } from "react";

const REGIONS = [
  { key: "asia", label: "ASIA" },
  { key: "americas", label: "US" },
  { key: "europe", label: "EU" },
];

const REGION_FILTERS = [
  ["all", "전체"],
  ["asia", "아시아"],
  ["americas", "미국"],
  ["europe", "유럽"],
];

function ProgressBar({ progress }) {
  const p = Math.max(0, Math.min(6, progress || 0));
  return (
    <div className="dc-bar">
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className={`dc-seg ${i < p ? "filled" : ""}`} />
      ))}
    </div>
  );
}

function Column({ title, titleClass, entries, ladder, hardcore, regionFilter }) {
  const rows = REGIONS.filter((r) => regionFilter === "all" || regionFilter === r.key);
  return (
    <div className="card">
      <div className={titleClass}>{title}</div>
      <div style={{ marginTop: 10 }}>
        {rows.map((r) => {
          const e = entries.find((x) => x.region === r.key && x.ladder === ladder && x.hardcore === hardcore);
          return (
            <div className="dc-row" key={r.key} title={e?.message || ""}>
              <span className="dc-region">{r.label}</span>
              <ProgressBar progress={e?.progress} />
              <span className="dc-count">{e ? `${e.progress}/6` : "-/6"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function UberDiabloWidget() {
  const [data, setData] = useState(null);
  const [hardcore, setHardcore] = useState(false);
  const [regionFilter, setRegionFilter] = useState("all");

  const fetchDC = useCallback(async () => {
    try {
      const r = await fetch("/api/diablo-clone", { cache: "no-store" });
      const j = await r.json();
      setData(j);
    } catch {
      setData({ mode: "mock", reason: "client-fetch-error", entries: [] });
    }
  }, []);

  useEffect(() => {
    fetchDC();
    const id = setInterval(fetchDC, 60000);
    return () => clearInterval(id);
  }, [fetchDC]);

  const entries = data?.entries || [];
  const isLive = data?.mode === "live";
  const updatedStr = data?.updatedAt ? new Date(data.updatedAt).toLocaleString("ko-KR") : null;

  return (
    <>
      <div className="card">
        <div className="dc-title-row">
          <h2 className="dc-title">우버 디아</h2>
          <div className="dc-season">악마술사의 군림</div>
          <div className="dc-pillgroup">
            <button className={`dc-pill ${!hardcore ? "active" : ""}`} onClick={() => setHardcore(false)}>
              소프트코어
            </button>
            <button className={`dc-pill ${hardcore ? "active" : ""}`} onClick={() => setHardcore(true)}>
              하드코어
            </button>
          </div>
          <div className="dc-spacer" />
          <div className="dc-pillgroup">
            {REGION_FILTERS.map(([key, label]) => (
              <button
                key={key}
                className={`dc-pill ${regionFilter === key ? "active" : ""}`}
                onClick={() => setRegionFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid2">
        <Column
          title="래더" titleClass="eyebrow gold"
          entries={entries} ladder hardcore={hardcore} regionFilter={regionFilter}
        />
        <Column
          title="논래더" titleClass="eyebrow mute"
          entries={entries} ladder={false} hardcore={hardcore} regionFilter={regionFilter}
        />
      </div>

      <div className="note">
        <span className={`modechip ${isLive ? "mode-live" : "mode-mock"}`}>
          {isLive ? "● 실시간" : "◈ 모의 데이터"}
        </span>
        &nbsp;
        {isLive ? (
          <>
            클론 디아 진행도는{" "}
            <a href={data?.providedBy} target="_blank" rel="noreferrer">d2runewizard</a> 데이터입니다
            {updatedStr ? ` · 마지막 갱신 ${updatedStr}` : ""}.
          </>
        ) : (
          <>토큰 미설정 또는 API 오류로 실데이터를 불러오지 못했습니다. (사유: {data?.reason || "loading"})</>
        )}
      </div>
    </>
  );
}
