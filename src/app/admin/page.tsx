"use client";

import { useState } from "react";

export default function AdminPage() {
  const [pass, setPass] = useState("");
  const [rows, setRows] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setRows(null);

    const res = await fetch("/api/admin/responses", {
      headers: { "x-admin-password": pass },
      cache: "no-store",
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert("เข้าไม่ได้: " + (data?.error ?? "unauthorized"));
      return;
    }
    setRows(data);
  }

  async function exportCsv() {
    const res = await fetch("/api/admin/export", {
      headers: { "x-admin-password": pass },
    });
    if (!res.ok) {
      alert("Export ไม่สำเร็จ");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mrich_responses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={{ maxWidth: 1000, margin: "24px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Admin: ผลประเมิน</h1>
      <p style={{ color: "#666" }}>ใส่รหัสผ่าน admin เพื่อดูผลและ export CSV</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="ADMIN_PASSWORD"
          style={{ flex: 1, minWidth: 240, padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
        />
        <button onClick={load} style={{ padding: "12px 16px", borderRadius: 12, border: "none", background: "#111", color: "white", fontWeight: 800 }}>
          {loading ? "กำลังโหลด..." : "โหลดผล"}
        </button>
        <button onClick={exportCsv} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #ddd", background: "white", fontWeight: 800 }}>
          Export CSV
        </button>
      </div>

      {rows && (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((r) => (
            <div key={r.id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 12 }}>
              <div style={{ fontWeight: 800 }}>
                {r.name} — {r.percent}% ({r.totalScore}/{r.maxScore}) — <span style={{ color: "#06b6d4" }}>{r.level}</span>
              </div>
              <div style={{ color: "#666", fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
