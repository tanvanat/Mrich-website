"use client";

import { useMemo, useState } from "react";
import { questions, maxTotal } from "@/lib/questions";

type ApiOk = {
  id: string;
  name: string;
  formId?: string;
  totalScore: number;
  maxScore: number;
  percent: number;
  level: string;
  tip: string;
  createdAt?: string;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#0b1220,#0f172a 40%,#0b1220)",
    color: "#e5e7eb",
    padding: 16,
    fontFamily: "system-ui",
  },
  container: {
    maxWidth: 920,
    margin: "24px auto",
  },
  header: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 18,
    backdropFilter: "blur(8px)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
  },
  h1: { margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: -0.2 },
  sub: { marginTop: 6, color: "rgba(229,231,235,0.78)" },

  card: {
    marginTop: 14,
    background: "#ffffff",
    color: "#111827",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    padding: 16,
    boxShadow: "0 14px 40px rgba(0,0,0,0.20)",
  },
  label: { display: "block", fontWeight: 800, marginBottom: 8, color: "#0f172a" },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: 14,
  },
  metaRow: { marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  pill: {
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    fontSize: 12,
    color: "#0f172a",
    fontWeight: 700,
  },

  qTitle: { fontWeight: 900, color: "#0f172a" },
  qSub: { marginTop: 6, color: "#475569", fontSize: 12 },

  choices: { display: "grid", gap: 10, marginTop: 12 },
  choice: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    cursor: "pointer",
    transition: "all 120ms ease",
  },
  choiceActive: {
    border: "1px solid #06b6d4",
    background: "#ecfeff",
    boxShadow: "0 8px 18px rgba(6,182,212,0.18)",
  },
  radio: { width: 16, height: 16 },

  actions: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 12 },
  primaryBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "#06b6d4",
    color: "#001018",
    fontWeight: 900,
    cursor: "pointer",
  },
  disabledBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "#cbd5e1",
    color: "#475569",
    fontWeight: 900,
    cursor: "not-allowed",
  },
  ghostBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  },
  warn: { color: "#64748b", fontSize: 12 },

  result: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    border: "1px solid #86efac",
    background: "#f0fdf4",
    color: "#052e16",
  },
  small: { color: "#475569", marginTop: 10, fontSize: 12 },
};

export default function Page() {
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiOk | null>(null);

  const answeredCount = useMemo(
    () => answers.filter((v) => v !== null).length,
    [answers]
  );

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && answers.every((v) => v !== null);
  }, [name, answers]);

  async function submit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
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
      }, 50);
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
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.h1}>ประเมินผลการเรียนรู้ Mrich</h1>
          <div style={styles.sub}>
            ตอบให้ครบทุกข้อแล้วค่อยกดส่ง
          </div>
        </header>

        <section style={styles.card}>
          <label style={styles.label}>ชื่อเล่น</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ขอเป็นชื่อเล่นภาษาอังกฤษเท่านั้น"
            style={styles.input}
          />

          <div style={styles.metaRow}>
            <span style={styles.pill}>
              ตอบแล้ว: {answeredCount}/{questions.length}
            </span>
            <span style={styles.pill}>คะแนนเต็มทั้งหมด: {maxTotal}</span>
            {!canSubmit && (
              <span style={{ ...styles.pill, background: "#fff7ed", borderColor: "#fed7aa", color: "#9a3412" }}>
                *กรอกชื่อและตอบให้ครบก่อน
              </span>
            )}
          </div>

          <div style={styles.actions}>
            <button
              onClick={submit}
              disabled={!canSubmit || loading}
              style={!canSubmit || loading ? styles.disabledBtn : styles.primaryBtn}
            >
              {loading ? "กำลังส่ง..." : "ส่งและดูผล"}
            </button>

            <button onClick={reset} disabled={loading} style={styles.ghostBtn}>
              ล้างคำตอบ
            </button>

            <span style={styles.warn}>
              เลือก “0” ได้ (ถือว่าตอบแล้ว)
            </span>
          </div>
        </section>

        {questions.map((q, qIdx) => (
          <section key={q.id} style={styles.card}>
            <div style={styles.qTitle}>
              {qIdx + 1}. [{q.category}] {q.q}
            </div>
            <div style={styles.qSub}>เลือก 1 ตัวเลือก</div>

            <div style={styles.choices}>
              {q.choices.map((c, cIdx) => {
                const inputId = `${q.id}-${cIdx}`;
                const active = answers[qIdx] === c.value;

                return (
                  <label
                    key={`${q.id}-${c.value}-${cIdx}`} // กัน value ซ้ำ
                    htmlFor={inputId}
                    style={{
                      ...styles.choice,
                      ...(active ? styles.choiceActive : null),
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
                      style={styles.radio}
                    />
                    <span style={{ fontWeight: 700, color: active ? "#0f172a" : "#111827" }}>
                      {c.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        {result && (
          <section style={styles.result}>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>ผลการประเมิน</h2>
            <div>
              ผู้ทำ: <b>{result.name ?? name}</b>
            </div>
            <div style={{ marginTop: 6 }}>
              คะแนน: <b>{result.totalScore}</b> / {result.maxScore} ({result.percent}%)
            </div>
            <div style={{ marginTop: 6 }}>
              ระดับ: <b>{result.level}</b>
            </div>
            <div style={{ marginTop: 10 }}>{result.tip}</div>

            <div style={styles.small}>
              ID: {result.id}
              {result.formId ? ` • formId: ${result.formId}` : ""}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
