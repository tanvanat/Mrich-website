import Link from "next/link";

export default function Firstpage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      {/* Background Flowers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large flower (RIGHT) — moved closer to center */}
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
        <div
          className="absolute bottom-20 -left-5 opacity-15 flower-will-change
          animate-[flowerFloat_8s_ease-in-out_infinite_1s]"
        >
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
        <div
          className="absolute top-1/3 left-45 opacity-10 flower-will-change
          animate-[flowerFloat_9s_ease-in-out_infinite_2s]"
        >
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
        <div
          className="absolute bottom-1/3 right-20 opacity-10 flower-will-change
          animate-[flowerFloat_7.5s_ease-in-out_infinite]"
        >
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

      {/* Main Content */}
      <div className="relative grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 sm:p-20">
        <main className="flex flex-col gap-10 row-start-2 items-center text-center">
          <div className="backdrop-blur-xl bg-white/5 border border-blue-400/20 p-7 sm:p-10 rounded-2xl text-white shadow-2xl max-w-[92vw] sm:max-w-lg">
            <div className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl leading-tight tracking-wide text-white drop-shadow-[0_0_30px_rgba(96,165,250,0.5)]">
              BECOME A<br />
              DIPLOMAT<br />
              LEADER<br />
              WITH MRICH
            </div>

            <div className="font-light text-base sm:text-lg text-blue-200 mt-6">
              Our app is for enthusiastic learners<br />
              who dream of becoming a better<br />
              version of themselves.
            </div>
          </div>

          <Link
            href="/page2"
            className="rounded-full px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/40"
          >
            Continue
          </Link>
        </main>
      </div>
    </div>
  );
}
