"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function GoalPage() {
  const router = useRouter();
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsButtonEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleBack = () => router.push("/home");

  const goals = [
    {
      title: "Environment First",
      body: "สร้างนิสัยที่ทำให้คนกลับมาดูแลใส่ใจสิ่งแวดล้อมมากกว่าผลประโยชน์ของตัวเอง",
    },
    {
      title: "Compassion Society",
      body: "สร้างสังคมที่ทำให้คนกลับมาให้ความรัก ความเมตตาปรารถนาดี แย่งกันเสียสละช่วยเหลือซึ่งกันและกัน",
    },
    {
      title: "Financial Freedom",
      body: "ช่วยให้ผู้คนได้อิสรภาพทางการเงิน เพื่อให้ได้กลับมาทำสิ่งที่รักที่จะทำเพื่อผู้อื่นได้อย่างเต็มที่",
    },
  ];

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.55, delayChildren: 0.2 },
    },
  };

  const item = {
    hidden: { x: -90, opacity: 0, filter: "blur(6px)" },
    show: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }, // ✅ TS-safe easing
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      {/* Background Flowers (same as Firstpage) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large flower (RIGHT) */}
        <div
          className="absolute -top-10 right-24 opacity-20 flower-will-change
          animate-[flowerFloat_4s_ease-in-out_infinite]"
        >
          <svg
            width="300"
            height="300"
            viewBox="0 0 100 100"
            className="animate-[flowerGlow_3s_ease-in-out_infinite]"
          >
            <g transform="translate(50,50)">
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <ellipse key={i} rx="20" ry="35" fill="#3b82f6" transform={`rotate(${deg})`} />
              ))}
              <circle r="12" fill="#1e3a8a" />
              <circle r="7" fill="#93c5fd" />
            </g>
          </svg>
        </div>

        {/* Medium flower bottom-left */}
        <div
          className="absolute bottom-20 -left-5 opacity-15 flower-will-change
          animate-[flowerFloat_8s_ease-in-out_infinite_1s]"
        >
          <svg width="250" height="250" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 72, 144, 216, 288].map((deg, i) => (
                <ellipse key={i} rx="18" ry="30" fill="#60a5fa" transform={`rotate(${deg})`} />
              ))}
              <circle r="10" fill="#1e40af" />
              <circle r="6" fill="#bfdbfe" />
            </g>
          </svg>
        </div>

        {/* Small flower top-left */}
        <div
          className="absolute top-1/3 left-45 opacity-10 flower-will-change
          animate-[flowerFloat_9s_ease-in-out_infinite_2s]"
        >
          <svg width="120" height="120" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 90, 180, 270].map((deg, i) => (
                <ellipse key={i} rx="15" ry="25" fill="#7dd3fc" transform={`rotate(${deg})`} />
              ))}
              <circle r="8" fill="#0e7490" />
            </g>
          </svg>
        </div>

        {/* Small flower bottom-right */}
        <div
          className="absolute bottom-1/3 right-20 opacity-10 flower-will-change
          animate-[flowerFloat_7.5s_ease-in-out_infinite]"
        >
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

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/25" />

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-3xl">
          <div className="rounded-2xl border border-blue-400/20 bg-white/5 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
            <div className="text-center">
              <h1 className="text-3xl sm:text-5xl font-bold font-serif text-white drop-shadow-[0_0_30px_rgba(96,165,250,0.5)]">
                วัตถุประสงค์องค์กร
              </h1>
              <p className="mt-3 text-blue-200/75 text-sm sm:text-base">
                โปรดอ่านให้ครบทุกข้อ — เพื่อเข้าใจ “ทิศทาง” ของ Mrich อย่างชัดเจน
              </p>
              <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="mt-8 space-y-5"
            >
              {goals.map((g, idx) => (
                <motion.div
                  key={idx}
                  variants={item}
                  className="group rounded-2xl border border-blue-300/20 bg-white/6 backdrop-blur-xl p-6 sm:p-7 shadow-xl hover:bg-white/10 transition-all duration-300"
                >
                  <div className="h-1 w-14 rounded-full bg-blue-400/80 shadow-[0_0_18px_rgba(96,165,250,0.45)]" />

                  <div className="mt-4 flex items-start gap-4">
                    <div className="mt-1 h-3.5 w-3.5 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(147,197,253,0.7)]" />
                    <div className="text-left">
                      <div className="text-sm uppercase tracking-wider text-blue-200/70">
                        {g.title}
                      </div>
                      <div className="mt-1 text-base sm:text-lg leading-relaxed text-blue-50/95">
                        {g.body}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-8 flex flex-col items-center gap-3">
              {!isButtonEnabled ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-black/25 px-4 py-2 text-sm text-blue-100/90">
                  <span className="opacity-80">สามารถย้อนกลับได้ในอีก</span>
                  <span className="font-bold text-white">{secondsLeft}</span>
                  <span className="opacity-80">วินาที</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
                  ✅ พร้อมย้อนกลับได้แล้ว
                </div>
              )}

              <button
                onClick={handleBack}
                disabled={!isButtonEnabled}
                className={`w-full sm:w-60 h-11 sm:h-12 rounded-full font-semibold transition-all duration-300
                  ${
                    isButtonEnabled
                      ? "bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/30 hover:scale-[1.03]"
                      : "bg-white/10 text-blue-200/40 border border-blue-300/20 cursor-not-allowed"
                  }
                `}
              >
                Back to Home
              </button>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-blue-200/50">
            Mrich Academy • Leadership • Meaning • Service
          </div>
        </div>
      </div>
    </div>
  );
}
