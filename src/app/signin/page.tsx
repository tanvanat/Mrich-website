"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.push("/home");
  }, [status, router]);

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim();

    if (!email) {
      alert("Please enter a valid email address.");
      return;
    }

    await signIn("email", { email, callbackUrl: "/home" });
  };

  const handleGoogleSignIn = () => signIn("google", { callbackUrl: "/home" });

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
          Log In
        </h1>

        <p className="text-sm text-blue-200/80">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-200 underline underline-offset-4 hover:text-white">
            Sign Up
          </Link>
        </p>

        {/* Email */}
        <form onSubmit={handleEmailSignIn} className="mt-6">
          <label htmlFor="email" className="block text-sm text-blue-100">
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            className="w-full mt-2 px-4 py-2 rounded-lg bg-white/10 border border-blue-300/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <div className="text-left mt-3">
            <Link href="/forgot-email" className="text-blue-200/80 text-sm hover:text-white underline underline-offset-4">
              Forgot Email?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full mt-5 h-11 rounded-full bg-blue-500 hover:bg-blue-400 transition-all duration-300 font-semibold shadow-lg shadow-blue-500/30 hover:scale-[1.02]"
          >
            Continue with Email
          </button>
        </form>

        {/* OR */}
        <div className="relative mt-6 flex items-center">
          <div className="flex-grow border-t border-blue-300/20" />
          <span className="mx-3 text-sm text-blue-200/70">OR</span>
          <div className="flex-grow border-t border-blue-300/20" />
        </div>

        {/* Social */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full h-11 rounded-full border border-blue-300/20 bg-white/5 hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <img src="/google.png" alt="Google" className="h-5 w-5 object-contain" />
            <span className="text-blue-100">Continue with Google</span>
          </button>
        </div>

        <p className="text-xs text-blue-200/60 mt-6">
          By continuing, you agree to our terms.
        </p>
      </div>
    </div>
  );
}
