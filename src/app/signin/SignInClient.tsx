"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function normalizeNick(v: string) {
  return (v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  //                                                    ^^^ เพิ่ม 0-9
}

export default function SignInClient() {
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/home";

  const [nick, setNick] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChangeNick = (v: string) => {
    setNick(normalizeNick(v));
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = normalizeNick(nick);
    console.log("[signin] submit clicked, cleaned =", cleaned, "callbackUrl=", callbackUrl);

    if (!cleaned || !/^[a-z0-9]+$/.test(cleaned)) {
      setError("กรุณากรอกชื่อเล่นเป็นภาษาอังกฤษเท่านั้น (a-z)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/nick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: cleaned }),
        cache: "no-store",
      });

      console.log("[signin] /api/auth/nick status =", res.status);

      const data = await res.json().catch(() => ({}));
      console.log("[signin] response =", data);

      if (!res.ok) {
        setError(data?.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      // ✅ สำคัญ: full reload เพื่อให้ middleware เห็น cookie ชัวร์
      window.location.href = callbackUrl;
    } catch (err) {
      console.error("[signin] fetch error", err);
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
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

        {error && (
          <div className="mt-2 mb-4 p-4 bg-red-500/20 border border-red-400/40 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm text-blue-200">ชื่อเล่น (กรอกภาษาอังกฤษเท่านั้น)</label>
          <input
            value={nick}
            onChange={(e) => onChangeNick(e.target.value)}
            placeholder="e.g. casper"
            maxLength={16}
            autoComplete="off"
            className="w-full h-12 px-4 rounded-xl bg-white/10 border border-blue-300/30 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 rounded-full font-semibold transition ${
              loading ? "bg-gray-700/50 cursor-wait" : "bg-blue-600 hover:bg-blue-500 active:scale-95"
            }`}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-xs text-blue-200/60 mt-8 text-center">
          การดำเนินการต่อแสดงว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัวของเรา
        </p>
      </div>
    </div>
  );
}