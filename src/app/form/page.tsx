import { Suspense } from "react";
import FormClient from "./FormClient";

function FormFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-blue-100">
      Loading form...
    </div>
  );
}

export default function FormPage() {
  return (
    <Suspense fallback={<FormFallback />}>
      <FormClient />
    </Suspense>
  );
}