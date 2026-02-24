"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { questions as baseQuestions, maxTotal } from "@/lib/questions";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

type ExamStateResp = {
  role: "ADMIN" | "USER";
  locked: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  expired: boolean;
  attemptToken?: string;
};

type SubmitOk = {
  id: string;
};

type ToastType = "info" | "success" | "error";
type ToastState = { type: ToastType; message: string } | null;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatMMSS(totalSec: number) {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

function titleForQuestion(raw: string, index1: number) {
  const s = raw.trim();
  if (/^\d+[.)]\s*/.test(s)) return s;
  return `${index1}) ${s}`;
}

function patchQuestions(qs: any[]) {
  const next = qs.map((q) => ({ ...q }));

  const replacements: Record<number, string> = {
    5: `5.ถ้าต้องการเปลี่ยนแปลงชีวิต กระดุมเม็ดแรกที่ต้องเปลี่ยนคืออะไร?`,
    25: `25.การทำ P/PC ให้สมดุลคือทำอะไร?`,
    26: `26.สินทรัพย์ที่เป็น "ทรัพย์สิน" ที่เราต้องสะสมให้มากมีกี่อย่าง อะไรบ้าง?`,
  };

  const leadNo = (s: string) => {
    const m = String(s ?? "").trim().match(/^(\d+)\s*[.)]/);
    return m ? Number(m[1]) : null;
  };

  const done = new Set<number>();
  for (let i = 0; i < next.length; i++) {
    const n = leadNo(next[i]?.q);
    if (n && replacements[n]) {
      next[i].q = replacements[n];
      done.add(n);
    }
  }

  const fallbackIndexMap: Record<number, number> = { 5: 4, 25: 24, 26: 25 };
  for (const nStr of Object.keys(replacements)) {
    const n = Number(nStr);
    if (done.has(n)) continue;
    const idx = fallbackIndexMap[n];
    if (idx >= 0 && idx < next.length) next[idx].q = replacements[n];
  }

  return next;
}

