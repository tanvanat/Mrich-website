// src/app/admin/overview/page.tsx
import Link from "next/link";
import AdminOverviewClient from "./AdminOverviewClient";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/overview"
            className="rounded-full px-4 py-2 text-sm font-bold border transition bg-blue-600 text-white border-blue-500"
          >
            Overview
          </Link>
          <Link
            href="/admin/exam"
            className="rounded-full px-4 py-2 text-sm font-bold border transition bg-white/5 text-blue-100 border-blue-300/20 hover:bg-white/10"
          >
            Scoring (per course)
          </Link>
        </div>
      </div>

      <AdminOverviewClient />
    </div>
  );
}
