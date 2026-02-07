import Link from "next/link";

export default function Firstpage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        src="/background.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="relative grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-7 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-10 row-start-2 items-center">
          <div className="bg-black/60 p-6 rounded-xl text-center text-white shadow-lg">
            <div className="font-bold text-4xl leading-snug">
              BECOME A<br />
              LEADER<br />
              RANKED 6TH<br />
              WITH MRICH
            </div>

            <div className="font-medium text-base mt-4 block">
              Our app is for enthusiastic<br />
              learners who dream of a better<br />
              version of yourself
            </div>
          </div>

          <div className="flex items-center flex-col sm:flex-row">
            <Link
              href="/page2"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-white text-black hover:bg-[#f2f2f2] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            >
              Continue
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
