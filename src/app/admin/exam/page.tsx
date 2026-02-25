// src/app/admin/exam/page.tsx
import dynamic from "next/dynamic";

const AdminExamClient = dynamic(() => import("./AdminExamClient"), {
  ssr: false,
});

export default function Page() {
  return <AdminExamClient />;
}