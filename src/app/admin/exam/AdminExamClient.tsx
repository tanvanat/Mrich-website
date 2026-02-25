// src/app/admin/exam/AdminExamClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { questions } from "@/lib/questions";

type Row = {
  id: string;
  createdAt: string;
  totalScore: number;
  maxScore: number;
  percent: number;
  level: string;
  tip: string;
  user: { email: string | null; role: "USER" | "ADMIN"; name: string | null } | null;
  answersJson: any;
};

type AdminApi = {
  responses: Row[];
  stateMap: Record<string, { role: "USER" | "ADMIN"; locked: boolean; startedAt: string | null; updatedAt: string }>;
};

type MeResp =
  | { authed: true; nick: string; role: "ADMIN" | "USER" }
  | { authed: false };

const MAX_SCORES = [
  2, 9, 9, 2, 2, 2, 4, 4, 4, 2, 2, 2, 6, 2, 4,
  5, 2, 2, 9, 2, 4, 3, 2, 2, 2, 3, 2, 2, 2, 2,
] as const;

const TOTAL_MAX = MAX_SCORES.reduce((sum, v) => sum + v, 0);

function fmt(dt: any) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

async function fetchJson<T = any>(url: string): Promise<{ res: Response; json: T | null }> {
  const res = await fetch(url, { cache: "no-store", credentials: "include" });
  let json: T | null = null;
  try {
    json = await res.json();
  } catch {}
  return { res, json };
}

function normalizeAnswers(answersJson: any): string[] {
  const raw = answersJson?.answers ?? [];
  return Array.isArray(raw) ? raw.map((a: any) => String(a ?? "").trim()) : [];
}

function normalizeNick(v: string) {
  return (v || "").trim().toLowerCase().replace(/[^a-z]/g, "");
}

