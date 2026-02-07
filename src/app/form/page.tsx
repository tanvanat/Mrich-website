"use client";

import { useMemo, useState } from "react";
import { questions, maxTotal } from "@/lib/questions";
import { signIn, signOut, useSession } from "next-auth/react";

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
  if (/^\d+\)\s*/.test(s)) return s;
  return `${index1}) ${s}`;
}

export default function Page() {
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiOk | null>(null);

  const isAuthed = !!session?.user;

  const displayName =
    (session?.user?.name ?? session?.user?.email ?? name).trim();

  const canSubmit = useMemo(() => {
    return isAuthed && displayName.length > 0 && answers.every((v) => v !== null);
  }, [isAuthed, displayName, answers]);

  async function submit() {
    if (!canSubmit || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          answers: answers as number[],
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert("ส่งไม่สำเร็จ: " + (data?.error ?? "unknown"));
        return;
      }

      setResult(data as ApiOk);
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 30);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setName("");
    setAnswers(Array(questions.length).fill(null));
    setResult(null);
  }

  return (
    <main
      style={{
        maxWidth: 920,
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
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>
              แบบประเมินผลการเรียนรู้ Mrich
            </h1>
            <p style={{ marginTop: 8, marginBottom: 0, opacity: 0.85 }}>
              ต้อง Sign in ก่อนถึงจะส่งคำตอบได้
            </p>
          </div>

          {/* Auth Buttons */}
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
                  {displayName}
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

        {/* name fallback */}
        <div style={{ marginTop: 14 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isAuthed ? "ใช้ชื่อจาก Google แล้ว" : "ชื่อเล่น (ภาษาอังกฤษเท่านั้น)"}
            disabled={isAuthed}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.20)",
              background: "rgba(2,6,23,0.55)",
              color: "#e5e7eb",
              outline: "none",
              fontSize: 15,
              opacity: isAuthed ? 0.6 : 1,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12, fontWeight: 700 }}>
            คะแนนเต็ม: {maxTotal}
          </span>
          <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12, fontWeight: 700 }}>
            ตอบแล้ว: {answers.filter((v) => v !== null).length}/{questions.length}
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <button
            onClick={submit}
            disabled={!canSubmit || loading}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: !canSubmit || loading ? "#94a3b8" : "#06b6d4",
              color: "#001018",
              fontWeight: 900,
              cursor: !canSubmit || loading ? "not-allowed" : "pointer",
            }}
            title={!isAuthed ? "กรุณา Sign in ก่อน" : ""}
          >
            {loading ? "กำลังส่ง..." : "ส่งและดูผล"}
          </button>

          <button
            onClick={reset}
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "transparent",
              color: "#e5e7eb",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            ล้างคำตอบ
          </button>
        </div>
      </section>

      <div style={{ height: 14 }} />

      {/* Questions */}
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
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16 }}>
            {titleForQuestion(q.q, qIdx + 1)}
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {q.choices.map((c, cIdx) => {
              const active = answers[qIdx] === c.value;
              const inputId = `${q.id}-${cIdx}`;

              return (
                <label
                  key={`${q.id}-${cIdx}`}
                  htmlFor={inputId}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: 12,
                    borderRadius: 14,
                    border: active ? "1px solid #06b6d4" : "1px solid #e2e8f0",
                    background: active ? "#ecfeff" : "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name={q.id}
                    checked={active}
                    onChange={() => {
                      const next = [...answers];
                      next[qIdx] = c.value;
                      setAnswers(next);
                    }}
                  />
                  <span style={{ fontWeight: 700, color: "#111827" }}>{c.label}</span>
                </label>
              );
            })}
          </div>
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
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>ผลการประเมิน</h2>
          <div>ผู้ทำ: <b>{result.name}</b></div>
          <div style={{ marginTop: 6 }}>
            คะแนน: <b>{result.totalScore}</b> / {result.maxScore} ({result.percent}%)
          </div>
          <div style={{ marginTop: 6 }}>
            ระดับ: <b>{result.level}</b>
          </div>
          <div style={{ marginTop: 10 }}>{result.tip}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#475569" }}>ID: {result.id}</div>
        </section>
      )}
    </main>
  );
}