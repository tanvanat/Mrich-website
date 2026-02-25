"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    // แปลงเป็น lowercase และเอาเฉพาะ a-z
    const cleaned = value.toLowerCase().replace(/[^a-z]/g, "");
    setNickname(cleaned);
  };

  const handleNicknameSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedName = nickname.trim();

    if (!trimmedName) {
      setError("กรุณากรอกชื่อเล่น");
      return;
    }

    if (!/^[a-z]+$/.test(trimmedName)) {
      setError("ชื่อเล่นต้องเป็นตัวพิมพ์เล็กภาษาอังกฤษเท่านั้น (a-z)");
      return;
    }

    setLoading(true);

    try {
      console.log("Nickname login:", trimmedName);

      localStorage.setItem("nickname", trimmedName);

      router.push("/home");
    } catch (err) {
      console.error("Nickname sign-in error:", err);
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 text-white bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      
      <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/5 border border-blue-400/20 rounded-2xl shadow-2xl p-8 text-left">
        
        <h1 className="text-3xl font-bold mb-2 font-serif drop-shadow-[0_0_30px_rgba(96,165,250,0.5)]">
          เข้าสู่ระบบ
        </h1>

        <p className="text-sm text-blue-200/80 mb-6">
          ยังไม่มีบัญชี?{" "}
          <Link href="/signup" className="text-blue-200 underline underline-offset-4 hover:text-white">
            สมัครสมาชิก
          </Link>
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-400/40 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleNicknameSignIn} className="space-y-4">
          
          <div>
            <label className="block text-sm text-blue-200 mb-2">
              ชื่อเล่น (ตัวพิมพ์เล็กภาษาอังกฤษเท่านั้น)
            </label>

            <input
              type="text"
              value={nickname}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="enter nickname"
              maxLength={12}
              className="w-full h-12 px-4 rounded-xl bg-white/10 border border-blue-300/30 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 rounded-full transition-all duration-300 font-medium
              ${loading
                ? "bg-gray-700/50 cursor-wait"
                : "bg-blue-600 hover:bg-blue-500 active:scale-95"}`}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-xs text-blue-200/60 mt-8 text-center">
          การดำเนินการต่อแสดงว่าคุณยอมรับเงื่อนไขการใช้งานของเรา
        </p>
      </div>
    </div>
  );
}