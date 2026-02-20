"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

/* ================= TYPES ================= */

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
  stateMap: Record<
    string,
    { role: "USER" | "ADMIN"; locked: boolean; startedAt: string | null; updatedAt: string }
  >;
};

type StateItem = {
  user: { id: string; email: string | null; name: string | null; role: "USER" | "ADMIN" };
  examState: {
    id: string;
    startedAt: string | null;
    expiresAt: string | null;
    expired: boolean;
    locked: boolean;
    updatedAt: string;
  };
  latestResponse: Row | null;
};

type ExamStatesApi = { items: StateItem[] };

/* ================= HELPERS ================= */

function fmt(dt: any) {
  if (!dt) return "-";
  return new Date(dt).toLocaleString();
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { res, json, text };
}

function toPrettyJson(value: any) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? "");
  }
}

function normalizeAnswers(answersJson: any): { meta: any; answers: any[] } {
  const meta = answersJson?._meta ?? null;
  const answers = Array.isArray(answersJson?.answers) ? answersJson.answers : [];
  return { meta, answers };
}

/* ================= COMPONENT ================= */

export default function AdminExamsPage() {
  const { status, data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const [data, setData] = useState<AdminApi | null>(null);
  const [statesData, setStatesData] = useState<ExamStatesApi | null>(null);

  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [openRow, setOpenRow] = useState<Row | null>(null);

  async function load() {
    setLoading(true);
    try {
      const a = await fetchJson("/api/admin/attempts");
      if (a.res.ok) setData(a.json as AdminApi);

      const b = await fetchJson("/api/admin/exam-states");
      if (b.res.ok) setStatesData(b.json as ExamStatesApi);
      else setStatesData({ items: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  async function unlock(email: string) {
    const e = (email ?? "").trim().toLowerCase();
    if (!e) return;

    setUnlocking(e);
    try {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert("ปลดล็อคไม่สำเร็จ: " + (j?.error ?? "unknown"));
        return;
      }
      await load();
      alert("ปลดล็อคแล้ว: " + e);
    } finally {
      setUnlocking(null);
    }
  }

  const rows = useMemo(() => {
    const responses = data?.responses ?? [];

    // ✅ 1 user = 1 row (latest only)
    const latestByEmail = new Map<string, Row>();

    for (const r of responses) {
      const email = (r.user?.email ?? "").toLowerCase();
      if (!email) continue;

      const prev = latestByEmail.get(email);
      if (!prev) {
        latestByEmail.set(email, r);
        continue;
      }

      if (new Date(r.createdAt).getTime() > new Date(prev.createdAt).getTime()) {
        latestByEmail.set(email, r);
      }
    }

    const merged = Array.from(latestByEmail.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const q = query.trim().toLowerCase();
    if (!q) return merged;
    return merged.filter((r) => (r.user?.email ?? "").toLowerCase().includes(q));
  }, [data, query]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-blue-100">
      {/* keyframes */}
      <style jsx global>{`
        @keyframes flowerFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-18px) rotate(4deg);
          }
        }
        @keyframes flowerGlow {
          0%,
          100% {
            filter: drop-shadow(0 0 8px rgba(96, 165, 250, 0.35));
          }
          50% {
            filter: drop-shadow(0 0 18px rgba(96, 165, 250, 0.75));
          }
        }
      `}</style>

      {/* Flowers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 right-24 opacity-20 animate-[flowerFloat_5s_ease-in-out_infinite]">
          <svg width="300" height="300" viewBox="0 0 100 100" className="animate-[flowerGlow_3s_ease-in-out_infinite]">
            <g transform="translate(50,50)">
              {[0, 60, 120, 180, 240, 300].map((d, i) => (
                <ellipse key={i} rx="20" ry="35" fill="#3b82f6" transform={`rotate(${d})`} />
              ))}
              <circle r="12" fill="#1e3a8a" />
              <circle r="7" fill="#93c5fd" />
            </g>
          </svg>
        </div>

        <div className="absolute bottom-20 -left-10 opacity-15 animate-[flowerFloat_8s_ease-in-out_infinite]">
          <svg width="240" height="240" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 72, 144, 216, 288].map((d, i) => (
                <ellipse key={i} rx="18" ry="30" fill="#60a5fa" transform={`rotate(${d})`} />
              ))}
              <circle r="10" fill="#1e40af" />
              <circle r="6" fill="#bfdbfe" />
            </g>
          </svg>
        </div>
      </div>

      <div className="absolute inset-0 bg-black/30" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        {/* Header Card */}
        <div className="rounded-2xl border border-blue-400/20 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex justify-between flex-wrap gap-4 items-start">
            <div>
              <h1 className="text-3xl font-bold font-serif drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]">
                Admin Dashboard — Exam
              </h1>

              <p className="text-xs text-blue-200/60 mt-2">
                Logged in as:{" "}
                <span className="font-bold text-blue-100">
                  {session?.user?.email ?? session?.user?.name ?? "-"}
                </span>{" "}
                {isAdmin ? (
                  <span className="ml-2 px-2 py-0.5 rounded-full border border-blue-300/20 bg-white/5 text-blue-100 font-bold">
                    ADMIN
                  </span>
                ) : (
                  <span className="ml-2 px-2 py-0.5 rounded-full border border-blue-300/20 bg-white/5 text-blue-200/70 font-bold">
                    USER
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={load}
              disabled={loading}
              className={`rounded-full px-4 py-2 font-semibold text-white transition shadow-lg
                ${
                  loading
                    ? "bg-white/10 text-blue-200/60 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-400 shadow-blue-500/30"
                }`}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email..."
            className="mt-4 w-full rounded-xl bg-black/40 border border-blue-400/20 px-4 py-2 text-blue-100 placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table Card */}
        <div className="mt-8 rounded-2xl border border-blue-400/20 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-black/40 text-blue-200">
                <tr>
                  <th className="p-4 text-left">User</th>
                  <th className="p-4 text-left">Submitted</th>
                  <th className="p-4 text-left">Score</th>
                  <th className="p-4 text-left">Percent</th>
                  <th className="p-4 text-left">Level</th>
                  <th className="p-4 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, idx) => {
                  const email = (r.user?.email ?? "").toLowerCase();
                  const st = email ? data?.stateMap?.[email] : null;
                  const locked = st?.locked ?? false;

                  return (
                    <tr
                      key={r.id}
                      className={`border-t border-blue-400/10 ${
                        idx % 2 === 0 ? "bg-white/5" : "bg-white/0"
                      } hover:bg-white/10 transition cursor-pointer`}
                      onClick={() => setOpenRow(r)}
                    >
                      <td className="p-4">
                        <div className="font-semibold text-blue-50">{r.user?.email ?? "-"}</div>
                        <div className="text-xs text-blue-200/60">{r.user?.name ?? ""}</div>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <span className="text-[11px] px-2 py-0.5 rounded-full border border-blue-300/15 bg-white/5">
                            {r.user?.role ?? "USER"}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border ${
                              locked
                                ? "border-emerald-300/25 bg-emerald-500/10 text-emerald-200"
                                : "border-blue-300/15 bg-white/5 text-blue-200/70"
                            }`}
                          >
                            {locked ? "LOCKED" : "OPEN"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">{fmt(r.createdAt)}</td>

                      {/* ✅ placeholders */}
                      <td className="p-4 font-bold">-</td>
                      <td className="p-4">-</td>
                      <td className="p-4 text-blue-100 font-semibold">-</td>

                      <td className="p-4">
                        <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 border border-blue-300/15 text-blue-100 font-semibold transition"
                            onClick={() => setOpenRow(r)}
                          >
                            View
                          </button>

                          {isAdmin && (
                            <button
                              disabled={
                                !r.user?.email ||
                                unlocking === email ||
                                r.user?.role === "ADMIN" ||
                                !locked // ✅ ถ้า user เดิม “OPEN” ต้องส่ง/lock ก่อน ถึงจะปลดล็อคได้
                              }
                              onClick={() => unlock(r.user?.email ?? "")}
                              className={`rounded-full px-4 py-2 font-extrabold transition border
                                ${
                                  r.user?.role === "ADMIN"
                                    ? "bg-white/10 text-blue-200/50 border-blue-200/15 cursor-not-allowed"
                                    : !locked
                                      ? "bg-white/10 text-blue-200/50 border-blue-200/15 cursor-not-allowed"
                                      : unlocking === email
                                        ? "bg-emerald-500/40 text-emerald-100 border-emerald-300/25 cursor-wait"
                                        : "bg-emerald-500/80 hover:bg-emerald-500 text-emerald-950 border-emerald-300/30 shadow-lg shadow-emerald-500/15"
                                }`}
                              title={!locked ? "ต้องเป็นสถานะ LOCKED ก่อนถึงจะ Unlock ได้" : "Unlock"}
                            >
                              {unlocking === email ? "Unlocking..." : "Unlock"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-blue-200/60">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= MODAL: VIEW ANSWERS ================= */}
      {openRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenRow(null)}
        >
          <div className="absolute inset-0 bg-black/60" />

          <div
            className="relative w-full max-w-3xl rounded-2xl border border-blue-400/20 bg-slate-950/70 backdrop-blur-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-blue-300/10 flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-serif font-bold text-2xl">
                  Answers — {openRow.user?.email ?? "-"}
                </div>
                <div className="text-blue-200/70 text-sm mt-1">
                  Submitted: {fmt(openRow.createdAt)} • Score: <span className="font-bold text-blue-100">-</span> •
                  Percent: <span className="font-bold text-blue-100">-</span> • Level:{" "}
                  <span className="font-bold text-blue-100">-</span>
                </div>
              </div>

              <button
                className="text-blue-200/80 hover:text-white text-2xl leading-none"
                aria-label="close"
                onClick={() => setOpenRow(null)}
              >
                ×
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {/* ✅ numbered answers view */}
              {(() => {
                const { meta, answers } = normalizeAnswers(openRow.answersJson);
                return (
                  <div className="space-y-4">
                    {/* meta */}
                    <div className="rounded-xl border border-blue-300/15 bg-black/35 overflow-hidden">
                      <div className="px-4 py-3 text-xs text-blue-200/70 border-b border-blue-300/10 font-bold">
                        _meta
                      </div>
                      <pre className="p-4 text-xs sm:text-sm text-blue-100/90 overflow-auto max-h-[18vh]">
{toPrettyJson(meta)}
                      </pre>
                    </div>

                    {/* answers list */}
                    <div className="rounded-xl border border-blue-300/15 bg-black/40 overflow-hidden">
                      <div className="px-4 py-3 text-xs text-blue-200/70 border-b border-blue-300/10 flex justify-between items-center">
                        <span className="font-bold">answers (numbered)</span>
                        <button
                          className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20 border border-blue-300/15 text-blue-100 text-xs font-bold transition"
                          onClick={async () => {
                            const lines = answers.map((a, i) => `${i + 1}. ${String(a ?? "").trim()}`);
                            await navigator.clipboard.writeText(lines.join("\n"));
                            alert("Copied numbered answers ✅");
                          }}
                        >
                          Copy
                        </button>
                      </div>

                      <div className="max-h-[45vh] overflow-auto divide-y divide-blue-300/10">
                        {answers.length === 0 ? (
                          <div className="p-4 text-sm text-blue-200/70">No answers array found.</div>
                        ) : (
                          answers.map((ans, i) => (
                            <div key={i} className="p-4">
                              <div className="text-xs font-extrabold text-blue-200/80">
                                {i + 1}.
                              </div>
                              <div className="mt-1 whitespace-pre-wrap text-sm text-blue-100/90">
                                {String(ans ?? "").trim() || "-"}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* raw json (optional) */}
                    <div className="rounded-xl border border-blue-300/15 bg-black/40 overflow-hidden">
                      <div className="px-4 py-3 text-xs text-blue-200/70 border-b border-blue-300/10 flex justify-between items-center">
                        <span className="font-bold">answersJson (raw)</span>
                        <button
                          className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20 border border-blue-300/15 text-blue-100 text-xs font-bold transition"
                          onClick={async () => {
                            const text = toPrettyJson(openRow.answersJson);
                            await navigator.clipboard.writeText(text);
                            alert("Copied answersJson ✅");
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="p-4 text-xs sm:text-sm text-blue-100/90 overflow-auto max-h-[22vh]">
{toPrettyJson(openRow.answersJson)}
                      </pre>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-full px-5 py-2 bg-white/10 hover:bg-white/20 border border-blue-300/15 text-blue-100 font-semibold transition"
                  onClick={() => setOpenRow(null)}
                >
                  Close
                </button>

                {isAdmin && openRow.user?.email && openRow.user?.role !== "ADMIN" && (
                  (() => {
                    const email = openRow.user.email.toLowerCase();
                    const st = data?.stateMap?.[email];
                    const locked = st?.locked ?? false;

                    return (
                      <button
                        disabled={!locked || unlocking === email}
                        className={`rounded-full px-5 py-2 font-extrabold transition border
                          ${
                            !locked
                              ? "bg-white/10 text-blue-200/50 border-blue-200/15 cursor-not-allowed"
                              : unlocking === email
                                ? "bg-emerald-500/40 text-emerald-100 border-emerald-300/25 cursor-wait"
                                : "bg-emerald-500/80 hover:bg-emerald-500 text-emerald-950 border-emerald-300/30 shadow-lg shadow-emerald-500/15"
                          }`}
                        onClick={() => unlock(openRow.user!.email!)}
                        title={!locked ? "ต้องเป็นสถานะ LOCKED ก่อนถึงจะ Unlock ได้" : "Unlock"}
                      >
                        {unlocking === email ? "Unlocking..." : "Unlock this user"}
                      </button>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
