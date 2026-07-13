"use client";

import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 256 * 1024;
const EXT_RE = /\.(md|markdown|txt)$/i;

// docs[] → 폴더 트리. 각 doc의 path(디렉토리)를 세그먼트로 분해, 리프에 문서 배치.
// path 없는 기존 문서는 루트(files)에 놓임.
function buildTree(docs) {
  const root = { name: "", dirs: new Map(), files: [] };
  for (const d of docs) {
    const segs = String(d.path || "")
      .split("/")
      .filter(Boolean);
    let node = root;
    for (const seg of segs) {
      if (!node.dirs.has(seg)) node.dirs.set(seg, { name: seg, dirs: new Map(), files: [] });
      node = node.dirs.get(seg);
    }
    node.files.push(d);
  }
  return root;
}

// 문서 id 목록 삭제(관리자). 서버가 doc:<id> del + index zrem.
// 실패(HTTP 에러·ok:false)는 throw — 호출부가 성공으로 오인하지 않도록.
async function deleteDocs(ids) {
  const r = await fetch("/api/docs", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.ok === false) throw new Error(d.error || "삭제 실패");
  return d;
}

// 폴더(작업) 하위 전체 문서 id 수집(재귀) — 폴더 단위 삭제용
function collectIds(node) {
  const ids = node.files.map((d) => d.id);
  for (const dir of node.dirs.values()) ids.push(...collectIds(dir));
  return ids;
}

// 2자리 zero-pad
function pad2(n) {
  return String(n).padStart(2, "0");
}

// epoch ms → "YYYY-MM-DD HH:MM"(로컬 시각). 숫자가 아니거나 유효하지 않으면 "" 반환(기존 문서 대비).
// toLocaleString 미사용 — 로케일 편차 회피 위해 수동 포맷.
function fmtDate(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return "";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
}

