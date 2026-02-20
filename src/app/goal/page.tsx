"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function formatMMSS(totalSec: number) {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

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

  const goals = useMemo(
    () => [
      {
        title: "เป้าหมายที่ 1",
        text: "สร้างนิสัยที่ทำให้คนกลับมาดูแลใส่ใจสิ่งแวดล้อมมากกว่าผลประโยชน์ของตัวเอง",
      },
      {
        title: "เป้าหมายที่ 2",
        text: "สร้างสังคมที่ทำให้คนกลับมาให้ความรัก ความเมตตาปรารถนาดี แย่งกันเสียสละช่วยเหลือซึ่งกันและกัน",
      },
      {
        title: "เป้าหมายที่ 3",
        text: "ช่วยให้ผู้คนได้อิสรภาพทางการเงิน เพื่อให้ได้กลับมาทำสิ่งที่รัก ที่จะทำเพื่อผู้อื่นได้อย่างเต็มที่",
      },
    ],
    []
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-blue-100">
      {/* keyframes for flower background */}
      <style jsx global>{`
        @keyframes flowerFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-18px) rotate(4deg);
          }
        }
        @keyframes flowerGlow {
          0%,
          100% {
            filter: drop-shadow(0 0 8px rgba(96, 165, 250, 0.35));
          }
          50% {
            filter: drop-shadow(0 0 18px rgba(96, 165, 250, 0.75));
          }
        }
      `}</style>

      {/* Background Flowers (same theme as Firstpage) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large flower (RIGHT) */}
        <div className="absolute -top-10 right-24 opacity-20 animate-[flowerFloat_4s_ease-in-out_infinite]">
          <svg
            width="300"
            height="300"
            viewBox="0 0 100 100"
            className="animate-[flowerGlow_3s_ease-in-out_infinite]"
          >
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

        {/* Medium flower bottom-left */}
        <div className="absolute bottom-20 -left-5 opacity-15 animate-[flowerFloat_8s_ease-in-out_infinite_1s]">
          <svg width="250" height="250" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[0, 72, 144, 216, 288].map((deg, i) => (
                <ellipse
                  key={i}
                  rx="18"
                  ry="30"
                  fill="#60a5fa"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle r="10" fill="#1e40af" />
              <circle r="6" fill="#bfdbfe" />
            </g>
          </svg>
        </div>

        {/* Small flower top-left */}
        <div className="absolute top-1/3 left-40 opacity-10 animate-[flowerFloat_9s_ease-in-out_infinite_2s]">
          <svg width="120" height="120" viewBox="0 0 100 100">
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

        {/* Small flower bottom-right */}
        <div className="absolute bottom-1/3 right-20 opacity-10 animate-[flowerFloat_7.5s_ease-in-out_infinite]">
          <svg width="110" height="110" viewBox="0 0 100 100">
            <g transform="translate(50,50)">
              {[30, 90, 150, 210, 270, 330].map((deg, i) => (
                <ellipse
                  key={i}
                  rx="12"
                  ry="22"
                  fill="#a5f3fc"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle r="6" fill="#0e7490" />
            </g>
          </svg>
        </div>
      </div>

      {/* Soft overlay */}
      <div className="absolute inset-0 bg-black/25" />

      {/* Content */}
      <main className="relative mx-auto w-full max-w-3xl px-5 sm:px-6 py-10">
        <div className="rounded-2xl border border-blue-300/20 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif font-extrabold text-2xl sm:text-4xl text-white drop-shadow-[0_0_30px_rgba(96,165,250,0.45)]">
                วัตถุประสงค์องค์กร
              </h1>
              <p className="mt-2 text-blue-200/80 text-sm sm:text-base">
                โปรดใช้เวลาทำความเข้าใจเป้าหมายนี้ก่อนดำเนินการต่อ
              </p>
            </div>

            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold border"
              style={{
                background: secondsLeft === 0 ? "rgba(34,197,94,0.18)" : "rgba(59,130,246,0.18)",
                borderColor: secondsLeft === 0 ? "rgba(34,197,94,0.35)" : "rgba(59,130,246,0.35)",
              }}
            >
              ⏳ {formatMMSS(secondsLeft)}
            </span>
          </div>

          {/* Animated cards */}
          <div className="mt-6 space-y-4">
            {goals.map((g, idx) => (
              <motion.div
                key={g.title}
                initial={{ x: -28, opacity: 0, filter: "blur(6px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 0.55,
                  // ✅ use cubic-bezier array (tuple) — type-safe
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.12 + idx * 0.18,
                }}
                className="group rounded-2xl border border-blue-300/20 bg-white/6 backdrop-blur-xl p-6 sm:p-7 shadow-xl hover:bg-white/10 transition-all duration-300"
              >
                <div className="h-1 w-14 rounded-full bg-blue-400/80 shadow-[0_0_18px_rgba(96,165,250,0.45)]" />
                <div className="mt-3 text-white font-extrabold">
                  {g.title}
                </div>
                <div className="mt-2 text-blue-100/90 leading-relaxed">
                  {g.text}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Hint + Back */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {!isButtonEnabled ? (
              <div className="text-blue-200/70 text-sm">
                สามารถย้อนกลับได้ในอีก <span className="font-extrabold text-blue-100">{secondsLeft}</span> วินาที
              </div>
            ) : (
              <div className="text-emerald-200/80 text-sm font-bold">
                พร้อมแล้ว ✅
              </div>
            )}

            <button
              onClick={handleBack}
              disabled={!isButtonEnabled}
              className={`rounded-full px-6 py-3 font-extrabold transition-all
                ${
                  isButtonEnabled
                    ? "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white/15 text-blue-200/50 cursor-not-allowed"
                }`}
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
