"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  questions as course1Questions,
  maxTotal as course1MaxTotal,
} from "@/lib/questions-course1";
import {
  questions as course2Questions,
  maxTotal as course2MaxTotal,
} from "@/lib/questions-course2";

type ExamStateResp = {
  role: "ADMIN" | "LEARNER" | "LEADER";
  locked: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  expired: boolean;
  attemptToken?: string;
};

type SubmitOk = { id: string };

type ToastType = "info" | "success" | "error";
type ToastState = { type: ToastType; message: string } | null;

type CourseSlug = "mindset-principles" | "proactive";

type AnyQuestion = {
  id: string;
  category: string;
  q: string;
  minChars?: number;
  minItems?: number;
  hint?: string;
};

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

function patchCourse1Questions(qs: AnyQuestion[]) {
  const next = qs.map((q) => ({ ...q }));

  const replacements: Record<number, string> = {
    5: `5. ถ้าต้องการเปลี่ยนแปลงชีวิต กระดุมเม็ดแรกที่ต้องเปลี่ยนคืออะไร?`,
    25: `25. การทำ P/PC ให้สมดุลคือทำอะไร?`,
    26: `26. สินทรัพย์ที่เป็น "ทรัพย์สิน" ที่เราต้องสะสมให้มากมีกี่อย่าง อะไรบ้าง?`,
  };

  const leadNo = (s: string) => {
    const m = String(s ?? "")
      .trim()
      .match(/^(\d+)\s*[.)]/);
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

function getCourseConfig(course: string | null) {
  const normalized = (course ?? "mindset-principles") as CourseSlug;

  if (normalized === "proactive") {
    return {
      slug: "proactive" as CourseSlug,
      title: "ข้อสอบคนลีด Proactive",
      questions: course2Questions as AnyQuestion[],
      maxTotal: course2MaxTotal,
    };
  }

  return {
    slug: "mindset-principles" as CourseSlug,
    title: "แบบทดสอบกรอบความคิดและหลักการ",
    questions: patchCourse1Questions(course1Questions as AnyQuestion[]),
    maxTotal: course1MaxTotal,
  };
}

export default function FormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseParam = searchParams.get("course");

  const courseConfig = useMemo(() => getCourseConfig(courseParam), [courseParam]);
  const course = courseConfig.slug;
  const questions = courseConfig.questions;
  const maxTotal = courseConfig.maxTotal;
  const formTitle = courseConfig.title;

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

  const warningShownRef = useRef(false);
  const warningHideTimerRef = useRef<number | null>(null);
  const tenSecondAlarmPlayedRef = useRef(false);

  useEffect(() => {
    setAnswers(Array(questions.length).fill(""));
    setSubmitOk(undefined);
    setState(null);
    setShowWarningCasper(false);
    setShowTimerAlert(false);
    warningShownRef.current = false;
    tenSecondAlarmPlayedRef.current = false;
  }, [questions.length, course]);

  const showToast = (type: ToastType, message: string, ms = 3500) => {
    setToast({ type, message });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), ms);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (warningHideTimerRef.current) window.clearTimeout(warningHideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // เก็บ interaction ของ user เพื่อให้เล่นเสียงได้
  useEffect(() => {
    if (userInteracted) return;

    const handleInteract = () => {
      setUserInteracted(true);
      document.removeEventListener("click", handleInteract);
      document.removeEventListener("keydown", handleInteract);
      document.removeEventListener("touchstart", handleInteract);
    };

    document.addEventListener("click", handleInteract);
    document.addEventListener("keydown", handleInteract);
    document.addEventListener("touchstart", handleInteract);

    return () => {
      document.removeEventListener("click", handleInteract);
      document.removeEventListener("keydown", handleInteract);
      document.removeEventListener("touchstart", handleInteract);
    };
  }, [userInteracted]);

  async function loadState() {
    const res = await fetch(`/api/exam/state?course=${encodeURIComponent(course)}`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("loadState failed:", data);
      return;
    }

    const nextState = data as ExamStateResp;
    setState(nextState);

    if (nextState.locked && nextState.role !== "ADMIN") {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`submitted:${course}`, "1");
      }
      showToast("info", "คุณส่งข้อสอบชุดนี้แล้ว ไม่สามารถเปิดดูได้อีก");
      setTimeout(() => {
        router.replace("/home");
      }, 600);
    }
  }

  useEffect(() => {
    loadState();
  }, [course]);

  const secondsLeft = useMemo(() => {
    if (!state?.expiresAt) return 0;
    const end = new Date(state.expiresAt).getTime();
    return Math.max(0, Math.ceil((end - nowMs) / 1000));
  }, [state?.expiresAt, nowMs]);

  const isExpired = (state?.expired ?? false) || secondsLeft <= 0;
  const locked = !!state?.locked;

  // Casper 5 นาทีสุดท้าย
  useEffect(() => {
    const inWarningWindow = secondsLeft <= 300 && secondsLeft > 295;

    if (
      inWarningWindow &&
      !isExpired &&
      !warningShownRef.current
    ) {
      warningShownRef.current = true;
      setShowWarningCasper(true);

      if (warningHideTimerRef.current) {
        window.clearTimeout(warningHideTimerRef.current);
      }

      warningHideTimerRef.current = window.setTimeout(() => {
        setShowWarningCasper(false);
      }, 8500);

      if (warningVideoRef.current) {
        warningVideoRef.current.currentTime = 0;
        warningVideoRef.current.muted = !userInteracted;
        warningVideoRef.current.play().catch(() => {});
      }
    }
  }, [secondsLeft, isExpired, userInteracted]);

  // 10 วินาทีสุดท้าย: ขึ้น ⏳ + เล่น alarm.mp3
  useEffect(() => {
    const inLastTenSeconds = secondsLeft <= 10 && secondsLeft > 0 && !isExpired;

    if (inLastTenSeconds) {
      setShowTimerAlert(true);

      if (userInteracted && audioRef.current && !tenSecondAlarmPlayedRef.current) {
        tenSecondAlarmPlayedRef.current = true;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.muted = false;
        audioRef.current.volume = 1.0;
        audioRef.current.play().catch(() => {});
      }
    } else {
      setShowTimerAlert(false);
      tenSecondAlarmPlayedRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [secondsLeft, isExpired, userInteracted]);

  const isLockedForInput = useMemo(() => {
    if (!state) return true;
    if (state.role === "ADMIN") return false;
    return locked || submitOk !== undefined;
  }, [state, locked, submitOk]);

  const canSubmit = useMemo(() => {
    if (!state) return false;
    if (!state.expiresAt) return false;
    if (locked) return false;
    if (submitOk !== undefined) return false;
    if (!isExpired) return false;
    return true;
  }, [state, locked, submitOk, isExpired]);

  async function submit(opts?: { silent?: boolean }) {
    if (!canSubmit || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          course,
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

      if (typeof window !== "undefined") {
        sessionStorage.setItem(`submitted:${course}`, "1");
      }

      await loadState();

      if (!opts?.silent) {
        showToast("success", "ส่งคำตอบเรียบร้อยแล้ว ✅", 3000);
      } else {
        showToast("info", "หมดเวลาแล้ว ระบบส่งคำตอบให้อัตโนมัติ ✅", 3500);
      }

      setTimeout(() => {
        router.replace("/home");
      }, 1200);
    } catch (err) {
      console.error("Submit error:", err);
      showToast("error", "เกิดข้อผิดพลาดในการส่งคำตอบ กรุณาลองใหม่", 4500);
    } finally {
      setLoading(false);
    }
  }

  // หมดเวลา -> auto submit
  useEffect(() => {
    if (
      isExpired &&
      !loading &&
      submitOk === undefined &&
      !locked &&
      answers.some((v) => v.trim().length > 0)
    ) {
      submit({ silent: true });
    }
  }, [isExpired, loading, submitOk, answers, locked]);

  async function adminResetTimer() {
    if (state?.role !== "ADMIN") return;

    try {
      setLoading(true);
      const res = await fetch("/api/exam/reset", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast("error", data?.error || "รีเซ็ตเวลาไม่สำเร็จ", 4000);
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`submitted:${course}`);
      }

      showToast("success", "รีเซ็ตเวลาใหม่แล้ว ✅", 2500);
      await loadState();
    } finally {
      setLoading(false);
    }
  }

  const answeredCount = answers.filter((a) => a.trim().length > 0).length;

  const timerLabel = useMemo(() => {
    if (!state) return "กำลังโหลด...";
    if (!state.expiresAt) return "กำลังตั้งเวลา...";
    return formatMMSS(secondsLeft);
  }, [state, secondsLeft]);

  const handleWarningInteract = async () => {
    setUserInteracted(true);

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

    if (audioRef.current) {
      try {
        audioRef.current.muted = false;
        audioRef.current.volume = 1.0;
      } catch {}
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
      <style jsx global>{`
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

      <div className="absolute inset-0 bg-black/25" />

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4">
          <div
            className={`max-w-[92vw] sm:max-w-[560px] rounded-2xl border backdrop-blur-xl shadow-2xl px-4 py-3 text-sm font-semibold ${toastBg}`}
          >
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

      <audio ref={audioRef} src="/alarm.mp3" preload="auto" />

      {showWarningCasper && (
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
                  className="absolute inset-0 w-[130%] h-[130%] object-cover object-[50%_120%] scale-110"
                  onEnded={() => setShowWarningCasper(false)}
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

      {showTimerAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 text-5xl animate-bounce drop-shadow-lg pointer-events-none">
          ⏳
        </div>
      )}

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <section className="rounded-2xl border border-blue-400/20 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex justify-between gap-4 flex-wrap items-start">
            <div>
              <h1 className="m-0 text-2xl sm:text-3xl font-extrabold font-serif drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]">
                {formTitle}
              </h1>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <span className="px-3 py-1 rounded-full border border-blue-300/20 bg-white/5 text-blue-100 text-xs font-bold">
                {state?.role ? `ROLE: ${state.role}` : "กำลังโหลด..."}
              </span>
              <span className="px-3 py-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 text-cyan-100 text-xs font-bold">
                {course === "proactive" ? "COURSE 2" : "COURSE 1"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap items-center">
            <span className="px-3 py-1 rounded-full border border-blue-300/20 bg-white/5 text-xs font-bold">
              คะแนนเต็ม: {maxTotal}
            </span>
            <span className="px-3 py-1 rounded-full border border-blue-300/20 bg-white/5 text-xs font-bold">
              ตอบแล้ว: {answeredCount}/{questions.length}
            </span>

            {(state?.role === "LEARNER" || state?.role === "LEADER") && (
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

          <div className="mt-4 flex gap-3 flex-wrap">
            {state?.role === "ADMIN" && (
              <button
                onClick={adminResetTimer}
                disabled={loading}
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

              {q.hint && (
                <div className="mt-2 text-xs sm:text-sm text-blue-200/70">
                  Hint: {q.hint}
                </div>
              )}

              <textarea
                value={answers[qIdx] ?? ""}
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

        {submitOk && (
          <section className="mt-10 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 backdrop-blur-xl p-6 shadow-2xl text-center">
            <h2 className="text-2xl font-bold text-emerald-300 mb-2">ส่งคำตอบเรียบร้อยแล้ว!</h2>
            <div className="text-sm text-emerald-100/80">Response ID: {submitOk.id}</div>
          </section>
        )}
      </main>

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
              disabled={!canSubmit || loading}
              className={`rounded-full px-7 py-3 font-extrabold transition shadow-lg
                ${
                  !canSubmit || loading
                    ? "bg-slate-700/40 text-slate-400 cursor-not-allowed border border-slate-600/40"
                    : "bg-red-600 hover:bg-red-500 text-white"
                }`}
            >
              {loading
                ? "กำลังส่ง..."
                : locked || submitOk
                ? "ส่งแล้ว"
                : !isExpired
                ? "รอหมดเวลา"
                : "ส่งคำตอบ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}