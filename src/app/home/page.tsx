"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, ArrowRight, Shield, CheckCircle2 } from "lucide-react";

type MeResp =
  | {
      authed: true;
      nick: string;
      role: "ADMIN" | "LEADER" | "LEARNER";
      permissions: {
        canAccessAdmin: boolean;
        canAccessLeaderExam: boolean;
        canAccessLearnerExam: boolean;
      };
    }
  | { authed: false };

type ScoreData = {
  hasScore: boolean;
  totalScore?: number;
  maxScore?: number;
  percent?: number;
  message?: string;
};

type CourseAccess = "BOTH" | "LEADER_ONLY";

type CourseItem = {
  id: number;
  title: string;
  subtitle: string;
  accent: string;
  access: CourseAccess;
  slug: string;
  description: string;
};

export default function HomePage() {
  const router = useRouter();

  const [me, setMe] = useState<MeResp | null>(null);
  const [score, setScore] = useState<ScoreData | null>(null);
  const [loadingScore, setLoadingScore] = useState(true);

  const [submittedMap, setSubmittedMap] = useState<Record<string, boolean>>({});

  const [showPopup, setShowPopup] = useState(true);
  const [showCasper, setShowCasper] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return { authed: false } as MeResp;
        return (await res.json()) as MeResp;
      })
      .then((data) => {
        setMe(data);
        if (!data.authed) {
          router.replace("/signin");
        }
      })
      .catch(() => {
        setMe({ authed: false });
        router.replace("/signin");
      });
  }, [router]);

  useEffect(() => {
    if (!me || !me.authed) return;

    setLoadingScore(true);
    fetch("/api/user/score", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: ScoreData) => setScore(data))
      .catch(() =>
        setScore({ hasScore: false, message: "ไม่สามารถโหลดคะแนนได้" })
      )
      .finally(() => setLoadingScore(false));
  }, [me]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setSubmittedMap({
      "mindset-principles":
        window.sessionStorage.getItem("submitted:mindset-principles") === "1",
      proactive: window.sessionStorage.getItem("submitted:proactive") === "1",
    });
  }, []);

  useEffect(() => {
    if (!showCasper) return;
    const t = setTimeout(() => setShowCasper(false), 7000);
    return () => clearTimeout(t);
  }, [showCasper]);

  useEffect(() => {
    if (userInteracted) return;

    const handle = () => {
      setUserInteracted(true);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play().catch(() => {});
      }
      document.removeEventListener("click", handle);
      document.removeEventListener("scroll", handle);
      document.removeEventListener("touchstart", handle);
    };

    document.addEventListener("click", handle);
    document.addEventListener("scroll", handle);
    document.addEventListener("touchstart", handle);

    return () => {
      document.removeEventListener("click", handle);
      document.removeEventListener("scroll", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [userInteracted]);

  const userLabel = useMemo(
    () => (me && me.authed ? me.nick : "unknown"),
    [me]
  );

  const isAdmin = me?.authed === true && me.permissions.canAccessAdmin;
  const canLeader = me?.authed === true && me.permissions.canAccessLeaderExam;
  const canLearner = me?.authed === true && me.permissions.canAccessLearnerExam;

  const courses = useMemo<CourseItem[]>(
    () => [
      {
        id: 1,
        title: "Course 1",
        subtitle: "กรอบความคิดและหลักการ",
        accent: "from-blue-500/25 to-indigo-500/10",
        access: "BOTH",
        slug: "mindset-principles",
        description: "Leadership basics • habits • reflection",
      },
      {
        id: 2,
        title: "Course 2",
        subtitle: "แบบทดสอบ Proactive",
        accent: "from-sky-500/25 to-blue-500/10",
        access: "LEADER_ONLY",
        slug: "proactive",
        description: "Communication • Win/Win • teamwork",
      },
    ],
    []
  );

  function canAccessCourse(access: CourseAccess) {
    if (isAdmin) return true;

    if (access === "BOTH") {
      return !!canLearner || !!canLeader;
    }

    if (access === "LEADER_ONLY") {
      return !!canLeader;
    }

    return false;
  }

  function isCourseSubmitted(slug: string) {
    if (isAdmin) return false;
    return !!submittedMap[slug];
  }

  function openCourse(course: CourseItem) {
    const allowed = canAccessCourse(course.access);
    const submitted = isCourseSubmitted(course.slug);

    if (!allowed || submitted) return;

    router.push(`/form?course=${course.slug}`);
  }

  async function signOutNick() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/signin";
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-blue-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      <div className="absolute inset-0 bg-black/25" />

      {showCasper && (
        <div className="fixed top-[15%] right-[5%] z-50 w-36 h-36 pointer-events-none animate-casper-float-in-out">
          <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-cyan-300/60 shadow-2xl shadow-cyan-500/70">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={!userInteracted}
              src="/casper-newbg2.mp4"
              className="absolute inset-0 w-[140%] h-[140%] object-cover object-[50%_35%] scale-100"
              onEnded={() => setShowCasper(false)}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes casper-float-in-out {
          0% {
            transform: translateX(150%) translateY(0) scale(0.7);
            opacity: 0;
          }
          15% {
            transform: translateX(0) translateY(-30px) scale(1);
            opacity: 1;
          }
          70% {
            transform: translateX(0) translateY(-60px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(-180%) translateY(-100px) scale(0.6);
            opacity: 0;
          }
        }
        .animate-casper-float-in-out {
          animation: casper-float-in-out 8.5s ease-in-out forwards;
        }
      `}</style>

      <div className="relative mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="rounded-2xl border border-blue-300/20 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
            <div className="text-2xl md:text-3xl font-bold text-white font-serif drop-shadow-[0_0_20px_rgba(96,165,250,0.45)]">
              Welcome back
            </div>

            <div className="mt-1 text-blue-200/80">
              Signed in as:{" "}
              <span className="text-blue-100 font-semibold">{userLabel}</span>
            </div>

            <div className="mt-1 text-sm text-cyan-300/90">
              Role: {me.authed ? me.role : "-"}
            </div>

            <div className="mt-4">
              {loadingScore ? (
                <div className="text-blue-300 text-sm">กำลังโหลดคะแนน...</div>
              ) : score?.hasScore ? (
                <div className="text-lg font-medium text-white">
                  คะแนนล่าสุด:{" "}
                  <span className="text-cyan-300 font-bold">
                    {score.totalScore} / {score.maxScore}
                  </span>{" "}
                  <span className="text-cyan-400 font-semibold">
                    ({score.percent}%)
                  </span>
                </div>
              ) : (
                <div className="text-amber-300 text-sm font-medium">
                  {score?.message || "ยังไม่ได้รับการตรวจ"}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  !isCourseSubmitted("mindset-principles") &&
                  router.push("/form?course=mindset-principles")
                }
                disabled={isCourseSubmitted("mindset-principles") && !isAdmin}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 font-semibold transition-all duration-300 shadow-lg hover:scale-[1.02] ${
                  isCourseSubmitted("mindset-principles") && !isAdmin
                    ? "bg-slate-700/40 text-slate-400 cursor-not-allowed border border-slate-600/40"
                    : "bg-blue-500 text-white hover:bg-blue-400 shadow-blue-500/30"
                }`}
              >
                {isCourseSubmitted("mindset-principles") && !isAdmin
                  ? "Submitted"
                  : "Go to Assessment Form"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={signOutNick}
                className="rounded-full border border-blue-300/30 px-5 py-2 font-semibold text-blue-100 hover:bg-white/10 transition-all duration-300"
              >
                Sign out
              </button>
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/admin/exam"
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-300/20 bg-white/5 backdrop-blur-xl px-5 py-4 font-bold text-blue-100 hover:bg-white/10 transition shadow-2xl self-start md:self-center"
            >
              <Shield className="h-5 w-5" />
              ไปหน้า Admin Dashboard
            </Link>
          )}
        </div>

        <div className="mt-10">
          <div className="text-xl md:text-2xl font-bold text-white font-serif">
            Your Courses
          </div>

          <div className="mt-2 text-sm text-blue-200/75">
            Course 1: Learner และ Leader เข้าได้ • Course 2: Leader only •
            Admin เข้าได้ทุกแบบทดสอบ
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((c) => {
              const unlocked = canAccessCourse(c.access);
              const submitted = isCourseSubmitted(c.slug);
              const disabled = !unlocked || submitted;

              return (
                <div
                  key={c.id}
                  className="relative rounded-2xl border border-blue-300/20 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${c.accent}`}
                  />

                  <div className="relative p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {c.title}
                        </div>
                        <div className="mt-1 text-sm text-blue-200/80">
                          {c.subtitle}
                        </div>
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-bold border ${
                          c.access === "LEADER_ONLY"
                            ? "border-violet-300/30 text-violet-200 bg-violet-500/10"
                            : "border-cyan-300/30 text-cyan-200 bg-cyan-500/10"
                        }`}
                      >
                        {c.access === "LEADER_ONLY"
                          ? "LEADER ONLY"
                          : "LEARNER + LEADER"}
                      </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-blue-300/15 bg-black/20 p-4">
                      <div className="text-blue-100 font-semibold">
                        {!unlocked ? "Locked" : submitted ? "Submitted" : "Available"}
                      </div>
                      <div className="mt-1 text-sm text-blue-200/70">
                        {submitted
                          ? "คุณส่งข้อสอบชุดนี้แล้ว"
                          : c.description}
                      </div>
                    </div>

                    <button
                      onClick={() => openCourse(c)}
                      disabled={disabled}
                      className={`mt-5 w-full rounded-full px-4 py-2 font-bold transition ${
                        disabled
                          ? "bg-white/10 text-blue-100/50 cursor-not-allowed"
                          : "bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/25"
                      }`}
                    >
                      {!unlocked
                        ? "No Access"
                        : submitted
                        ? "Submitted"
                        : "Start Assessment"}
                    </button>
                  </div>

                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="text-center px-6">
                        <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-white/10 border border-blue-200/20 flex items-center justify-center">
                          <Lock className="h-6 w-6 text-blue-100" />
                        </div>
                        <div className="text-sm font-semibold text-white">
                          Locked for your role
                        </div>
                      </div>
                    </div>
                  )}

                  {unlocked && !submitted && (
                    <div className="absolute top-4 right-4">
                      <div className="rounded-full bg-emerald-500/15 border border-emerald-300/25 p-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showPopup && (
          <div className="fixed bottom-6 right-6 z-50 w-80 max-w-[90vw] rounded-2xl border border-blue-200/30 bg-white/10 backdrop-blur-xl shadow-2xl p-4 text-blue-50">
            <div className="flex justify-between items-start gap-3">
              <div className="text-base font-semibold">
                Hi there — want to know what we do?
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="text-xl leading-none text-blue-100/80 hover:text-white"
                aria-label="close"
              >
                ×
              </button>
            </div>

            <button
              onClick={() => router.push("/goal")}
              className="mt-3 w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-400 transition shadow-lg shadow-blue-500/25"
            >
              Team Goals
            </button>
          </div>
        )}
      </div>
    </div>
  );
}