import Link from "next/link";

export default function Page2() {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-center items-center text-center text-white bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      {/* Background Flowers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large flower top-right */}
        <div className="absolute -top-10 right-24 opacity-20 flower-will-change animate-[flowerFloat_6s_ease-in-out_infinite]">
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

        {/* Medium flower bottom-left */}
        <div className="absolute bottom-20 -left-5 opacity-15 flower-will-change animate-[flowerFloat_7s_ease-in-out_infinite_1s]">
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

        {/* Small flower top-left */}
        <div className="absolute top-1/4 left-45 opacity-10 flower-will-change animate-[flowerFloat_8s_ease-in-out_infinite_2s]">
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
        <div className="absolute bottom-1/3 right-20 opacity-10 flower-will-change animate-[flowerFloat_6.5s_ease-in-out_infinite]">
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

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="backdrop-blur-xl bg-white/5 border border-blue-400/20 p-7 sm:p-10 rounded-2xl shadow-2xl max-w-[92vw] sm:max-w-xl">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 font-serif drop-shadow-[0_0_30px_rgba(96,165,250,0.5)]">
            Multi Rich Academy
          </h1>
          <p className="text-base sm:text-xl text-blue-200">
            สถาบัน "สร้างนิสัยผู้นำ" <br />
            ที่ทำให้คุณมีความสุขเเละความสำเร็จใน<br />
            ทุกด้านของชีวิต
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="relative z-10 mt-6 flex flex-col items-center gap-4">
        <Link
          href="/signin"
          className="w-52 rounded-full transition-all duration-300 bg-[#FFCC3E] text-black hover:bg-yellow-400 text-sm sm:text-base h-11 sm:h-12 px-6 sm:px-8 flex items-center justify-center shadow-lg shadow-yellow-500/20 hover:scale-105"
        >
          Sign In
        </Link>

        <div className="text-sm sm:text-base text-blue-200/70">----------- OR ------------</div>

        <Link
          href="/signup"
          className="w-52 rounded-full transition-all duration-300 border border-blue-200/70 bg-transparent text-white hover:bg-white hover:text-black text-sm sm:text-base h-11 sm:h-12 px-6 sm:px-8 flex items-center justify-center hover:scale-105"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
