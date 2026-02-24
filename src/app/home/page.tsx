"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import { Lock, ArrowRight, Shield } from "lucide-react";

type ScoreData = {
  hasScore: boolean;
  totalScore?: number;
  maxScore?: number;
  percent?: number;
  message?: string;
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(true);
  const [score, setScore] = useState<ScoreData | null>(null);
  const [loadingScore, setLoadingScore] = useState(true);
  const [showCasper, setShowCasper] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false); // ตรวจว่าเคย interact หรือยัง
  const videoRef = useRef<HTMLVideoElement>(null); // ref เพื่อควบคุมวิดีโอ

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    if (status === "authenticated") {
      setLoadingScore(true);
      fetch("/api/user/score", {
        cache: "no-store",
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch score");
          return res.json();
        })
        .then((data: ScoreData) => {
          setScore(data);
        })
        .catch((err) => {
          console.error("Error fetching score:", err);
          setScore({ hasScore: false, message: "ไม่สามารถโหลดคะแนนได้" });
        })
        .finally(() => setLoadingScore(false));
    }
  }, [status, router]);

  // ซ่อน Casper หลังจากเล่นวิดีโอเสร็จ ~9 วินาที
  useEffect(() => {
    if (showCasper) {
      const timer = setTimeout(() => {
        setShowCasper(false);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [showCasper]);

  // ตรวจจับ user gesture ครั้งแรก (คลิก, scroll, touch)
  useEffect(() => {
    if (userInteracted) return;

    const handleInteraction = () => {
      setUserInteracted(true);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play().catch((err) => {
          console.log("Play after interaction failed:", err);
        });
      }
      // ลบ listener หลัง interact ครั้งแรก
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("scroll", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("scroll", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("scroll", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, [userInteracted]);

  const userLabel = useMemo(() => {
    return session?.user?.email ?? session?.user?.name ?? "Unknown";
  }, [session]);

  const isAdmin = session?.user?.role === "ADMIN";

  const handleTeamGoalsClick = () => router.push("/goal");

  const courses = useMemo(
    () => [
      {
        id: 1,
        title: "Course 1",
        subtitle: "Leadership basics • habits • reflection",
        accent: "from-blue-500/25 to-indigo-500/10",
        locked: true,
      },
      {
        id: 2,
        title: "Course 2",
        subtitle: "Communication • Win/Win • teamwork",
        accent: "from-sky-500/25 to-blue-500/10",
        locked: true,
      },
      {
        id: 3,
        title: "Course 3",
        subtitle: "Finance • Relationship • Productivity",
        accent: "from-indigo-500/25 to-violet-500/10",
        locked: true,
      },
    ],
    []
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-blue-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      {/* Background Flowers (เหมือนเดิมทั้งหมด) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-16 right-0 opacity-15 flower-will-change animate-[flowerFloat_7s_ease-in-out_infinite]">
          <svg width="260" height="260" viewBox="0 0 100 100" className="animate-[flowerGlow_3s_ease-in-out_infinite]">
            <g transform="translate(50,50)">
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <ellipse key={i} rx="18" ry="32" fill="#3b82f6" transform={`rotate(${deg})`} />
              ))}
              <circle r="12" fill="#1e3a8a" />
              <circle r="7" fill="#93c5fd" />
            </g>
          </svg>
        </div>

        <div className="absolute bottom-[-80px] left-[-70px] opacity-10 flower-will-change animate-[flowerFloat_8s_ease-in-out_infinite_1s]">
          <svg width="260" height="260" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 72, 144, 216, 288].map((deg, i) => (
                <ellipse key={i} rx="18" ry="30" fill="#60a5fa" transform={`rotate(${deg})`} />
              ))}
              <circle r="10" fill="#1e40af" />
              <circle r="6" fill="#bfdbfe" />
            </g>
          </svg>
        </div>

        <div className="absolute top-1/2 left-10 opacity-10 flower-will-change animate-[flowerFloat_9s_ease-in-out_infinite_2s]">
          <svg width="110" height="110" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 90, 180, 270].map((deg, i) => (
                <ellipse key={i} rx="14" ry="24" fill="#7dd3fc" transform={`rotate(${deg})`} />
              ))}
              <circle r="8" fill="#0e7490" />
            </g>
          </svg>
        </div>

        <div className="absolute bottom-1/3 right-16 opacity-10 flower-will-change animate-[flowerFloat_6.5s_ease-in-out_infinite]">
          <svg width="110" height="110" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[30, 90, 150, 210, 270, 330].map((deg, i) => (
                <ellipse key={i} rx="12" ry="22" fill="#a5f3fc" transform={`rotate(${deg})`} />
              ))}
              <circle r="6" fill="#0e7490" />
            </g>
          </svg>
        </div>
      </div>

      <div className="absolute inset-0 bg-black/25" />

      {/* Casper the Friendly Ghost MP4 - Crop เป็นวงกลม */}
      {showCasper && (
        <div className="fixed top-[15%] right-[5%] z-50 w-36 h-36 pointer-events-none animate-casper-float-in-out">
          <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-cyan-300/60 shadow-2xl shadow-cyan-500/70">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={!userInteracted} // muted จนกว่าจะ interact
              src="/casper-newbg2.mp4"
              className="absolute inset-0 w-[140%] h-[140%] object-cover object-[50%_35%] scale-100"
              onEnded={() => setShowCasper(false)}
              onError={(e) => console.error("Video error:", e)}
            />
          </div>

          {/* ปุ่ม "Click me" เพื่อ trigger user gesture + เปิดเสียง */}
          {!userInteracted && (
            <button
              onClick={() => {
                setUserInteracted(true);
                if (videoRef.current) {
                  videoRef.current.muted = false;
                  videoRef.current.play().catch((err) => {
                    console.log("Play after gesture failed:", err);
                  });
                }
              }}
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-cyan-600/90 text-white text-sm font-bold rounded-full shadow-lg hover:bg-cyan-500 transition-all transform hover:scale-105 z-60"
            >
              Click me 👻
            </button>
          )}
        </div>
      )}

      {/* CSS Animation สำหรับลอยเข้า-ออก */}
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

      {/* Content หลักของหน้า Home */}
      <div className="relative mx-auto w-full max-w-6xl px-6 py-10">
        {/* Header bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="rounded-2xl border border-blue-300/20 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
            <div className="text-2xl md:text-3xl font-bold text-white font-serif drop-shadow-[0_0_20px_rgba(96,165,250,0.45)]">
              Welcome back
            </div>
            <div className="mt-1 text-blue-200/80">
              Signed in as: <span className="text-blue-100 font-semibold">{userLabel}</span>
            </div>

            {/* แสดงคะแนนล่าสุด */}
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
              <Link
                href="/form"
                className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2 font-semibold text-white hover:bg-blue-400 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:scale-[1.02]"
              >
                Go to Assessment Form <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
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

        {/* Courses section */}
        <div className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xl md:text-2xl font-bold text-white font-serif">
                Your Courses
              </div>
              <div className="text-blue-200/70 mt-1">
                Courses are currently locked — complete your assessment to unlock.
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div
                key={c.id}
                className="relative rounded-2xl border border-blue-300/20 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${c.accent}`} />

                <div className="relative p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-white">{c.title}</div>
                      <div className="mt-1 text-sm text-blue-200/80">{c.subtitle}</div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-blue-300/15 bg-black/20 p-4">
                    <div className="text-blue-100 font-semibold">Preview</div>
                    <div className="mt-1 text-sm text-blue-200/70">
                      Content will appear here once unlocked.
                    </div>
                  </div>
                </div>

                {c.locked && (
                  <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="text-center px-6">
                      <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-white/10 border border-blue-200/20 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-blue-100" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Popup */}
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
              onClick={handleTeamGoalsClick}
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