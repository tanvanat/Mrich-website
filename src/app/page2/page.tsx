import Link from "next/link";

export default function Page2() {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-center items-center text-center text-white">
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        src="/background.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="relative z-10 p-6">
        <div className="bg-black/60 p-6 rounded-xl text-center text-white shadow-lg">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">Multi Rich Academy</h1>
          <p className="text-lg sm:text-xl">
            สถาบัน "สร้างนิสัยผู้นำ" <br />
            ที่ทำให้คุณมีความสุขเเละความสำเร็จใน<br />
            ทุกด้านของชีวิต
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-col items-center gap-4">
        <Link
          href="/signin"
          className="w-48 rounded-full transition-colors bg-[#FFCC3E] text-black hover:bg-yellow-500 text-sm sm:text-base h-10 sm:h-12 px-6 sm:px-8 flex items-center justify-center"
        >
          Sign In
        </Link>

        <div className="text-sm sm:text-base text-gray-300">-----------OR------------</div>

        <Link
          href="/signup"
          className="w-48 rounded-full transition-colors border border-solid border-white bg-transparent text-white hover:bg-white hover:text-black text-sm sm:text-base h-10 sm:h-12 px-6 sm:px-8 flex items-center justify-center"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
