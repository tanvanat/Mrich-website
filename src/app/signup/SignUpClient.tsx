"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

function normalizeNick(v: string) {
  return (v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function SignUpClient() {
  const router = useRouter();

  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedNick = normalizeNick(nick);

    if (!cleanedNick) {
      setError("กรุณากรอกชื่อเล่น");
      return;
    }

    if (!/^[a-z0-9]{6}$/.test(password)) {
      setError("รหัสผ่านต้องมี 6 ตัว (ตัวอักษร a-z หรือตัวเลข 0-9 เท่านั้น)");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: cleanedNick, password }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "สมัครสมาชิกไม่สำเร็จ");
        return;
      }

      router.push("/signin");
    } catch (err) {
      console.error("[signup] fetch error", err);
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 text-white bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      {/* Background Flowers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-12 left-8 opacity-15 animate-[flowerFloat_6.5s_ease-in-out_infinite]">
          <svg width="260" height="260" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <ellipse key={i} rx="20" ry="35" fill="#3b82f6" transform={`rotate(${deg})`} />
              ))}
              <circle r="12" fill="#1e3a8a" />
              <circle r="7" fill="#93c5fd" />
            </g>
          </svg>
        </div>
        <div className="absolute bottom-16 -right-24 opacity-15 animate-[flowerFloat_7.5s_ease-in-out_infinite_1s]">
          <svg width="240" height="240" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 72, 144, 216, 288].map((deg, i) => (
                <ellipse key={i} rx="18" ry="30" fill="#60a5fa" transform={`rotate(${deg})`} />
              ))}
              <circle r="10" fill="#1e40af" />
              <circle r="6" fill="#bfdbfe" />
            </g>
          </svg>
        </div>
        <div className="absolute top-1/3 right-10 opacity-10 animate-[flowerFloat_8.5s_ease-in-out_infinite_2s]">
          <svg width="120" height="120" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 90, 180, 270].map((deg, i) => (
                <ellipse key={i} rx="15" ry="25" fill="#7dd3fc" transform={`rotate(${deg})`} />
              ))}
              <circle r="8" fill="#0e7490" />
            </g>
          </svg>
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/5 border border-blue-400/20 rounded-2xl shadow-2xl p-8 text-left">
        <h1 className="text-3xl font-bold mb-2 font-serif drop-shadow-[0_0_30px_rgba(96,165,250,0.5)]">
          สมัครสมาชิก
        </h1>

        <p className="text-sm text-blue-200/80 mb-6">
          มีบัญชีแล้ว?{" "}
          <Link href="/signin" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition">
            เข้าสู่ระบบ
          </Link>
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-400/40 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-blue-200 mb-1">ชื่อเล่น (ภาษาอังกฤษ)</label>
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
            <label className="block text-sm text-blue-200 mb-1">รหัสผ่าน (6 ตัว a-z หรือ 0-9)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6))}
              placeholder="xxxxxx"
              maxLength={6}
              autoComplete="new-password"
              className="w-full h-12 px-4 rounded-xl bg-white/10 border border-blue-300/30 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>

          <div>
            <label className="block text-sm text-blue-200 mb-1">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6))}
              placeholder="xxxxxx"
              maxLength={6}
              autoComplete="new-password"
              className="w-full h-12 px-4 rounded-xl bg-white/10 border border-blue-300/30 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 rounded-full font-semibold transition ${
              loading ? "bg-gray-700/50 cursor-wait" : "bg-blue-600 hover:bg-blue-500 active:scale-95"
            }`}
          >
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="text-xs text-blue-200/60 mt-8 text-center">
          การสมัครสมาชิกแสดงว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัวของเรา
        </p>
      </div>
    </div>
  );
}