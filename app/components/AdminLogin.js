"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (r.ok) {
      window.location.reload();
      return;
    }
    const d = await r.json().catch(() => ({}));
    setErr(d.error || "로그인에 실패했습니다.");
    setBusy(false);
  }

  return (
    <form className="card ti-searchbar" onSubmit={submit}>
      <input
        className="ti-input"
        type="password"
        placeholder="관리자 비밀번호"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        autoComplete="current-password"
      />
      <button className="btn btn-on" type="submit" disabled={busy} style={{ marginTop: 12 }}>
        {busy ? "확인 중…" : "로그인"}
      </button>
      {err && <div className="note" style={{ color: "var(--bloodbright)" }}>{err}</div>}
    </form>
  );
}
