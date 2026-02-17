"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [dragging, setDragging] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(true);

  // ถ้าไม่ได้ login ให้เด้งกลับ /signin
  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  // ✅ handler ปุ่ม Team Goals → ไปหน้า /goal
  const handleTeamGoalsClick = () => {
    router.push("/goal");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Video */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        src="/background.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay ให้ text อ่านง่ายขึ้น */}
      <div className="absolute inset-0 bg-black/30 -z-10" />

      {/* Top Card */}
      <div className="min-h-screen flex flex-col items-center justify-start p-6">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-6 shadow mt-10">
          <h1 className="text-2xl font-bold text-black">Welcome</h1>
          <p className="mt-2 text-gray-600">
            Signed in as:{" "}
            <b>{session?.user?.email ?? session?.user?.name ?? "Unknown"}</b>
          </p>

          <div className="mt-6 flex gap-3 flex-wrap">
            <Link
              href="/form"
              className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-white hover:bg-cyan-600"
            >
              Go to Assessment Form
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-xl border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50 text-black"
            >
              Sign out
            </button>
          </div>
        </div>

        {(session?.user as any)?.role === "ADMIN" && (
          <a
            href="/admin/exam"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#e5e7eb",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            ไปหน้า Admin Dashboard
          </a>
        )}

        {/* Course Cards (ลากได้) */}
        <div className="flex flex-col items-center mt-20 relative w-full">
          {/* Yellow Rectangle */}
          <motion.div
            drag="y"
            dragConstraints={{ top: -90, bottom: 20 }}
            onDragStart={() => setDragging(1)}
            onDragEnd={() => setDragging(null)}
            whileTap={{ scale: 1.05 }}
            className="w-[450px] h-[400px] bg-yellow-400 rounded-[20%] absolute shadow-xl"
            style={{ zIndex: dragging === 1 ? 10 : 1 }}
          >
            {/* Oval */}
            <div className="w-[150px] h-[50px] bg-black rounded-[70%] top-[-25px] left-1/2 -translate-x-1/2 absolute">
              <div className="w-[90px] h-[10px] bg-yellow-400 rounded-[30%] absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-0.5" />
            </div>

            <div className="p-10 text-black font-bold text-2xl">
              Course 1
              <div className="mt-3 font-medium text-base opacity-80">
                Leadership basics • habits • reflection
              </div>
            </div>
          </motion.div>

          {/* Red Rectangle */}
          <motion.div
            drag="y"
            dragConstraints={{ top: -60, bottom: 70 }}
            onDragStart={() => setDragging(2)}
            onDragEnd={() => setDragging(null)}
            whileTap={{ scale: 1.05 }}
            className="w-[450px] h-[350px] bg-red-500 rounded-[20%] absolute translate-y-20 shadow-xl"
            style={{ zIndex: dragging === 2 ? 10 : 2 }}
          >
            {/* Oval */}
            <div className="w-[150px] h-[50px] bg-yellow-400 rounded-[70%] top-[-25px] left-1/2 -translate-x-1/2 absolute">
              <div className="w-[90px] h-[10px] bg-red-500 rounded-[30%] absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-0.5" />
            </div>

            <div className="p-10 text-white font-bold text-2xl">
              Course 2
              <div className="mt-3 font-medium text-base opacity-90">
                Communication • Win/Win • teamwork
              </div>
            </div>
          </motion.div>

          {/* Blue Rectangle */}
          <motion.div
            drag="y"
            dragConstraints={{ top: -10, bottom: 140 }}
            onDragStart={() => setDragging(3)}
            onDragEnd={() => setDragging(null)}
            whileTap={{ scale: 1.05 }}
            className="w-[450px] h-[300px] bg-cyan-500 rounded-[20%] absolute translate-y-40 shadow-xl"
            style={{ zIndex: dragging === 3 ? 10 : 3 }}
          >
            {/* Oval */}
            <div className="w-[150px] h-[50px] bg-red-500 rounded-[70%] top-[-25px] left-1/2 -translate-x-1/2 absolute">
              <div className="w-[90px] h-[10px] bg-cyan-500 rounded-[30%] absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-0.5" />
            </div>

            <div className="p-10 text-black font-bold text-2xl">
              Course 3
              <div className="mt-3 font-medium text-base opacity-80">
                Finance • Relationship • Productivity
              </div>
            </div>
            {/* White Rectangle */}
            <div className="w-[350px] h-[90px] bg-white rounded-xl absolute bottom-9 left-1/2 -translate-x-1/2 shadow p-4 text-left">
              <div className="text-black font-bold">Next action</div>
              <div className="text-gray-600 text-sm">
                Start your assessment to unlock tips
              </div>
            </div>
          </motion.div>

          {/* เผื่อพื้นที่ให้ cards ไม่ทับ content อื่น */}
          <div className="h-[520px]" />
        </div>

        {/* Bottom-Right Pop-up */}
        {showPopup && (
          <div className="fixed bottom-6 right-6 bg-white text-black rounded-xl shadow-lg p-4 z-50 w-72">
            <div className="flex justify-between items-start gap-3">
              <div className="text-base font-semibold">
                Hi there, want to know what we do?
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="text-xl leading-none"
                aria-label="close"
              >
                &times;
              </button>
            </div>

            <button
              onClick={handleTeamGoalsClick}
              className="mt-3 w-full bg-black text-white font-bold py-2 px-4 rounded-full hover:bg-gray-800 transition"
            >
              Team Goals
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
