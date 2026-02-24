"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/home");
    }
  }, [status, router]);

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    setLoadingEmail(true);

    try {
      console.log("เริ่ม signIn ด้วย email:", trimmedEmail);
      const res = await signIn("email", {
        redirect: false, // สำคัญ! ป้องกัน redirect อัตโนมัติ + error alert
        email: trimmedEmail,
        callbackUrl: "/home",
      });

      if (res?.error) {
        console.error("Email sign-in error:", res.error);
        if (res.error === "EmailSignin") {
          setError("ไม่สามารถส่งลิงก์ยืนยันได้ กรุณาตรวจสอบอีเมลหรือลองใหม่");
        } else if (res.error.includes("access_denied")) {
          setError("การยืนยันถูกยกเลิก กรุณาลองใหม่");
        } else {
          setError(res.error || "เกิดข้อผิดพลาดในการส่งลิงก์ยืนยัน");
        }
      } else if (res?.ok) {
        // สำเร็จ → redirect เอง
        router.push("/home");
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่");
      }
    } catch (err) {
      console.error("Unexpected error during email sign-in:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setError(null);

    try {
      console.log("เริ่ม signIn ด้วย Google...");
      const res = await signIn("google", {
        redirect: false, // สำคัญ! ป้องกัน redirect อัตโนมัติ + error alert
        callbackUrl: "/home",
      });

      if (res?.error) {
        console.error("Google sign-in error:", res.error);
        if (res.error.includes("access_denied")) {
          setError("คุณยกเลิกการล็อกอิน Google หรือไม่ได้อนุญาต");
        } else if (res.error.includes("OAuthSignin")) {
          setError("ไม่สามารถเชื่อมต่อกับ Google ได้ กรุณาลองใหม่หรือตรวจสอบบัญชี");
        } else {
          setError("ไม่สามารถล็อกอินด้วย Google ได้ กรุณาลองใหม่");
        }
      } else if (res?.ok) {
        // สำเร็จ → redirect เอง
        router.push("/home");
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
      }
    } catch (err) {
      console.error("Unexpected error during Google sign-in:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ Google กรุณาตรวจสอบอินเทอร์เน็ต");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 text-white bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      {/* Background Flowers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 right-10 opacity-20 flower-will-change animate-[flowerFloat_6s_ease-in-out_infinite]">
          <svg width="280" height="280" viewBox="0 0 100 100" className="animate-[flowerGlow_2.5s_ease-in-out_infinite]">
            <g transform="translate(50,50)">
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <ellipse key={i} rx="20" ry="35" fill="#3b82f6" transform={`rotate(${deg})`} />
              ))}
              <circle r="12" fill="#1e3a8a" />
              <circle r="7" fill="#93c5fd" />
            </g>
          </svg>
        </div>

        <div className="absolute bottom-16 -left-20 opacity-15 flower-will-change animate-[flowerFloat_7s_ease-in-out_infinite_1s]">
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

        <div className="absolute top-1/3 left-10 opacity-10 flower-will-change animate-[flowerFloat_8.5s_ease-in-out_infinite_2s]">
          <svg width="120" height="120" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 90, 180, 270].map((deg, i) => (
                <ellipse key={i} rx="15" ry="25" fill="#7dd3fc" transform={`rotate(${deg})`} />
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

      {/* Card */}
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

        {/* Error message (แทน alert) */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-400/40 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleEmailSignIn} className="mt-6">
          <label htmlFor="email" className="block text-sm text-blue-100 mb-2">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="กรอกอีเมลของคุณ"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-300/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          />

          <div className="text-left mt-3">
            <Link href="/forgot-email" className="text-blue-200/80 text-sm hover:text-white underline underline-offset-4">
              ลืมอีเมล?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loadingEmail}
            className={`w-full mt-6 h-12 rounded-full transition-all duration-300 font-semibold shadow-lg
              ${loadingEmail 
                ? "bg-blue-700/50 cursor-wait" 
                : "bg-blue-600 hover:bg-blue-500 hover:shadow-xl hover:scale-[1.02]"}`}
          >
            {loadingEmail ? "กำลังส่งลิงก์..." : "เข้าสู่ระบบด้วยอีเมล"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8 flex items-center">
          <div className="flex-grow border-t border-blue-300/20" />
          <span className="mx-4 text-sm text-blue-200/70">หรือ</span>
          <div className="flex-grow border-t border-blue-300/20" />
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loadingGoogle}
          className={`w-full h-12 rounded-full border border-blue-300/30 transition-all duration-300 flex items-center justify-center gap-3
            ${loadingGoogle 
              ? "bg-gray-700/50 cursor-wait" 
              : "bg-white/5 hover:bg-white/10 active:scale-95"}`}
        >
          <img src="/google.png" alt="Google" className="h-6 w-6 object-contain" />
          <span className="text-blue-100 font-medium">
            {loadingGoogle ? "กำลังเชื่อมต่อ Google..." : "เข้าสู่ระบบด้วย Google"}
          </span>
        </button>

        <p className="text-xs text-blue-200/60 mt-8 text-center">
          การดำเนินการต่อแสดงว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัวของเรา
        </p>
      </div>
    </div>
  );
}