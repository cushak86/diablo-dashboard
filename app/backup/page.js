"use client";

import { useEffect, useRef, useState } from "react";
import { buildExport, summarize, parseImport, applyImport } from "../../lib/backup";
import { loadState, persist } from "../../lib/grail-store";
import { scopeOf } from "../../lib/grail-collect";
import { getCode, getSyncedAt, setCode, clearCode, push, pull } from "../../lib/sync";

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

export default function BackupPage() {
  const [current, setCurrent] = useState([]);   // 현재 저장 현황
  const [pending, setPending] = useState(null); // 검증 통과한 가져오기 대기분
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const fileRef = useRef(null);

  const [code, setCodeState] = useState("");
  const [syncedAt, setSyncedAt] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => setCurrent(summarize(read));
  useEffect(() => {
    refresh();
    setCodeState(getCode());
    setSyncedAt(getSyncedAt());
  }, []);

  const onCreateOrPush = async () => {
    setError(""); setDone(""); setBusy(true);
    try {
      const r = await push(code);
      setCodeState(r.code);
      setSyncedAt(r.updatedAt);
      setDone(code ? "이 기기의 데이터를 올렸습니다." : "동기화 코드를 만들었습니다. 다른 기기에서 이 코드를 입력하세요.");
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const onPull = async () => {
    setError(""); setDone(""); setPending(null); setBusy(true);
    try {
      const r = await pull(codeInput);
      const parsed = parseImport(r.payload);
      if (!parsed.ok) { setError(parsed.error); }
      else { setPending({ ...parsed, fromCode: codeInput.trim().toLowerCase(), updatedAt: r.updatedAt }); }
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const onUnlink = () => {
    clearCode();
    setCodeState(""); setSyncedAt("");
    setDone("이 기기의 연결을 끊었습니다. 서버의 데이터는 그대로 있습니다(코드로 다시 연결 가능).");
  };

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
    if (pending.fromCode) {            // 코드로 불러왔으면 이 기기도 그 코드에 연결한다(이후 자동 동기화)
      setCode(pending.fromCode, pending.updatedAt);
      setCodeState(pending.fromCode);
      setSyncedAt(pending.updatedAt || "");
    }
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
          <div className="eyebrow blood">기기 간 동기화 (로그인 없음)</div>
          <p className="zen">
            코드 하나로 다른 기기와 이어집니다. <b>계정도 이메일도 필요 없습니다.</b> 코드를 연결해 두면 체크할 때마다
            자동으로 서버에 올라가므로, 캐시 삭제·기기 변경·<b>Safari의 7일 자동 삭제</b>에도 기록이 살아남습니다.
          </p>
          {code ? (
            <>
              <div className="sy-code">{code}</div>
              <div className="rp-toolbar">
                <button className="btn btn-on" onClick={onCreateOrPush} disabled={busy}>지금 올리기</button>
                <button
                  className="chk-reset"
                  onClick={() => { navigator.clipboard?.writeText(code); setDone("코드를 복사했습니다."); }}
                >코드 복사</button>
                <button className="chk-reset" onClick={onUnlink}>이 기기 연결 끊기</button>
                {syncedAt && <span className="rw-mtag">마지막 동기화 {new Date(syncedAt).toLocaleString("ko-KR")}</span>}
              </div>
              <p className="zen sy-warn">
                ⚠ <b>이 코드가 곧 열쇠입니다.</b> 아는 사람은 누구나 이 데이터를 보고 덮어쓸 수 있으니 공개하지 마세요.
                따로 적어 두세요 — 코드를 잃으면 다른 기기에서 불러올 수 없습니다.
              </p>
            </>
          ) : (
            <div className="rp-toolbar">
              <button className="btn btn-on" onClick={onCreateOrPush} disabled={busy || total === 0}>
                동기화 코드 만들기
              </button>
              {total === 0 && <span className="rw-kr">먼저 수집·체크를 시작하세요.</span>}
            </div>
          )}

          <div className="sy-pull">
            <div className="bk-lbl">다른 기기의 코드로 불러오기</div>
            <div className="rp-toolbar">
              <input
                className="sy-input"
                placeholder="예: abcd2345-efgh6789-jkmn2345"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
              />
              <button className="btn btn-off" onClick={onPull} disabled={busy || !codeInput.trim()}>불러오기</button>
            </div>
          </div>
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