export default function Page() {
  const { data: session, status } = useSession();

  const questions = useMemo(() => patchQuestions(baseQuestions as any[]), []);
  const [answers, setAnswers] = useState<string[]>(() =>
    Array(questions.length).fill("")
  );

  const [loading, setLoading] = useState(false);
  const [submitOk, setSubmitOk] = useState<SubmitOk | undefined>(undefined);

  const [state, setState] = useState<ExamStateResp | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const [showWarningCasper, setShowWarningCasper] = useState(false);
  const [showTimerAlert, setShowTimerAlert] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);
  const toastTimerRef = useRef<number | null>(null);

  const warningVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isAuthed = !!session?.user;
  const displayName = (session?.user?.name ?? session?.user?.email ?? "").trim();

  // ---- toast helpers (แทน alert popup) ----
  const showToast = (type: ToastType, message: string, ms = 3500) => {
    setToast({ type, message });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), ms);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

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

  const secondsLeft = useMemo(() => {
    if (!state?.expiresAt) return 0;
    const end = new Date(state.expiresAt).getTime();
    return Math.max(0, Math.ceil((end - nowMs) / 1000));
  }, [state?.expiresAt, nowMs]);

  const isExpired = (state?.expired ?? false) || secondsLeft <= 0;
  const locked = !!state?.locked;

  // Casper เตือนเมื่อเหลือ 5 นาทีสุดท้าย
  useEffect(() => {
    if (secondsLeft <= 300 && secondsLeft > 290 && !isExpired && !showWarningCasper) {
      setShowWarningCasper(true);

      // เล่นวิดีโอแบบ muted ได้ (autoplay policy อนุญาต)
      if (warningVideoRef.current) {
        warningVideoRef.current.currentTime = 0;
        warningVideoRef.current.play().catch(() => {});
      }

      // เสียงจะ “เริ่มดัง” ก็ต่อเมื่อ user กดปุ่ม Click me 👻
      // (อย่าพยายาม play ที่นี่ เพราะ browser จะบล็อก)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, isExpired]);

  // เสียงนาฬิกา + emoji ⏳ เมื่อเหลือ 10 วินาที
  useEffect(() => {
    if (secondsLeft <= 10 && secondsLeft > 0 && !isExpired) {
      setShowTimerAlert(true);

      // ถ้า user ยังไม่ interact ให้ “ไม่พยายาม play” เพื่อเลี่ยงโดน block
      if (userInteracted && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else {
      setShowTimerAlert(false);
      if (audioRef.current) audioRef.current.pause();
    }
  }, [secondsLeft, isExpired, userInteracted]);

  const isLockedForInput = useMemo(() => {
    if (!state) return true;
    if (state.role === "ADMIN") return false;
    return locked || (isExpired && submitOk !== undefined);
  }, [state, locked, isExpired, submitOk]);

  const canSubmit = useMemo(() => {
    if (!state || !isAuthed) return false;
    if (!state.expiresAt) return false;
    if (state.role === "USER" && locked) return false;
    if (submitOk !== undefined) return false;
    return true;
  }, [state, isAuthed, locked, submitOk]);

  // ฟังก์ชัน submit ที่ใช้ showToast แทน alert
  async function submit(opts?: { silent?: boolean }) {
    if (!canSubmit || loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          attemptToken: state?.attemptToken,
          startedAt: state?.startedAt,
          expiresAt: state?.expiresAt,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Submit failed:", data);
        showToast("error", data?.error || "ส่งไม่สำเร็จ กรุณาลองใหม่", 4500);
        return;
      }

      setSubmitOk({ id: data?.id ?? "-" });
      await loadState();

      if (!opts?.silent) showToast("success", "ส่งคำตอบเรียบร้อยแล้ว ✅", 3000);
      else showToast("info", "หมดเวลาแล้ว ระบบส่งคำตอบให้อัตโนมัติ ✅", 3500);

      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Submit error:", err);
      showToast("error", "เกิดข้อผิดพลาดในการส่งคำตอบ กรุณาลองใหม่", 4500);
    } finally {
      setLoading(false);
    }
  }

  // บังคับส่งอัตโนมัติเมื่อหมดเวลา
  useEffect(() => {
    if (isExpired && !loading && submitOk === undefined && answers.some((v) => v.trim().length > 0)) {
      submit({ silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired, loading, submitOk, answers]);

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

  // ✅ กดปุ่ม Click me 👻 แล้ว “ต้องมีเสียงแน่นอน”
  const handleWarningInteract = async () => {
    setUserInteracted(true);

    // 1) เปิดเสียงวิดีโอ (casper)
    if (warningVideoRef.current) {
      try {
        warningVideoRef.current.muted = false;
        warningVideoRef.current.volume = 1.0;
        warningVideoRef.current.currentTime = 0;
        await warningVideoRef.current.play();
      } catch (e) {
        console.log("video play failed:", e);
        showToast("error", "เบราว์เซอร์บล็อกเสียงวิดีโอ ลองกดปุ่มอีกครั้ง", 3500);
      }
    }

    // 2) เปิดเสียง alarm (mp3)
    if (audioRef.current) {
      try {
        audioRef.current.muted = false;
        audioRef.current.volume = 1.0;
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (e) {
        console.log("audio play failed:", e);
        showToast("error", "เบราว์เซอร์บล็อกเสียง alarm ลองกดปุ่มอีกครั้ง", 3500);
      }
    }
  };

  const toastBg =
    toast?.type === "success"
      ? "bg-emerald-500/15 border-emerald-300/25 text-emerald-100"
      : toast?.type === "error"
        ? "bg-red-500/15 border-red-300/25 text-red-100"
        : "bg-blue-500/15 border-blue-300/25 text-blue-100";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-blue-100 pb-24">
      {/* keyframes */}
      <style jsx global>{`
        @keyframes flowerFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(4deg); }
        }
        @keyframes flowerGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(96,165,250,0.35)); }
          50% { filter: drop-shadow(0 0 18px rgba(96,165,250,0.75)); }
        }
        @keyframes casper-appear-fade {
          0% { transform: translateX(120%) translateY(0) scale(0.8); opacity: 0; }
          15% { transform: translateX(0) translateY(-20px) scale(1); opacity: 1; }
          80% { transform: translateX(0) translateY(-40px) scale(1); opacity: 1; }
          100% { transform: translateX(-150%) translateY(-60px) scale(0.7); opacity: 0; }
        }
        .animate-casper { animation: casper-appear-fade 8s ease-in-out forwards; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce { animation: bounce 0.9s ease-in-out infinite; }
      `}</style>

      {/* Background Flowers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* วางโค้ดดอกไม้เดิมทั้ง 4 อันตรงนี้ */}
      </div>

      <div className="absolute inset-0 bg-black/25" />

      {/* Toast แทน alert */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4">
          <div className={`max-w-[92vw] sm:max-w-[560px] rounded-2xl border backdrop-blur-xl shadow-2xl px-4 py-3 text-sm font-semibold ${toastBg}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">{toast.message}</div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="opacity-80 hover:opacity-100 transition text-base leading-none"
                aria-label="close"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* เสียงนาฬิกาปลุก */}
      <audio ref={audioRef} src="/alarm.mp3" preload="auto" />

      {/* Casper เตือน 5 นาทีสุดท้าย */}
      {showWarningCasper && (
        // ✅ สำคัญ: ด้านนอก pointer-events-none แต่ “ด้านใน” ต้อง pointer-events-auto เพื่อให้ปุ่มกดได้จริง
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <div className="w-36 h-36 animate-casper relative">
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-yellow-400/70 shadow-2xl shadow-yellow-500/70 bg-black">
                <video
                  ref={warningVideoRef}
                  autoPlay
                  playsInline
                  muted={!userInteracted}
                  src="/casper-clip2.mp4"
                  preload="auto"
                  className="absolute inset-0 w-[130%] h-[130%] object-cover object-[50%_130%] scale-100"
                  onError={(e) => console.error("Warning video error:", e)}
                />
              </div>

              {!userInteracted && (
                <button
                  type="button"
                  onClick={handleWarningInteract}
                  className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 bg-yellow-600/90 text-white text-base font-bold rounded-full shadow-lg hover:bg-yellow-500 transition-all transform hover:scale-105"
                >
                  Click me 👻
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emoji นาฬิกาสั่น + เสียงนาฬิกา เมื่อเหลือ 10 วินาที */}
      {showTimerAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 text-5xl animate-bounce drop-shadow-lg pointer-events-none">
          ⏳
        </div>
      )}

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <section className="rounded-2xl border border-blue-400/20 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex justify-between gap-4 flex-wrap items-start">
            <div>
              <h1 className="m-0 text-2xl sm:text-3xl font-extrabold font-serif drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]">
                แบบทดสอบกรอบความคิดและหลักการ
              </h1>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {status === "loading" ? (
                <span className="text-blue-200/70 text-sm">กำลังโหลด...</span>
              ) : isAuthed ? (
                <>
                  <span
                    className="px-3 py-1 rounded-full border border-blue-300/20 bg-white/5 text-blue-100 text-xs font-bold max-w-[280px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={displayName}
                  >
                    {displayName}{" "}
                    {state?.role ? <span className="text-blue-200/70">({state.role})</span> : null}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="rounded-full px-4 py-2 border border-blue-300/25 bg-white/5 hover:bg-white/10 text-blue-100 font-bold transition"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn("google")}
                  className="rounded-full px-4 py-2 bg-white text-slate-900 font-extrabold hover:bg-blue-50 transition"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          </div>

          {/* Pills + Timer */}
          <div className="mt-4 flex gap-2 flex-wrap items-center">
            <span className="px-3 py-1 rounded-full border border-blue-300/20 bg-white/5 text-xs font-bold">
              คะแนนเต็ม: {maxTotal}
            </span>
            <span className="px-3 py-1 rounded-full border border-blue-300/20 bg-white/5 text-xs font-bold">
              ตอบแล้ว: {answeredCount}/{questions.length}
            </span>

            {state?.role === "USER" && (
              <span
                className="px-3 py-1 rounded-full text-xs font-extrabold border"
                style={{
                  background: locked ? "rgba(34,197,94,0.16)" : "rgba(255,255,255,0.08)",
                  borderColor: locked ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.14)",
                }}
              >
                {locked ? "✅ ส่งแล้ว" : "📝 ยังไม่ส่ง"}
              </span>
            )}
          </div>

          {/* Admin buttons + Back to Home */}
          <div className="mt-4 flex gap-3 flex-wrap">
            {state?.role === "ADMIN" && (
              <button
                onClick={adminResetTimer}
                disabled={loading || !isAuthed}
                className="rounded-full px-6 py-3 font-extrabold transition border border-blue-300/25 bg-white/5 hover:bg-white/10 text-blue-100"
              >
                เริ่มเวลาใหม่ (admin)
              </button>
            )}

            <Link
              href="/home"
              className="rounded-full px-6 py-3 font-extrabold transition border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-200"
            >
              ← Back to Home
            </Link>
          </div>
        </section>

        <div className="h-8" />

        {/* คำถามทั้งหมด */}
        <div className="space-y-5 pb-12">
          {questions.map((q, qIdx) => (
            <section
              key={q.id}
              className="rounded-2xl border border-blue-300/15 bg-white/5 backdrop-blur-xl p-5 shadow-xl"
              style={{ opacity: isLockedForInput ? 0.88 : 1 }}
            >
              <div className="font-extrabold text-blue-50 text-base sm:text-lg">
                {titleForQuestion(q.q, qIdx + 1)}
              </div>
              <textarea
                value={answers[qIdx]}
                onChange={(e) => {
                  const next = [...answers];
                  next[qIdx] = e.target.value;
                  setAnswers(next);
                }}
                placeholder={isLockedForInput ? "แบบฟอร์มถูกล็อก" : "พิมพ์คำตอบที่นี่..."}
                disabled={isLockedForInput}
                className={`mt-3 w-full rounded-xl border px-4 py-3 text-sm sm:text-base leading-relaxed outline-none resize-y min-h-[140px]
                  ${
                    isLockedForInput
                      ? "bg-black/20 border-blue-300/10 text-blue-100/70"
                      : "bg-black/30 border-blue-300/15 text-blue-50 focus:ring-2 focus:ring-blue-500"
                  }`}
              />
            </section>
          ))}
        </div>

        {/* Submitted */}
        {submitOk && (
          <section className="mt-10 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 backdrop-blur-xl p-6 shadow-2xl text-center">
            <h2 className="text-2xl font-bold text-emerald-300 mb-2">
              ส่งคำตอบเรียบร้อยแล้ว!
            </h2>
            <div className="text-sm text-emerald-100/80">Response ID: {submitOk.id}</div>
          </section>
        )}
      </main>

      {/* Floating Timer + Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-500/20 bg-gradient-to-t from-slate-950/95 to-slate-900/80 backdrop-blur-lg py-3 px-4 shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div
            className="px-4 py-2 rounded-full text-sm font-extrabold border shadow-md relative"
            style={{
              background: isExpired ? "rgba(239,68,68,0.22)" : "rgba(59,130,246,0.22)",
              borderColor: isExpired ? "rgba(239,68,68,0.5)" : "rgba(59,130,246,0.5)",
            }}
          >
            ⏳ {timerLabel}
            {isExpired && <span className="ml-2 text-red-300 text-xs">(หมดเวลา)</span>}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-blue-200/80">
              ตอบแล้ว {answeredCount}/{questions.length}
            </div>

            <button
              onClick={() => submit()}
              disabled={!canSubmit || loading || !isAuthed}
              className={`rounded-full px-7 py-3 font-extrabold transition shadow-lg
                ${
                  !canSubmit || loading || !isAuthed
                    ? "bg-slate-700/40 text-slate-400 cursor-not-allowed border border-slate-600/40"
                    : isExpired
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-cyan-400 text-slate-900 hover:bg-cyan-300 active:scale-95"
                }`}
            >
              {loading ? "กำลังส่ง..." : isExpired ? "ส่งคำตอบที่เหลือ (หมดเวลา)" : "ส่งคำตอบ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}