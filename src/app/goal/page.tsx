"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GoalPage() {
  const router = useRouter();
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    // countdown timer
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

  const handleBack = () => {
    router.push("/home");
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

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 -z-10" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl px-6">
        <div className="bg-black/60 backdrop-blur p-8 rounded-2xl shadow-xl">
          <h1 className="text-3xl sm:text-5xl font-bold mb-6">
            วัตถุประสงค์องค์กร
          </h1>

          <p className="text-lg sm:text-xl leading-relaxed">
            สร้างนิสัยที่ทำให้คนกลับมาดูแลใส่ใจสิ่งแวดล้อมมากกว่าผลประโยชน์ของตัวเอง

            สร้างสังคมที่ทำให้คนกลับมาให้ความรัก ความเมตตาปรารถนาดีแย่งกันเสียสละช่วยเหลือซึ่งกันและกัน
          
            ช่วยให้ผู้คนได้อิสรภาพทางการเงิน เพื่อให้ได้กลับมาทำสิ่งที่รักที่จะทำเพื่อผู้อื่นได้อย่างเต็มที่
          </p>

          <div className="mt-6 text-sm opacity-80">
            โปรดใช้เวลาทำความเข้าใจเป้าหมายนี้ก่อนดำเนินการต่อ
          </div>
        </div>

        {/* Countdown */}
        {!isButtonEnabled && (
          <div className="mt-6 text-sm opacity-80">
            สามารถย้อนกลับได้ในอีก {secondsLeft} วินาที
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={handleBack}
          disabled={!isButtonEnabled}
          className={`mt-8 w-48 rounded-full h-11 sm:h-12 px-6 font-semibold transition-all
            ${
              isButtonEnabled
                ? "bg-white text-black hover:bg-gray-200 cursor-pointer"
                : "bg-white/40 text-black/50 cursor-not-allowed"
            }
          `}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
