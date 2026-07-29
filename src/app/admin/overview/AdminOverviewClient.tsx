"use client";

import { useEffect, useMemo, useState } from "react";

type UserRole = "USER" | "ADMIN";
type CourseStatus = "locked" | "in_progress" | "expired" | "not_started";
type FunnelStage = "doing" | "locked" | "expired" | "login";

type CourseCell = {
  formId: string;
  courseKey: string;
  label: string;
  status: CourseStatus;
  locked: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  latestPercent: number | null;
  latestLevel: string | null;
  latestSubmittedAt: string | null;
};

type OverviewRow = {
  id: string;
  nick: string;
  displayName: string;
  role: UserRole;
  latestStatus: { stage: FunnelStage; courses: string[] };
  lastActivityAt: string | null;
  courses: CourseCell[];
};

type OverviewApi = { items: OverviewRow[] };

const AUTO_REFRESH_MS = 15000;

function fmt(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

const STATUS_STYLE: Record<CourseStatus, { label: string; className: string }> = {
  locked: { label: "LOCKED", className: "bg-emerald-900/50 text-emerald-200" },
  in_progress: { label: "กำลังทำอยู่ตอนนี้", className: "bg-cyan-900/60 text-cyan-200 animate-pulse" },
  expired: { label: "หมดเวลา (ยังไม่ล็อก)", className: "bg-rose-900/50 text-rose-200" },
  not_started: { label: "ยังไม่เริ่ม", className: "bg-slate-800/60 text-slate-300" },
};

function funnelBadge(latestStatus: OverviewRow["latestStatus"]) {
  switch (latestStatus.stage) {
    case "doing":
      return {
        text: `กำลังทำ ${latestStatus.courses.join(", ")} อยู่`,
        className: "bg-cyan-900/60 text-cyan-200 animate-pulse",
      };
    case "locked":
      return {
        text: `Locked: ${latestStatus.courses.join(", ")}`,
        className: "bg-emerald-900/50 text-emerald-200",
      };
    case "expired":
      return {
        text: `หมดเวลา: ${latestStatus.courses.join(", ")}`,
        className: "bg-rose-900/50 text-rose-200",
      };
    default:
      return { text: "Signed in — ยังไม่เริ่มคอร์สไหน", className: "bg-slate-800/60 text-slate-300" };
  }
}

export default function AdminOverviewClient() {
  const [data, setData] = useState<OverviewApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store", credentials: "include" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert((json as any)?.error || "โหลดข้อมูลไม่ได้");
        return;
      }
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  async function unlock(nick: string, courseKey: string | null) {
    const busyId = `${nick}:${courseKey ?? "all"}`;
    setBusyKey(busyId);
    try {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nickname: nick, ...(courseKey ? { course: courseKey } : {}) }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`ปลดล็อกไม่สำเร็จ: ${out?.error ?? "unknown"}`);
        return;
      }
      await load();
    } finally {
      setBusyKey(null);
    }
  }

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => r.displayName.toLowerCase().includes(q) || r.nick.includes(q));
  }, [data, query]);

  return (
    <div className="relative min-h-screen text-blue-100 pb-20">
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-blue-500/20 p-6 shadow-2xl mb-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Admin — Overview (Live status)</h1>
              <p className="text-blue-300/80 text-sm mt-1">
                รีเฟรชอัตโนมัติทุก {AUTO_REFRESH_MS / 1000} วินาที — สถานะล่าสุดของแต่ละคน:
                signed in → กำลังทำคอร์ส → locked (ส่งแล้ว)
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className={`px-6 py-2 rounded-full font-medium transition text-white ${
                loading ? "bg-gray-600 cursor-wait" : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {loading ? "กำลังโหลด..." : "รีเฟรชตอนนี้"}
            </button>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาด้วยชื่อ..."
            className="mt-4 w-full px-4 py-3 rounded-xl bg-black/40 border border-blue-500/30 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="rounded-2xl overflow-hidden border border-blue-500/20 bg-white/5 backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/50">
                <tr>
                  <th className="p-4 text-left">ชื่อ</th>
                  <th className="p-4 text-left">สถานะล่าสุด</th>
                  <th className="p-4 text-left">Course 1</th>
                  <th className="p-4 text-left">Course 2</th>
                  <th className="p-4 text-left">Course 3</th>
                  <th className="p-4 text-left">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const showUnlock = r.role !== "ADMIN";
                  const badge = funnelBadge(r.latestStatus);
                  return (
                    <tr key={r.id} className="border-t border-blue-500/10 hover:bg-white/5 align-top">
                      <td className="p-4 font-medium">
                        <div>{r.displayName}</div>
                        <div className="text-xs text-blue-400/70">{r.role}</div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                          {badge.text}
                        </span>
                        <div className="text-[10px] text-blue-500/50 mt-1">
                          กิจกรรมล่าสุด: {fmt(r.lastActivityAt)}
                        </div>
                      </td>

                      {r.courses.map((c) => {
                        const style = STATUS_STYLE[c.status];
                        const canUnlock = showUnlock && (c.status === "locked" || c.status === "expired");
                        const busyId = `${r.nick}:${c.courseKey}`;
                        return (
                          <td key={c.formId} className="p-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${style.className}`}>
                              {style.label}
                            </span>
                            {c.latestPercent !== null && (
                              <div className="text-xs text-blue-300 mt-1">
                                ล่าสุด: {c.latestPercent}% ({c.latestLevel})
                              </div>
                            )}
                            {c.status === "in_progress" && c.expiresAt && (
                              <div className="text-[10px] text-cyan-400/80 mt-1">
                                หมดเวลา: {fmt(c.expiresAt)}
                              </div>
                            )}
                            {canUnlock && (
                              <button
                                onClick={() => unlock(r.nick, c.courseKey)}
                                disabled={busyKey === busyId}
                                className={`mt-2 block px-3 py-1.5 rounded-full text-xs font-bold text-white transition ${
                                  busyKey === busyId
                                    ? "bg-gray-600 cursor-wait"
                                    : "bg-emerald-600 hover:bg-emerald-500"
                                }`}
                              >
                                {busyKey === busyId ? "กำลังปลด..." : "Unlock"}
                              </button>
                            )}
                          </td>
                        );
                      })}

                      <td className="p-4">
                        {showUnlock && (
                          <button
                            onClick={() => unlock(r.nick, null)}
                            disabled={busyKey === `${r.nick}:all`}
                            className={`px-4 py-2 rounded-full text-white font-medium transition ${
                              busyKey === `${r.nick}:all`
                                ? "bg-gray-600 cursor-wait"
                                : "bg-indigo-600 hover:bg-indigo-500"
                            }`}
                          >
                            {busyKey === `${r.nick}:all` ? "กำลังปลด..." : "Unlock ทั้ง 3 คอร์ส"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-blue-300">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