function DocRow({ doc, depth, onChanged }) {
  const [busy, setBusy] = useState(false);
  const ts = fmtDate(doc.createdAt);
  async function del() {
    if (!confirm(`"${doc.title}" 문서를 삭제할까요?`)) return;
    setBusy(true);
    try {
      await deleteDocs([doc.id]);
      onChanged?.();
    } catch (e) {
      alert(e.message || "삭제 실패");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ti-card" style={{ marginLeft: depth * 16 }}>
      <div className="ti-names">
        <div className="ti-kr">{doc.title}</div>
        <div className="ti-meta">/docs/{doc.id}</div>
        {ts && <div className="ti-meta">{ts}</div>}
      </div>
      <div className="ti-links">
        <a className="ti-btn" href={`/docs/${doc.id}`} target="_blank" rel="noopener">
          열기 ↗
        </a>
        <button type="button" className="ti-btn" onClick={del} disabled={busy}>
          {busy ? "삭제 중…" : "삭제"}
        </button>
      </div>
    </div>
  );
}

// 하위 폴더까지 재귀 합산한 문서 수(폴더가 담은 실제 문서 개수)
function countDocs(node) {
  let n = node.files.length;
  for (const dir of node.dirs.values()) n += countDocs(dir);
  return n;
}

// 하위 문서 중 가장 최근 createdAt(폴더 파생 날짜). countDocs와 같은 재귀 패턴.
// 유효한 createdAt이 하나도 없으면 -Infinity 반환 → 호출부가 Number.isFinite로 판단.
function latestTs(node) {
  let m = -Infinity;
  for (const d of node.files) {
    if (typeof d.createdAt === "number" && Number.isFinite(d.createdAt) && d.createdAt > m) {
      m = d.createdAt;
    }
  }
  for (const dir of node.dirs.values()) {
    const t = latestTs(dir);
    if (t > m) m = t;
  }
  return m;
}

// 폴더 요약: 최상위 files 중 title==="task" 문서의 summary → 폴백 요약 보유 첫 문서 → 없으면 "".
// 하위 폴더는 각자 자기 헤더에서 표시(재귀 안 함). summary는 서버가 추출한 순수 텍스트.
function folderSummary(node) {
  const task = node.files.find((d) => String(d.title).toLowerCase() === "task" && d.summary);
  if (task) return task.summary;
  const any = node.files.find((d) => d.summary);
  return any ? any.summary : "";
}

// 정렬용 폴더 타임스탬프(미보유 폴더는 0으로 취급 → 최신순에서 뒤로).
function folderSortTs(node) {
  const t = latestTs(node);
  return Number.isFinite(t) ? t : 0;
}

// 정렬용 문서 타임스탬프(누락·비정상 값은 0 → 최신순에서 뒤로, NaN 뺄셈 회피).
function docSortTs(doc) {
  const t = doc?.createdAt;
  return typeof t === "number" && Number.isFinite(t) ? t : 0;
}

// 정렬: 이름순(폴더 먼저·이름순, 파일 제목순) 또는 최신순(폴더 latestTs·파일 createdAt 내림차순).
function TreeFolder({ node, depth, onChanged, sortBy, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);
  const total = countDocs(node);
  const tsRaw = latestTs(node);
  const ts = Number.isFinite(tsRaw) ? fmtDate(tsRaw) : "";
  const summary = folderSummary(node);

  async function delFolder() {
    const ids = collectIds(node);
    if (!ids.length) return;
    if (!confirm(`"${node.name}" 폴더의 ${ids.length}개 문서를 삭제할까요?`)) return;
    setBusy(true);
    try {
      await deleteDocs(ids);
      onChanged?.();
    } catch (e) {
      alert(e.message || "삭제 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          margin: `4px 0 4px ${depth * 16}px`,
        }}
      >
        <button
          type="button"
          className="ti-btn"
          onClick={() => setOpen((v) => !v)}
          style={{ flex: 1, textAlign: "left" }}
        >
          {open ? "▾" : "▸"} {node.name} <span className="ti-count">({total})</span>
          {ts && <span className="ti-count"> · {ts}</span>}
        </button>
        <button type="button" className="ti-btn" onClick={delFolder} disabled={busy}>
          {busy ? "삭제 중…" : "폴더 삭제"}
        </button>
      </div>
      {summary && (
        <div
          className="ti-count"
          style={{
            margin: `-2px 0 6px ${depth * 16 + 10}px`,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {summary}
        </div>
      )}
      {open && (
        <TreeLevel
          node={node}
          depth={depth + 1}
          onChanged={onChanged}
          sortBy={sortBy}
          defaultOpen={defaultOpen}
        />
      )}
    </>
  );
}

function TreeLevel({ node, depth, onChanged, sortBy, defaultOpen }) {
  const dirs = [...node.dirs.values()];
  const files = [...node.files];
  if (sortBy === "recent") {
    dirs.sort((a, b) => folderSortTs(b) - folderSortTs(a));
    files.sort((a, b) => docSortTs(b) - docSortTs(a));
  } else {
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  }
  return (
    <>
      {dirs.map((dir) => (
        <TreeFolder
          key={dir.name}
          node={dir}
          depth={depth}
          onChanged={onChanged}
          sortBy={sortBy}
          defaultOpen={defaultOpen}
        />
      ))}
      {files.map((d) => (
        <DocRow key={d.id} doc={d} depth={depth} onChanged={onChanged} />
      ))}
    </>
  );
}

export default function AdminPanel() {
  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [folderFiles, setFolderFiles] = useState([]);
  const [folderInfo, setFolderInfo] = useState("");
  const [folderMsg, setFolderMsg] = useState("");
  const [folderBusy, setFolderBusy] = useState(false);
  const folderInputRef = useRef(null);

  // 트리 관리 도구: 정렬 모드 + 전체 펼치기/접기.
  // allOpen(초기 접힘) + treeNonce로 TreeLevel을 key 리마운트 → 모든 폴더 open 일괄 초기화.
  const [sortBy, setSortBy] = useState("name"); // "name" | "recent"
  const [allOpen, setAllOpen] = useState(false);
  const [treeNonce, setTreeNonce] = useState(0);

  function expandAll() {
    setAllOpen(true);
    setTreeNonce((n) => n + 1);
  }
  function collapseAll() {
    setAllOpen(false);
    setTreeNonce((n) => n + 1);
  }

  // webkitdirectory/directory 는 React가 표준 prop으로 인식하지 않으므로 DOM에 직접 설정
  useEffect(() => {
    const el = folderInputRef.current;
    if (el) {
      el.setAttribute("webkitdirectory", "");
      el.setAttribute("directory", "");
    }
  }, []);

  async function loadDocs() {
    const r = await fetch("/api/docs");
    const d = await r.json().catch(() => ({ docs: [] }));
    setDocs(d.docs || []);
  }
  useEffect(() => {
    loadDocs();
  }, []);

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setMsg("파일이 너무 큽니다 (최대 256KB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setContent(String(reader.result || ""));
      setFileName(f.name);
      if (!title) setTitle(f.name.replace(EXT_RE, ""));
      setMsg("");
    };
    reader.readAsText(f);
  }

  async function upload(e) {
    e.preventDefault();
    if (!content.trim()) {
      setMsg("먼저 .md 파일을 선택하세요.");
      return;
    }
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/docs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setMsg(d.error || "업로드 실패");
      return;
    }
    setMsg(`업로드 완료: ${d.id}`);
    setTitle("");
    setContent("");
    setFileName("");
    loadDocs();
  }

  // 폴더 선택: .md/.markdown/.txt 만, 크기 초과 제외, 상대경로 유지하여 메모리에 적재
  async function onFolder(e) {
    const all = Array.from(e.target.files || []);
    const picked = all.filter((f) => EXT_RE.test(f.name));
    if (!picked.length) {
      setFolderFiles([]);
      setFolderInfo("폴더에 .md/.markdown/.txt 파일이 없습니다.");
      return;
    }
    let skipped = 0;
    const files = [];
    for (const f of picked) {
      if (f.size > MAX_BYTES) {
        skipped += 1;
        continue;
      }
      const content = await f.text();
      const rel = f.webkitRelativePath || f.name;
      const dir = rel.split("/").slice(0, -1).join("/"); // 파일명 제외 = 폴더 경로
      const t = f.name.replace(EXT_RE, "");
      files.push({ title: t, content, path: dir });
    }
    setFolderFiles(files);
    setFolderMsg("");
    setFolderInfo(
      `선택됨: ${files.length}개 파일${skipped ? ` (256KB 초과 ${skipped}개 제외)` : ""}`
    );
  }

  async function uploadFolder(e) {
    e.preventDefault();
    if (!folderFiles.length) {
      setFolderMsg("먼저 폴더를 선택하세요.");
      return;
    }
    setFolderBusy(true);
    setFolderMsg("");
    const r = await fetch("/api/docs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ files: folderFiles }),
    });
    const d = await r.json().catch(() => ({}));
    setFolderBusy(false);
    // 전부 실패(422)·네트워크 오류 → 실패로 표시. 성공 건수도 함께 안내
    if (!r.ok || d.ok === false) {
      setFolderMsg(d.error || `업로드 실패 (성공 ${d.count || 0}/${d.total || folderFiles.length}건)`);
      loadDocs();
      return;
    }
    const extra = d.truncated ? ` · 상한 초과 ${d.truncated}개 제외` : "";
    setFolderMsg(`업로드 완료: ${d.count}/${d.total}건${extra}`);
    setFolderFiles([]);
    setFolderInfo("");
    if (folderInputRef.current) folderInputRef.current.value = "";
    loadDocs();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  const tree = buildTree(docs);

  return (
    <>
      <form className="card ti-searchbar" onSubmit={upload}>
        <div className="eyebrow gold">마크다운 업로드</div>
        <input
          className="ti-input"
          type="text"
          placeholder="문서 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ marginTop: 12 }}
        />
        <input
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={onFile}
          style={{ marginTop: 12, color: "#9a9a9a" }}
        />
        {fileName && <div className="ti-count">{fileName}</div>}
        <button className="btn btn-on" type="submit" disabled={busy} style={{ marginTop: 12 }}>
          {busy ? "업로드 중…" : "업로드"}
        </button>
        {msg && <div className="note">{msg}</div>}
      </form>

      <form className="card ti-searchbar" onSubmit={uploadFolder}>
        <div className="eyebrow gold">폴더 업로드</div>
        <input
          ref={folderInputRef}
          type="file"
          multiple
          onChange={onFolder}
          style={{ marginTop: 12, color: "#9a9a9a" }}
        />
        {folderInfo && <div className="ti-count">{folderInfo}</div>}
        <button
          className="btn btn-on"
          type="submit"
          disabled={folderBusy || !folderFiles.length}
          style={{ marginTop: 12 }}
        >
          {folderBusy ? "업로드 중…" : "폴더 업로드"}
        </button>
        {folderMsg && <div className="note">{folderMsg}</div>}
      </form>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div className="eyebrow mute">업로드된 문서 ({docs.length})</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button
              type="button"
              className="ti-btn"
              onClick={() => setSortBy((s) => (s === "name" ? "recent" : "name"))}
            >
              {sortBy === "name" ? "이름순" : "최신순"}
            </button>
            <button type="button" className="ti-btn" onClick={expandAll}>
              전체 펼치기
            </button>
            <button type="button" className="ti-btn" onClick={collapseAll}>
              전체 접기
            </button>
          </div>
        </div>
        <div className="ti-list" style={{ marginTop: 12 }}>
          <TreeLevel
            key={treeNonce}
            node={tree}
            depth={0}
            onChanged={loadDocs}
            sortBy={sortBy}
            defaultOpen={allOpen}
          />
          {docs.length === 0 && <div className="ti-empty">아직 업로드된 문서가 없습니다.</div>}
        </div>
      </div>

      <button className="btn btn-off" onClick={logout}>
        로그아웃
      </button>
    </>
  );
}
