// src/app/admin/exam/page.tsx
import Link from "next/link";
import AdminExamClient from "./AdminExamClient";
import AdminExamCourse2Client from "./AdminExamCourse2Client";

type PageProps = {
  searchParams?: Promise<{
    course?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const course = params?.course ?? "mindset-principles";

  const isCourse2 = course === "proactive";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/exam"
            className={`rounded-full px-4 py-2 text-sm font-bold border transition ${
              !isCourse2
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-white/5 text-blue-100 border-blue-300/20 hover:bg-white/10"
            }`}
          >
            Course 1
          </Link>

          <Link
            href="/admin/exam?course=proactive"
            className={`rounded-full px-4 py-2 text-sm font-bold border transition ${
              isCourse2
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-white/5 text-blue-100 border-blue-300/20 hover:bg-white/10"
            }`}
          >
            Course 2
          </Link>
        </div>
      </div>

      {isCourse2 ? <AdminExamCourse2Client /> : <AdminExamClient />}
    </div>
  );
}