export default function AdminExamClient() {
  const [isAdmin, setIsAdmin] = useState(false);

  const [data, setData] = useState<AdminApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openRow, setOpenRow] = useState<Row | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // ✅ เช็คสิทธิ์ admin จาก backend (cookie -> role)
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : ({ authed: false } as MeResp)))
      .then((me: MeResp) => setIsAdmin((me as any)?.authed === true && (me as any).role === "ADMIN"))
      .catch(() => setIsAdmin(false));
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { res, json } = await fetchJson<AdminApi>("/api/admin/attempts");
      if (!res.ok) {
        const err = (json as any)?.error || "โหลดข้อมูลไม่ได้";
        alert(err);
        return;
      }
      if (json) setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!openRow) return;
    const existing = openRow.answersJson?.scores ?? [];
    const answers = normalizeAnswers(openRow.answersJson);
    const initial = answers.map((_, i) => (typeof existing[i] === "number" && !isNaN(existing[i]) ? existing[i] : 0));
    setScores(initial);
  }, [openRow]);

  async function unlockByNickname(nickname: string) {
    const nick = normalizeNick(nickname);
    if (!nick) return;

    setUnlocking(nick);
    try {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nickname: nick }),
      });
      const out = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(`ปลดล็อคไม่สำเร็จ: ${out?.error ?? "unknown"}`);
        return;
      }

      await load();
      alert(`ปลดล็อคแล้ว: ${nick}`);
    } finally {
      setUnlocking(null);
    }
  }

  async function saveScores() {
    if (!openRow?.id) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          responseId: openRow.id,
          scores,
          total: scores.reduce((a, b) => a + b, 0),
          maxTotal: TOTAL_MAX,
        }),
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`บันทึกไม่สำเร็จ: ${out?.error ?? "unknown"}`);
        return;
      }

      alert("บันทึกคะแนนเรียบร้อย!");
      await load();
      setOpenRow(null);
    } finally {
      setSaving(false);
    }
  }

  const rows = useMemo(() => {
    const responses = data?.responses ?? [];
    const latestByEmail = new Map<string, Row>();

    responses.forEach((r) => {
      const email = (r.user?.email ?? "").trim().toLowerCase();
      if (!email) return;
      const prev = latestByEmail.get(email);
      if (!prev || new Date(r.createdAt).getTime() > new Date(prev.createdAt).getTime()) {
        latestByEmail.set(email, r);
      }
    });

    let result = Array.from(latestByEmail.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const q = query.trim().toLowerCase();
    if (q) result = result.filter((r) => (r.user?.email ?? "").toLowerCase().includes(q));

    return result;
  }, [data, query]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-blue-100 pb-20">
      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-blue-500/20 p-6 shadow-2xl mb-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-bold">Admin — Exam Scoring</h1>

            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1 rounded-full ${isAdmin ? "bg-emerald-900/50 text-emerald-200" : "bg-rose-900/50 text-rose-200"}`}>
                {isAdmin ? "ADMIN" : "NOT ADMIN"}
              </span>

              <button
                onClick={load}
                disabled={loading}
                className={`px-6 py-2 rounded-full font-medium ${
                  loading ? "bg-gray-600 cursor-wait" : "bg-blue-600 hover:bg-blue-500"
                } text-white transition`}
              >
                {loading ? "กำลังโหลด..." : "รีเฟรช"}
              </button>
            </div>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาด้วยอีเมล..."
            className="mt-4 w-full px-4 py-3 rounded-xl bg-black/40 border border-blue-500/30 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="rounded-2xl overflow-hidden border border-blue-500/20 bg-white/5 backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/50">
                <tr>
                  <th className="p-4 text-left">อีเมล / ชื่อ</th>
                  <th className="p-4 text-left">ส่งเมื่อ</th>
                  <th className="p-4 text-left">สถานะ</th>
                  <th className="p-4 text-left">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const email = (r.user?.email ?? "").toLowerCase();
                  const locked = data?.stateMap?.[email]?.locked ?? false;
                  const role = data?.stateMap?.[email]?.role ?? r.user?.role ?? "USER";

                  // nickname ของ user ในระบบคุณ = user.name (ตอน create user by nick คุณตั้ง name = nick)
                  const nickname = normalizeNick(r.user?.name ?? "");

                  const showUnlock = isAdmin && locked && role !== "ADMIN" && !!nickname;

                  return (
                    <tr key={r.id} className="border-t border-blue-500/10 hover:bg-white/5">
                      <td className="p-4">
                        <div className="font-medium">{r.user?.email ?? "—"}</div>
                        <div className="text-xs text-blue-300">{r.user?.name ?? ""}</div>
                      </td>

                      <td className="p-4">{fmt(r.createdAt)}</td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            locked ? "bg-emerald-900/50 text-emerald-200" : "bg-amber-900/50 text-amber-200"
                          }`}
                        >
                          {locked ? "LOCKED" : "OPEN"}
                        </span>
                      </td>

                      <td className="p-4 space-x-2">
                        <button
                          onClick={() => setOpenRow(r)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white"
                        >
                          ดู & ให้คะแนน
                        </button>

                        {showUnlock && (
                          <button
                            onClick={() => unlockByNickname(nickname)}
                            disabled={unlocking === nickname}
                            className={`px-4 py-2 rounded-full text-white ${
                              unlocking === nickname ? "bg-gray-600 cursor-wait" : "bg-emerald-600 hover:bg-emerald-500"
                            }`}
                            title={`unlock ${nickname}`}
                          >
                            {unlocking === nickname ? "กำลังปลด..." : "Unlock"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-blue-300">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setOpenRow(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-slate-950/95 backdrop-blur-xl rounded-2xl border border-blue-500/30 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-blue-500/20 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">ให้คะแนน — {openRow.user?.email ?? "—"}</h2>
                <p className="text-blue-300 mt-1">ส่งเมื่อ: {fmt(openRow.createdAt)}</p>
              </div>
              <button className="text-4xl text-blue-300 hover:text-white" onClick={() => setOpenRow(null)}>
                ×
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {normalizeAnswers(openRow.answersJson).map((ans, i) => {
                const max = MAX_SCORES[i] ?? 0;
                const questionText = (questions as any[])[i]?.q || `(ข้อ ${i + 1} - ไม่พบคำถามในระบบ)`;

                return (
                  <div key={i} className="p-5 rounded-xl bg-black/50 border border-blue-600/30">
                    <div className="mb-4">
                      <div className="text-blue-100/90 leading-relaxed whitespace-pre-wrap border-l-4 border-blue-500/60 pl-4 py-2 bg-slate-900/30">
                        {questionText}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm uppercase text-blue-400/80 mb-1 font-medium">คำตอบของผู้ใช้</div>
                      <div className="whitespace-pre-wrap text-blue-50 leading-relaxed bg-slate-900/60 p-4 rounded border border-slate-700/50">
                        {ans || "— ไม่มีคำตอบ —"}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="text-blue-200 font-medium min-w-[80px]">ให้คะแนน:</label>
                      <input
                        type="number"
                        min={0}
                        max={max}
                        value={scores[i] ?? 0}
                        onChange={(e) => {
                          let v = Number(e.target.value);
                          v = isNaN(v) ? 0 : Math.max(0, Math.min(max, v));
                          const ns = [...scores];
                          ns[i] = v;
                          setScores(ns);
                        }}
                        className="w-20 text-center bg-slate-800 border border-blue-500/50 rounded py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-blue-300 font-medium">/ {max}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-blue-500/20 bg-gradient-to-r from-blue-950/60 to-indigo-950/50">
              <div className="flex flex-wrap justify-between items-center gap-6 text-xl font-bold text-white">
                <div>
                  รวมคะแนน:{" "}
                  <span className="text-3xl text-cyan-300 ml-2">{scores.reduce((a, b) => a + b, 0)}</span>
                  <span className="text-cyan-400 ml-1">/ {TOTAL_MAX}</span>
                </div>
                <div>
                  เปอร์เซ็นต์:{" "}
                  <span className="text-3xl text-cyan-300 ml-2">
                    {TOTAL_MAX > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / TOTAL_MAX) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-blue-500/20 flex justify-end gap-4">
              <button
                onClick={() => setOpenRow(null)}
                className="px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition"
              >
                ปิด
              </button>
              <button
                onClick={saveScores}
                disabled={saving}
                className={`px-8 py-3 rounded-full font-bold ${
                  saving ? "bg-gray-600 cursor-wait" : "bg-cyan-600 hover:bg-cyan-500"
                } text-white shadow-lg shadow-cyan-700/30 transition`}
              >
                {saving ? "กำลังบันทึก..." : "บันทึกคะแนน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}