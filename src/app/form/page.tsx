// src/app/form/page.tsx
import dynamic from "next/dynamic";

const FormClient = dynamic(() => import("./FormClient"), { ssr: false });

export default function Page() {
  return <FormClient />;
}