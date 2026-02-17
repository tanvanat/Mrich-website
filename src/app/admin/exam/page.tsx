"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

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
  latestResponse: {
    id: string;
    userId: string | null;
    createdAt: string;
    totalScore: number;
    maxScore: number;
    percent: number;
    level: string;
    tip: string;
    answersJson: any;
  } | null;
};

type ExamStatesApi = { items: StateItem[] };

function fmt(dt: any) {
  if (!dt) return "-";
  return new Date(dt).toLocaleString();
}

function pctColor(p: number) {
  if (p >= 85) return { bg: "rgba(34,197,94,0.14)", bd: "rgba(34,197,94,0.35)", fg: "#86efac" };
  if (p >= 70) return { bg: "rgba(59,130,246,0.14)", bd: "rgba(59,130,246,0.35)", fg: "#93c5fd" };
  if (p >= 50) return { bg: "rgba(245,158,11,0.14)", bd: "rgba(245,158,11,0.35)", fg: "#fcd34d" };
  return { bg: "rgba(239,68,68,0.14)", bd: "rgba(239,68,68,0.35)", fg: "#fca5a5" };
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  const map = {
    neutral: { bg: "rgba(255,255,255,0.08)", bd: "rgba(255,255,255,0.16)", fg: "#e5e7eb" },
    green: { bg: "rgba(34,197,94,0.14)", bd: "rgba(34,197,94,0.35)", fg: "#86efac" },
    blue: { bg: "rgba(59,130,246,0.14)", bd: "rgba(59,130,246,0.35)", fg: "#93c5fd" },
    amber: { bg: "rgba(245,158,11,0.14)", bd: "rgba(245,158,11,0.35)", fg: "#fcd34d" },
    red: { bg: "rgba(239,68,68,0.14)", bd: "rgba(239,68,68,0.35)", fg: "#fca5a5" },
  }[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${map.bd}`,
        background: map.bg,
        color: map.fg,
        fontSize: 12,
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
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

export default function AdminExamsPage() {
  const { status } = useSession();

  const [data, setData] = useState<AdminApi | null>(null);
  const [statesData, setStatesData] = useState<ExamStatesApi | null>(null);

  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [statesWarn, setStatesWarn] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setStatesWarn(null);

    try {
      // 1) attempts ต้องมาก่อน (เพราะมันคือ "ส่งแล้ว")
      const a = await fetchJson("/api/admin/attempts");
      if (!a.res.ok) {
        alert(
          `โหลด attempts ไม่สำเร็จ: ${a.json?.error ?? a.res.status} ${a.res.statusText}\n${a.text?.slice(
            0,
            200
          )}`
        );
        return;
      }
      setData(a.json as AdminApi);

      // 2) exam-states เป็น optional
      const b = await fetchJson("/api/admin/exam-states");
      if (!b.res.ok) {
        setStatesData({ items: [] });
        setStatesWarn(
          `exam-states ใช้งานไม่ได้ (${b.json?.error ?? b.res.status} ${b.res.statusText})`
        );
        return;
      }
      setStatesData(b.json as ExamStatesApi);
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
    const items = statesData?.items ?? [];

    const inProgress: Row[] = [];

    for (const it of items) {
      const email = (it.user.email ?? "").toLowerCase();
      if (!email) continue;

      const startedAt = it.examState.startedAt ? new Date(it.examState.startedAt) : null;
      if (!startedAt) continue;

      const latest = it.latestResponse;
      const hasSubmittedThisRound = !!latest && new Date(latest.createdAt) >= startedAt;
      if (hasSubmittedThisRound) continue;

      const expired = it.examState.expired;

      inProgress.push({
        id: `INPROGRESS:${it.examState.id}`,
        createdAt: it.examState.startedAt ?? new Date().toISOString(),
        totalScore: 0,
        maxScore: 0,
        percent: 0,
        level: "IN PROGRESS",
        tip: expired ? "หมดเวลาแล้ว (ยังไม่ส่ง)" : "กำลังทำข้อสอบอยู่",
        user: { email: it.user.email, role: it.user.role, name: it.user.name },
        answersJson: {
          _meta: {
            startedAt: it.examState.startedAt,
            expiresAt: it.examState.expiresAt,
            expired,
          },
        },
      });
    }

    const merged = [...inProgress, ...responses];

    const q = query.trim().toLowerCase();
    if (!q) return merged;
    return merged.filter((r) => (r.user?.email ?? "").toLowerCase().includes(q));
  }, [data, statesData, query]);

  const total = data?.responses?.length ?? 0;

  const uniqueUsers = useMemo(() => {
    const s = new Set<string>();
    for (const r of data?.responses ?? []) {
      const e = (r.user?.email ?? "").toLowerCase();
      if (e) s.add(e);
    }
    for (const it of statesData?.items ?? []) {
      const e = (it.user.email ?? "").toLowerCase();
      if (e) s.add(e);
    }
    return s.size;
  }, [data, statesData]);

  const inProgressCount = useMemo(
    () => rows.filter((r) => r.level === "IN PROGRESS").length,
    [rows]
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 22,
        fontFamily: "system-ui",
        color: "#e5e7eb",
        background:
          "radial-gradient(1200px 700px at 15% 10%, rgba(56,189,248,0.18), transparent 55%), radial-gradient(900px 600px at 80% 20%, rgba(167,139,250,0.16), transparent 55%), linear-gradient(180deg,#060914,#0b1220 45%, #060914)",
      }}
    >
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: 18,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.06)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.42)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 950 }}>Admin Dashboard — Exam</h1>
            <p style={{ margin: "8px 0 0", opacity: 0.85 }}>
              ดูผลสอบ + เห็นคนกำลังทำ + ปลดล็อคให้ทำใหม่
            </p>
            {statesWarn && (
              <p style={{ margin: "8px 0 0", color: "#fcd34d", fontWeight: 800 }}>
                ⚠ {statesWarn}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Badge>{`Attempts: ${total}`}</Badge>
            <Badge tone="blue">{`Users: ${uniqueUsers}`}</Badge>
            <Badge tone="amber">{`In progress: ${inProgressCount}`}</Badge>

            <button
              onClick={load}
              disabled={loading}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.16)",
                background: loading ? "rgba(148,163,184,0.55)" : "rgba(255,255,255,0.10)",
                color: "#e5e7eb",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 900,
              }}
            >
              {loading ? "กำลังโหลด..." : "รีเฟรชข้อมูล"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา email เช่น abc@gmail.com"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(2,6,23,0.55)",
                color: "#e5e7eb",
                outline: "none",
              }}
            />
          </div>
        </div>
      </section>

      <div style={{ height: 14 }} />

      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1120 }}>
            <thead>
              <tr>
                {["User", "Status", "Started", "Submitted", "Score", "Percent", "Level", "Action"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      fontSize: 12,
                      color: "rgba(229,231,235,0.8)",
                      background: "rgba(2,6,23,0.55)",
                      borderBottom: "1px solid rgba(255,255,255,0.10)",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r, idx) => {
                const email = (r.user?.email ?? "").toLowerCase();
                const st = email ? data?.stateMap?.[email] : null;

                const startedAtMeta = r.answersJson?._meta?.startedAt ?? null;
                const role = st?.role ?? r.user?.role ?? "USER";
                const locked = st?.locked ?? false;

                const isInProgress = r.level === "IN PROGRESS";
                const expired = !!r.answersJson?._meta?.expired;

                const pct = Math.round(r.percent);
                const tone = isInProgress
                  ? expired
                    ? "red"
                    : "amber"
                  : pct >= 85
                    ? "green"
                    : pct >= 70
                      ? "blue"
                      : pct >= 50
                        ? "amber"
                        : "red";

                const pc = isInProgress ? pctColor(expired ? 0 : 55) : pctColor(pct);

                return (
                  <tr key={r.id} style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 900 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 14 }}>{r.user?.email ?? "-"}</span>
                        <span style={{ fontSize: 12, opacity: 0.75 }}>{r.user?.name ?? ""}</span>
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <Badge tone={role === "ADMIN" ? "blue" : "neutral"}>{role}</Badge>
                        {role === "USER" ? (
                          <Badge tone={locked ? "green" : "neutral"}>{locked ? "LOCKED" : "OPEN"}</Badge>
                        ) : (
                          <Badge tone="neutral">∞</Badge>
                        )}
                        {isInProgress && <Badge tone={expired ? "red" : "amber"}>{expired ? "TIMEOUT" : "IN PROGRESS"}</Badge>}
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {fmt(startedAtMeta ?? st?.startedAt)}
                    </td>

                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {isInProgress ? "-" : fmt(r.createdAt)}
                    </td>

                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {isInProgress ? "-" : (
                        <>
                          <span style={{ fontWeight: 950 }}>{r.totalScore}</span>
                          <span style={{ opacity: 0.75 }}> / {r.maxScore}</span>
                        </>
                      )}
                    </td>

                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: `1px solid ${pc.bd}`,
                          background: pc.bg,
                          color: pc.fg,
                          fontWeight: 950,
                          fontSize: 12,
                          minWidth: 64,
                        }}
                      >
                        {isInProgress ? (expired ? "0%" : "—") : `${pct}%`}
                      </span>
                    </td>

                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <Badge tone={tone as any}>{r.level}</Badge>
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>{r.tip}</div>
                    </td>

                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <button
                        onClick={() => unlock(r.user?.email ?? "")}
                        disabled={!r.user?.email || unlocking === (r.user?.email ?? "").toLowerCase() || role === "ADMIN"}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background:
                            role === "ADMIN"
                              ? "rgba(148,163,184,0.25)"
                              : "linear-gradient(180deg, rgba(34,197,94,0.90), rgba(22,163,74,0.90))",
                          color: role === "ADMIN" ? "rgba(229,231,235,0.65)" : "#052e16",
                          fontWeight: 950,
                          cursor: role === "ADMIN" ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {unlocking === (r.user?.email ?? "").toLowerCase() ? "กำลังปลด..." : "ปลดล็อค"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 16, color: "rgba(229,231,235,0.7)" }}>
                    ยังไม่มีข้อมูล หรือไม่พบ email ที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
