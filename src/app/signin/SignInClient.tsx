"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function normalizeNick(v: string) {
  return (v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function FlowerBackground() {
  return (
    <>
      <style jsx global>{`
        @keyframes flowerFloat {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-18px) rotate(4deg);
          }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 left-8 opacity-[0.14] animate-[flowerFloat_7s_ease-in-out_infinite]">
          <svg width="280" height="280" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <ellipse
                  key={i}
                  rx="20"
                  ry="35"
                  fill="#3b82f6"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle r="12" fill="#1e3a8a" />
              <circle r="7" fill="#93c5fd" />
            </g>
          </svg>
        </div>

        <div className="absolute bottom-10 -right-16 opacity-[0.12] animate-[flowerFloat_8s_ease-in-out_infinite_1s]">
          <svg width="250" height="250" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 72, 144, 216, 288].map((deg, i) => (
                <ellipse
                  key={i}
                  rx="18"
                  ry="31"
                  fill="#60a5fa"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle r="10" fill="#1e40af" />
              <circle r="6" fill="#bfdbfe" />
            </g>
          </svg>
        </div>

        <div className="absolute top-[34%] right-[10%] opacity-[0.10] animate-[flowerFloat_9s_ease-in-out_infinite_2s]">
          <svg width="140" height="140" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 90, 180, 270].map((deg, i) => (
                <ellipse
                  key={i}
                  rx="15"
                  ry="25"
                  fill="#7dd3fc"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle r="8" fill="#0e7490" />
            </g>
          </svg>
        </div>

        <div className="absolute bottom-[18%] left-[12%] opacity-[0.08] animate-[flowerFloat_10s_ease-in-out_infinite_0.5s]">
          <svg width="180" height="180" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                <ellipse
                  key={i}
                  rx="12"
                  ry="24"
                  fill="#2563eb"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle r="9" fill="#1d4ed8" />
            </g>
          </svg>
        </div>
      </div>
    </>
  );
}

export default function SignInClient() {
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/home";

  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = normalizeNick(nick);

    if (!cleaned) {
      setError("กรุณากรอกชื่อเล่น");
      return;
    }

    if (!password) {
      setError("กรุณากรอกรหัสผ่าน");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/nick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: cleaned, password }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      window.location.href = callbackUrl;
    } catch (err) {
      console.error("[signin] fetch error", err);
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
      <FlowerBackground />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <div className="inline-flex items-center rounded-full border border-blue-300/20 bg-white/5 px-4 py-2 text-sm text-blue-100/80 backdrop-blur-xl">
                Mrich Assessment
              </div>

              <h1 className="mt-6 text-5xl font-bold font-serif leading-tight text-white drop-shadow-[0_0_30px_rgba(96,165,250,0.35)]">
                Welcome back
              </h1>

              <p className="mt-4 text-base leading-7 text-blue-100/75">
                เข้าสู่ระบบเพื่อทำแบบประเมิน ติดตามผลคะแนน และเรียนรู้ต่อในแต่ละคอร์สของคุณ
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg">
                <div className="rounded-2xl border border-blue-300/15 bg-white/5 p-4 backdrop-blur-xl">
                  <div className="text-sm text-blue-200/70">Assessment</div>
                  <div className="mt-1 text-lg font-semibold text-white">Course-based</div>
                </div>
                <div className="rounded-2xl border border-blue-300/15 bg-white/5 p-4 backdrop-blur-xl">
                  <div className="text-sm text-blue-200/70">Progress</div>
                  <div className="mt-1 text-lg font-semibold text-white">Trackable</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end backdrop-blur-xl bg-white/5 border border-blue-400/20 rounded-[28px] shadow-2xl p-8 text-left">
            <h1 className="text-3xl font-bold mb-2 font-serif drop-shadow-[0_0_30px_rgba(96,165,250,0.5)]">
              เข้าสู่ระบบ
            </h1>

            <p className="text-sm text-blue-200/70 mb-6">
              ลงชื่อเข้าใช้ด้วยชื่อเล่นและรหัสผ่านของคุณ
            </p>

            {error && (
              <div className="mt-2 mb-4 p-4 bg-red-500/20 border border-red-400/40 rounded-xl text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm text-blue-200 mb-1">
                  ชื่อเล่น (ภาษาอังกฤษเท่านั้น)
                </label>
                <input
                  value={nick}
                  onChange={(e) => setNick(normalizeNick(e.target.value))}
                  placeholder="e.g. casper"
                  maxLength={16}
                  autoComplete="off"
                  className="w-full h-12 px-4 rounded-xl bg-white/10 border border-blue-300/30 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div>
                <label className="block text-sm text-blue-200 mb-1">
                  รหัสผ่าน (6 ตัว a-z หรือ 0-9)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="xxxxxx"
                  maxLength={6}
                  autoComplete="current-password"
                  className="w-full h-12 px-4 rounded-xl bg-white/10 border border-blue-300/30 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-full font-semibold transition ${
                  loading
                    ? "bg-gray-700/50 cursor-wait"
                    : "bg-blue-600 hover:bg-blue-500 active:scale-95"
                }`}
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>

            <p className="text-xs text-blue-200/60 mt-8 text-center">
              การดำเนินการต่อแสดงว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัวของเรา
            </p>

            <p className="text-sm text-blue-200/70 mt-4 text-center">
              ยังไม่มีบัญชี?{" "}
              <Link
                href="/signup"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition"
              >
                ลงทะเบียนก่อน
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}