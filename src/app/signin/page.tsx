import { Suspense } from "react";
import SignInClient from "./SignInClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
          Loading...
        </div>
      }
    >
      <SignInClient />
    </Suspense>
  );
}