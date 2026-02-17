"use client";

import { useEffect, useMemo, useState } from "react";
import { questions, maxTotal } from "@/lib/questions";
import { signIn, signOut, useSession } from "next-auth/react";

type ExamStateResp = {
  role: "ADMIN" | "USER";
  locked: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  expired: boolean;
  // (ถ้ามีใน API ก็ปล่อยไว้ได้ ไม่มีก็ไม่เป็นไร)
  attemptToken?: string;
};

type ApiOk = {
  id: string;
  name: string;
  totalScore: number;
  maxScore: number;
  percent: number;
  level: string;
  tip: string;
};

function titleForQuestion(raw: string, index1: number) {
  const s = raw.trim();
  if (/^\d+[.)]\s*/.test(s)) return s;
  return `${index1}) ${s}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatMMSS(totalSec: number) {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

export default function Page() {
  const { data: session, status } = useSession();

  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiOk | null>(null);

  const [state, setState] = useState<ExamStateResp | null>(null);

  // ใช้ nowMs ทำให้ countdown เดิน
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const isAuthed = !!session?.user;
  const displayName = (session?.user?.name ?? session?.user?.email ?? "").trim();

  // ✅ ticker: เดินตลอด (ให้ UI อัปเดต)
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // ✅ ดึง state จาก server แบบไม่ cache
  async function loadState() {
    const res = await fetch("/api/exam/state", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("loadState failed:", data);
      return;
    }
    setState(data as ExamStateResp);
  }

  useEffect(() => {
    if (isAuthed) loadState();
  }, [isAuthed]);

  // ✅ คำนวณเวลา: ถ้า state ยังไม่มี expiresAt ให้โชว์ 00:00 แทน (หรือ "กำลังโหลด")
  const secondsLeft = useMemo(() => {
    if (!state?.expiresAt) return 0; // 🔥 ไม่ fallback 30 นาที เพราะจะทำให้ค้าง 30:00
    const end = new Date(state.expiresAt).getTime();
    return Math.max(0, Math.ceil((end - nowMs) / 1000));
  }, [state?.expiresAt, nowMs]);

  const isExpired = (state?.expired ?? false) || secondsLeft <= 0;
  const locked = !!state?.locked;

  // ✅ lock input:
  // - USER: lock ถ้า locked หรือหมดเวลา
  // - ADMIN: ทำได้เสมอ (แต่เวลาเดินปกติ)
  const isLockedForInput = useMemo(() => {
    if (!state) return true;
    if (state.role === "ADMIN") return false;
    return locked || isExpired;
  }, [state, locked, isExpired]);

  const canSubmit = useMemo(() => {
    if (!state || !isAuthed) return false;
    if (!state.expiresAt) return false; // ยังไม่พร้อม
    if (state.role === "USER" && (locked || isExpired)) return false;
    if (isExpired) return false;
    return answers.every((v) => v.trim().length > 0);
  }, [state, isAuthed, answers, locked, isExpired]);

  async function submit() {
    if (!canSubmit || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // แนะนำส่ง meta ไปด้วย (ถ้า backend รับ)
        body: JSON.stringify({
          answers,
          attemptToken: state?.attemptToken,
          startedAt: state?.startedAt,
          expiresAt: state?.expiresAt,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert("ส่งไม่สำเร็จ: " + (data?.error ?? "unknown"));
        return;
      }

      setResult(data as ApiOk);
      await loadState();

      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 30);
    } finally {
      setLoading(false);
    }
  }

  // ✅ admin reset timer: เรียก state?reset=1 แล้ว reload
  async function adminResetTimer() {
    if (state?.role !== "ADMIN") return;
    await fetch("/api/exam/state?reset=1", { cache: "no-store" });
    window.location.reload();
  }

  const answeredCount = answers.filter((a) => a.trim().length > 0).length;

  const timerLabel = useMemo(() => {
    if (!isAuthed) return "—";
    if (!state) return "กำลังโหลด...";
    if (!state.expiresAt) return "กำลังตั้งเวลา...";
    return formatMMSS(secondsLeft);
  }, [isAuthed, state, secondsLeft]);

  return (
    <main
      style={{
        maxWidth: 980,
        margin: "24px auto",
        padding: 16,
        fontFamily: "system-ui",
        color: "#e5e7eb",
        background: "linear-gradient(180deg,#0b1220,#0f172a 45%,#0b1220)",
        minHeight: "100vh",
      }}
    >
      <section
        style={{
          borderRadius: 18,
          padding: 18,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>แบบทดสอบ Mrich</h1>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {status === "loading" ? (
              <span style={{ opacity: 0.8 }}>กำลังโหลด...</span>
            ) : isAuthed ? (
              <>
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.35)",
                    fontSize: 12,
                    fontWeight: 800,
                    maxWidth: 320,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={displayName}
                >
                  {displayName} {state?.role ? <span style={{ opacity: 0.8 }}>({state.role})</span> : null}
                </span>

                <button
                  onClick={() => signOut()}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.22)",
                    background: "transparent",
                    color: "#e5e7eb",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn("google")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            คะแนนเต็ม: {maxTotal}
          </span>

          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ตอบแล้ว: {answeredCount}/{questions.length}
          </span>

          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: isExpired ? "rgba(239,68,68,0.18)" : "rgba(59,130,246,0.18)",
              border: isExpired ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(59,130,246,0.35)",
              fontSize: 12,
              fontWeight: 900,
              marginLeft: "auto",
            }}
          >
            ⏳ {timerLabel}
          </span>

          {state?.role === "USER" && (
            <span
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                background: locked ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.10)",
                border: locked ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.12)",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {locked ? "✅ ส่งแล้ว (ทำได้ครั้งเดียว)" : "📝 ยังไม่ส่ง"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <button
            onClick={submit}
            disabled={!canSubmit || loading || !isAuthed}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: !canSubmit || loading || !isAuthed ? "#94a3b8" : "#06b6d4",
              color: "#001018",
              fontWeight: 900,
              cursor: !canSubmit || loading || !isAuthed ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "กำลังส่ง..." : "ส่งและดูผล"}
          </button>

          {/* ✅ ปุ่ม admin reset timer */}
          {state?.role === "ADMIN" && (
            <button
              onClick={adminResetTimer}
              disabled={loading || !isAuthed}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.22)",
                background: "rgba(59,130,246,0.18)",
                color: "#e5e7eb",
                fontWeight: 900,
                cursor: loading || !isAuthed ? "not-allowed" : "pointer",
              }}
              title="เริ่มเวลา 30 นาทีใหม่ (เฉพาะ admin)"
            >
              เริ่มเวลาใหม่ (admin)
            </button>
          )}
        </div>

        {state?.role === "USER" && (isExpired || locked) && (
          <div style={{ marginTop: 12, color: "#fecaca", fontWeight: 800 }}>
            {locked ? "คุณส่งแล้ว (ทำได้ครั้งเดียว)" : "หมดเวลาแล้ว"} — ติดต่อ Admin เพื่อปลดล็อค
          </div>
        )}
      </section>

      <div style={{ height: 14 }} />

      {questions.map((q, qIdx) => (
        <section
          key={q.id}
          style={{
            background: "#ffffff",
            borderRadius: 18,
            padding: 16,
            border: "1px solid #e5e7eb",
            boxShadow: "0 14px 40px rgba(0,0,0,0.18)",
            marginBottom: 14,
            color: "#0f172a",
            opacity: isLockedForInput ? 0.85 : 1,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16 }}>{titleForQuestion(q.q, qIdx + 1)}</div>

          <textarea
            value={answers[qIdx]}
            onChange={(e) => {
              const next = [...answers];
              next[qIdx] = e.target.value;
              setAnswers(next);
            }}
            placeholder={isLockedForInput ? "แบบฟอร์มถูกล็อก" : "พิมพ์คำตอบที่นี่..."}
            disabled={isLockedForInput}
            style={{
              width: "100%",
              marginTop: 12,
              minHeight: 110,
              padding: 12,
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              outline: "none",
              fontSize: 14,
              lineHeight: 1.5,
              resize: "vertical",
              background: isLockedForInput ? "#f8fafc" : "#ffffff",
            }}
          />
        </section>
      ))}

      {result && (
        <section
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 18,
            border: "1px solid #86efac",
            background: "#f0fdf4",
            color: "#052e16",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>ผลการสอบ</h2>
          <div>
            ผู้ทำ: <b>{result.name}</b>
          </div>
          <div style={{ marginTop: 6 }}>
            คะแนน: <b>{result.totalScore}</b> / {result.maxScore} ({result.percent}%)
          </div>
          <div style={{ marginTop: 6 }}>
            สถานะ: <b>{result.level}</b>
          </div>
          <div style={{ marginTop: 10, fontWeight: 800 }}>{result.tip}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#475569" }}>ID: {result.id}</div>
        </section>
      )}
    </main>
  );
}
