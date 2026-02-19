"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Lock, ArrowRight, Shield } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  const userLabel = useMemo(() => {
    return session?.user?.email ?? session?.user?.name ?? "Unknown";
  }, [session]);

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
      {/* Background Flowers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* top-right flower (smaller, not distracting) */}
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

        {/* bottom-left flower */}
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

        {/* subtle small flowers */}
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

      {/* overlay */}
      <div className="absolute inset-0 bg-black/25" />

      {/* Content */}
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

          {(session?.user as any)?.role === "ADMIN" && (
            <Link
              href="/admin/exam"
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-300/20 bg-white/5 backdrop-blur-xl px-5 py-4 font-bold text-blue-100 hover:bg-white/10 transition shadow-2xl"
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
                {/* accent glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${c.accent}`} />

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
                  </div>

                  {/* Fake preview area */}
                  <div className="mt-6 rounded-xl border border-blue-300/15 bg-black/20 p-4">
                    <div className="text-blue-100 font-semibold">Preview</div>
                    <div className="mt-1 text-sm text-blue-200/70">
                      Content will appear here once unlocked.
                    </div>
                  </div>
                </div>

                {/* Locked overlay */}
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

        {/* Popup (theme matched) */}
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
                &times;
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
