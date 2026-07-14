"use client";

import { useEffect, useRef, useState } from "react";
import { buildExport, summarize, parseImport, applyImport } from "../../lib/backup";
import { loadState, persist } from "../../lib/grail-store";
import { scopeOf } from "../../lib/grail-collect";

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

export default function BackupPage() {
  const [current, setCurrent] = useState([]);   // 현재 저장 현황
  const [pending, setPending] = useState(null); // 검증 통과한 가져오기 대기분
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const fileRef = useRef(null);

  const refresh = () => setCurrent(summarize(read));
  useEffect(refresh, []);

  const onExport = () => {
    const payload = buildExport(read, new Date().toISOString());
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `d2r-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e) => {
    setError(""); setDone(""); setPending(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const parsed = parseImport(await file.text());
    if (!parsed.ok) { setError(parsed.error); return; }
    setPending(parsed);
  };

  const onApply = () => {
    const n = applyImport(pending, write);
    // 백업 파일에 grail v1·v2가 함께 들었는데 서로 어긋날 수 있다(외부에서 손댄 파일).
    // v2를 정본으로 채택하고 v1을 투영으로 다시 맞춘다. v1만 있는 구 백업이면 v2로 승격된다.
    const st = loadState(read, scopeOf);
    if (!st.readOnly) persist(write, st, scopeOf);
    setPending(null);
    if (fileRef.current) fileRef.current.value = "";
    refresh();
    setDone(`${n}개 항목을 가져왔습니다. 각 페이지를 새로고침하면 반영됩니다.`);
  };

  const countOf = (key) => current.find((c) => c.key === key)?.count ?? 0;
  const total = current.reduce((a, c) => a + c.count, 0);

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">개인 데이터 백업</div>
          <h1 className="zname">내보내기 / 가져오기</h1>
          <p className="zen">
            그레일 진행·파밍 체크·즐겨찾기·룬 재고는 <b>이 브라우저에만</b> 저장됩니다. 캐시를 지우거나 기기를 바꾸면
            사라집니다. JSON 파일 하나로 백업하고 다른 기기에서 복원하세요. <b>서버로 전송되지 않습니다.</b>
          </p>
        </div>

        <div className="card">
          <div className="eyebrow blood">현재 저장된 데이터</div>
          <div className="rp-toolbar">
            {current.map((c) => (
              <span key={c.key} className="rw-mtag">{c.label} {c.count}개</span>
            ))}
          </div>
          <div className="rp-toolbar">
            <button className="btn btn-on" onClick={onExport} disabled={total === 0}>
              JSON으로 내보내기
            </button>
            {total === 0 && <span className="rw-kr">저장된 데이터가 없습니다.</span>}
          </div>
        </div>

        <div className="card">
          <div className="eyebrow blood">가져오기</div>
          <p className="zen">
            백업 파일을 고르면 <b>무엇이 어떻게 바뀌는지 먼저 보여드립니다.</b> 확인 버튼을 누르기 전까지는 아무것도
            바뀌지 않습니다.
          </p>
          <div className="rp-toolbar">
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} className="bk-file" />
          </div>

          {error && <p className="zen bk-error">✖ {error}</p>}

          {pending && (
            <div className="bk-confirm">
              <div className="bk-lbl">이 파일을 가져오면:</div>
              <table className="bp-table">
                <thead>
                  <tr><th>항목</th><th>현재</th><th>가져온 뒤</th></tr>
                </thead>
                <tbody>
                  {pending.entries.map((e) => (
                    <tr key={e.key}>
                      <td>{e.label}</td>
                      <td>{countOf(e.key)}개</td>
                      <td className={e.count !== countOf(e.key) ? "bk-changed" : ""}>{e.count}개 (덮어씀)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="zen">
                백업에 없는 항목은 <b>그대로 유지</b>됩니다. 덮어쓴 데이터는 되돌릴 수 없으니, 걱정되면 먼저 위에서
                내보내기를 하세요.
              </p>
              {pending.unknownKeys.length > 0 && (
                <p className="zen bk-warn">
                  ⚠ 알 수 없는 항목 {pending.unknownKeys.length}개는 무시됩니다: {pending.unknownKeys.join(", ")}
                </p>
              )}
              <div className="rp-toolbar">
                <button className="btn btn-on" onClick={onApply}>덮어쓰고 가져오기</button>
                <button className="chk-reset" onClick={() => { setPending(null); if (fileRef.current) fileRef.current.value = ""; }}>
                  취소
                </button>
              </div>
            </div>
          )}

          {done && <p className="zen bk-done">✔ {done}</p>}
        </div>
      </div>
    </main>
  );
}
