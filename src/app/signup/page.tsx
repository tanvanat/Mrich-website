"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SignupPage() {
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

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    setLoadingEmail(true);

    try {
      console.log("เริ่ม signIn ด้วย email (signup):", trimmedEmail);
      const res = await signIn("email", {
        redirect: false, // สำคัญ! เพื่อควบคุม redirection และ error เอง
        email: trimmedEmail,
        callbackUrl: "/home",
      });

      if (res?.error) {
        console.error("Email signup error:", res.error);
        if (res.error === "EmailSignin") {
          setError("ไม่สามารถส่งลิงก์ยืนยันได้ กรุณาตรวจสอบอีเมลหรือลองใหม่");
        } else if (res.error.includes("access_denied")) {
          setError("การยืนยันถูกยกเลิก กรุณาลองใหม่");
        } else {
          setError(res.error || "เกิดข้อผิดพลาดในการส่งลิงก์ยืนยัน");
        }
      } else if (res?.ok) {
        // สำเร็จ → redirect ไปหน้า home
        router.push("/home");
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่");
      }
    } catch (err) {
      console.error("Unexpected error during email signup:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoadingGoogle(true);
    setError(null);

    try {
      console.log("เริ่ม signIn ด้วย Google (signup)...");
      const res = await signIn("google", {
        redirect: false, // สำคัญ! เพื่อควบคุม redirection และ error เอง
        callbackUrl: "/home",
      });

      if (res?.error) {
        console.error("Google signup error:", res.error);
        if (res.error.includes("access_denied")) {
          setError("คุณยกเลิกการสมัครด้วย Google หรือไม่ได้อนุญาต");
        } else if (res.error.includes("OAuthSignin")) {
          setError("ไม่สามารถเชื่อมต่อกับ Google ได้ กรุณาลองใหม่หรือตรวจสอบบัญชี");
        } else {
          setError("ไม่สามารถสมัครด้วย Google ได้ กรุณาลองใหม่");
        }
      } else if (res?.ok) {
        // สำเร็จ → redirect ไปหน้า home
        router.push("/home");
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
      }
    } catch (err) {
      console.error("Unexpected error during Google signup:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ Google กรุณาตรวจสอบอินเทอร์เน็ต");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 text-white bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      {/* Background Flowers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-12 left-8 opacity-15 flower-will-change animate-[flowerFloat_6.5s_ease-in-out_infinite]">
          <svg width="260" height="260" viewBox="0 0 100 100" className="animate-[flowerGlow_2.7s_ease-in-out_infinite]">
            <g transform="translate(50,50)">
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <ellipse key={i} rx="20" ry="35" fill="#3b82f6" transform={`rotate(${deg})`} />
              ))}
              <circle r="12" fill="#1e3a8a" />
              <circle r="7" fill="#93c5fd" />
            </g>
          </svg>
        </div>

        <div className="absolute bottom-16 -right-24 opacity-15 flower-will-change animate-[flowerFloat_7.5s_ease-in-out_infinite_1s]">
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

        <div className="absolute top-1/3 right-10 opacity-10 flower-will-change animate-[flowerFloat_8.5s_ease-in-out_infinite_2s]">
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
          <Link href="/signin" className="text-blue-200 underline underline-offset-4 hover:text-white">
            เข้าสู่ระบบ
          </Link>
        </p>

        {/* Error message (แทน alert) */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-400/40 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loadingGoogle}
          className={`w-full h-12 rounded-full border border-blue-300/30 transition-all duration-300 flex items-center justify-center gap-3
            ${loadingGoogle 
              ? "bg-gray-700/50 cursor-wait" 
              : "bg-white/5 hover:bg-white/10 active:scale-95"}`}
        >
          <img src="/google.png" alt="Google" className="h-6 w-6 object-contain" />
          <span className="text-blue-100 font-medium">
            {loadingGoogle ? "กำลังเชื่อมต่อ Google..." : "สมัครด้วย Google"}
          </span>
        </button>

        <p className="text-xs text-blue-200/60 mt-8 text-center">
          การสมัครสมาชิกแสดงว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัวของเรา
        </p>
      </div>
    </div>
  );
}