"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();

  // ถ้า login แล้ว เด้งไป /home
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

    // NOTE: ต้องเปิด Email provider ใน NextAuth ก่อนถึงจะใช้ได้
    await signIn("email", { email, callbackUrl: "/home" });
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/home" });
  };

  const handleFacebookSignIn = () => {
    // NOTE: ต้องเปิด Facebook provider ใน NextAuth ก่อนถึงจะใช้ได้
    signIn("facebook", { callbackUrl: "/home" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-center items-center text-center text-white">
      {/* Background Video */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        src="/background.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md text-center">
        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 text-black">Log In</h1>
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>

        {/* Email Sign-in */}
        <form onSubmit={handleEmailSignIn} className="mt-6">
          <label htmlFor="email" className="block text-sm text-left text-black">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded mt-1 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="text-left mt-2">
            <Link href="/forgot-email" className="text-blue-500 text-sm hover:underline">
              Forgot Email?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded mt-4 hover:bg-blue-600"
          >
            Continue with Email
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative mt-6 flex items-center">
          <div className="flex-grow border-t border-gray-300" />
          <span className="mx-3 text-sm text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-300" />
        </div>

        {/* Social Sign-ins */}
        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-black"
          >
            <img
              src="/google.png"
              alt="Google"
              className="h-6 w-7 object-contain mr-2"
            />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleFacebookSignIn}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-black"
          >
            <img
              src="/facebook.png"
              alt="Facebook"
              className="h-6 w-7 object-contain mr-2"
            />
            Continue with Facebook
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          By continuing, you agree to our terms.
        </p>
      </div>
    </div>
  );
}
