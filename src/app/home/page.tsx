// src/app/home/HomeClient.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Shield } from "lucide-react";

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

// ✅ locked state ต่อ course จาก DB จริง
type LockedMap = Record<string, boolean>; // key = course slug

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

// formId ของแต่ละ course slug
const COURSE_FORM_MAP: Record<string, string> = {
  "mindset-principles": "mrich-assessment-course1-v1",
  "proactive":          "mrich-assessment-course2-v1",
};

function FlowerBackground() {
  return (
    <>
      <style jsx global>{`
        @keyframes flowerFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(4deg); }
        }
        @keyframes casper-float-in-out {
          0%   { transform: translateX(150%) translateY(0) scale(0.7); opacity: 0; }
          15%  { transform: translateX(0) translateY(-30px) scale(1); opacity: 1; }
          70%  { transform: translateX(0) translateY(-60px) scale(1); opacity: 1; }
          100% { transform: translateX(-180%) translateY(-100px) scale(0.6); opacity: 0; }
        }
        .animate-casper-float-in-out { animation: casper-float-in-out 8.5s ease-in-out forwards; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-12 left-8 opacity-[0.14] animate-[flowerFloat_7s_ease-in-out_infinite]">
          <svg width="280" height="280" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <ellipse key={i} rx="20" ry="35" fill="#3b82f6" transform={`rotate(${deg})`} />
              ))}
              <circle r="12" fill="#1e3a8a" />
              <circle r="7" fill="#93c5fd" />
            </g>
          </svg>
        </div>
        <div className="absolute bottom-8 -right-16 opacity-[0.12] animate-[flowerFloat_8s_ease-in-out_infinite_1s]">
          <svg width="250" height="250" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 72, 144, 216, 288].map((deg, i) => (
                <ellipse key={i} rx="18" ry="31" fill="#60a5fa" transform={`rotate(${deg})`} />
              ))}
              <circle r="10" fill="#1e40af" />
              <circle r="6" fill="#bfdbfe" />
            </g>
          </svg>
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [me, setMe] = useState<MeResp | null>(null);
  const [score, setScore] = useState<ScoreData | null>(null);
  const [loadingScore, setLoadingScore] = useState(true);

  // ✅ lockedMap อ่านจาก DB ผ่าน /api/user/locked-courses
  const [lockedMap, setLockedMap] = useState<LockedMap>({});
  const [loadingLocked, setLoadingLocked] = useState(true);

  const [showPopup, setShowPopup] = useState(true);
  const [showCasper, setShowCasper] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // โหลด me
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return { authed: false } as MeResp;
        return (await res.json()) as MeResp;
      })
      .then((data) => {
        setMe(data);
        if (!data.authed) router.replace("/signin");
      })
      .catch(() => {
        setMe({ authed: false });
        router.replace("/signin");
      });
  }, [router]);

  // โหลดคะแนน
  useEffect(() => {
    if (!me || !me.authed) return;
    setLoadingScore(true);
    fetch("/api/user/score", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: ScoreData) => setScore(data))
      .catch(() => setScore({ hasScore: false, message: "ยังไม่ได้รับการตรวจ" }))
      .finally(() => setLoadingScore(false));
  }, [me]);

  // ✅ โหลด locked state จาก DB จริง (ไม่ใช้ sessionStorage อีกต่อไป)
  useEffect(() => {
    if (!me || !me.authed) return;

    setLoadingLocked(true);
    fetch("/api/user/locked-courses", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: LockedMap) => setLockedMap(data))
      .catch(() => setLockedMap({}))
      .finally(() => setLoadingLocked(false));
  }, [me]);

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

  const userLabel = useMemo(() => (me && me.authed ? me.nick : "unknown"), [me]);

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
        subtitle: "Proactive",
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
    if (access === "BOTH") return !!canLearner || !!canLeader;
    if (access === "LEADER_ONLY") return !!canLeader;
    return false;
  }

  // ✅ อ่านจาก lockedMap (DB) แทน sessionStorage
  function isCourseSubmitted(slug: string) {
    if (isAdmin) return false; // ADMIN กดได้เสมอ
    return !!lockedMap[slug];
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
      <FlowerBackground />
      <div className="absolute inset-0 bg-black/20" />

      {showCasper && (
        <div className="fixed top-[14%] right-[5%] z-50 w-32 h-32 pointer-events-none animate-casper-float-in-out">
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

      <div className="relative mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
          <div className="rounded-[28px] border border-blue-300/20 bg-white/5 backdrop-blur-xl p-7 shadow-2xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-xl">
                <div className="text-4xl font-bold text-white font-serif leading-tight drop-shadow-[0_0_20px_rgba(96,165,250,0.45)]">
                  Welcome back
                </div>
                <div className="mt-3 text-lg text-blue-200/85">
                  Signed in as:{" "}
                  <span className="text-blue-100 font-semibold">{userLabel}</span>
                </div>
                <div className="mt-1 text-sm text-cyan-300/90">
                  Role: {me.authed ? me.role : "-"}
                </div>
                <div className="mt-5">
                  {loadingScore ? (
                    <div className="text-blue-300 text-sm">กำลังโหลดคะแนน...</div>
                  ) : score?.hasScore ? (
                    <div className="text-lg font-medium text-white">
                      คะแนนล่าสุด:{" "}
                      <span className="text-cyan-300 font-bold">
                        {score.totalScore} / {score.maxScore}
                      </span>{" "}
                      <span className="text-cyan-400 font-semibold">({score.percent}%)</span>
                    </div>
                  ) : (
                    <div className="text-amber-300 text-sm font-medium">
                      {score?.message || "ยังไม่ได้รับการตรวจ"}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-3 shrink-0">
                {isAdmin && (
                  <Link
                    href="/admin/exam"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-300/20 bg-white/5 backdrop-blur-xl px-5 py-3.5 font-bold text-blue-100 hover:bg-white/10 transition shadow-xl"
                  >
                    <Shield className="h-5 w-5" />
                    ไปหน้า Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={signOutNick}
                  className="rounded-2xl border border-blue-300/30 px-5 py-3.5 font-semibold text-blue-100 hover:bg-white/10 transition-all duration-300"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
          <div className="hidden xl:block" />
        </div>

        <div className="mt-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-3xl font-bold text-white font-serif">Your Courses</div>
              <div className="mt-2 text-sm text-blue-200/65">
                เลือกคอร์สที่ต้องการเริ่มทำแบบประเมิน
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((c) => {
              const unlocked = canAccessCourse(c.access);
              // ✅ submitted อ่านจาก DB (lockedMap) ไม่ใช่ sessionStorage
              const submitted = isCourseSubmitted(c.slug);
              const disabled = !unlocked || submitted;
              const isLoading = loadingLocked && !isAdmin;

              return (
                <div
                  key={c.id}
                  className="group relative rounded-[28px] border border-blue-300/20 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.accent}`} />

                  <div className="relative p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-3xl font-bold text-white tracking-tight">
                          {c.title}
                        </div>
                        <div className="mt-2 text-base text-blue-100/80">{c.subtitle}</div>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
                      <div className="text-sm text-blue-100/60">
                        {isLoading
                          ? "กำลังโหลด..."
                          : submitted
                          ? "คุณส่งข้อสอบชุดนี้แล้ว"
                          : !unlocked
                          ? "คอร์สนี้ยังไม่พร้อมสำหรับสิทธิ์ของคุณ"
                          : "พร้อมเริ่มทำแบบประเมิน"}
                      </div>

                      <button
                        onClick={() => openCourse(c)}
                        disabled={disabled || isLoading}
                        className={`min-w-[210px] rounded-full px-6 py-3 font-bold transition ${
                          isLoading
                            ? "bg-white/10 text-blue-100/50 cursor-wait"
                            : disabled
                            ? "bg-white/10 text-blue-100/50 cursor-not-allowed"
                            : "bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/25"
                        }`}
                      >
                        {isLoading
                          ? "..."
                          : !unlocked
                          ? "No Access"
                          : submitted
                          ? "Submitted ✅"
                          : "Start Assessment"}
                      </button>
                    </div>
                  </div>

                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="text-center px-6">
                        <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-white/10 border border-blue-200/20 flex items-center justify-center">
                          <Lock className="h-5 w-5 text-blue-100" />
                        </div>
                        <div className="text-sm font-semibold text-white">
                          Locked for your role
                        </div>
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
              className="mt-3 w-full bg-blue-500 text-white font-bold py-2.5 px-4 rounded-full hover:bg-blue-400 transition shadow-lg shadow-blue-500/25"
            >
              Team Goals
            </button>
          </div>
        )}
      </div>
    </div>
  );
}