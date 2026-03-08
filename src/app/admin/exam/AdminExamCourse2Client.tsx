"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { questions } from "@/lib/questions-course2";

type UserRole = "LEARNER" | "LEADER" | "ADMIN";

type Row = {
  id: string;
  createdAt: string;
  totalScore: number;
  maxScore: number;
  percent: number;
  level: string;
  tip: string;
  name?: string | null;
  course?: string | null;
  formId?: string | null;
  userId?: string | null;
  user: {
    name: string | null;
    role: UserRole;
  } | null;
  answersJson: any;
};

type AdminApi = {
  responses: Row[];
  stateMap: Record<
    string,
    {
      role: UserRole;
      locked: boolean;
      startedAt: string | null;
      updatedAt: string;
    }
  >;
};

type MeResp =
  | {
      authed: true;
      nick: string;
      role: "ADMIN" | "LEADER" | "LEARNER";
      permissions: {
        canAccessAdmin: boolean;
        canAccessLeaderExam: boolean;
        canAccessLearnerExam: boolean;
      };
    }
  | { authed: false };

const COURSE = "proactive";
const FORM_ID = "mrich-assessment-course2-v1";

const MAX_SCORES = [4, 6, 4, 4, 4, 4, 4, 4, 6, 4, 4, 4, 6, 4, 4, 4, 4, 4, 6, 6, 6, 4] as const;
const TOTAL_MAX = MAX_SCORES.reduce((sum, v) => sum + v, 0);

function fmt(dt: any) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function fetchJson<T = any>(url: string): Promise<{ res: Response; json: T | null }> {
  const res = await fetch(url, { cache: "no-store", credentials: "include" });
  let json: T | null = null;
  try {
    json = await res.json();
  } catch {}
  return { res, json };
}

function normalizeAnswers(answersJson: any): string[] {
  const raw = answersJson?.answers ?? [];
  return Array.isArray(raw) ? raw.map((a: any) => String(a ?? "").trim()) : [];
}

function normalizeNick(v: string) {
  return (v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function detectCourse(r: Row) {
  return r.course ?? r.answersJson?.course ?? null;
}

function detectFormId(r: Row) {
  return r.formId ?? r.answersJson?._meta?.formId ?? null;
}

function getDisplayName(r: Row) {
  return r.user?.name ?? r.name ?? "—";
}

function stateKeyFromRow(r: Row) {
  const name = normalizeNick(getDisplayName(r));
  const course = detectCourse(r) ?? COURSE;
  return `${name}:${course}`;
}

export default function AdminExamCourse2Client() {
  const [isAdmin, setIsAdmin] = useState(false);

  const [data, setData] = useState<AdminApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openRow, setOpenRow] = useState<Row | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : ({ authed: false } as MeResp)))
      .then((me: MeResp) =>
        setIsAdmin(
          (me as any)?.authed === true &&
            (me as any)?.role === "ADMIN" &&
            !!(me as any)?.permissions?.canAccessAdmin
        )
      )
      .catch(() => setIsAdmin(false));
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { res, json } = await fetchJson<AdminApi>("/api/admin/attempts");
      if (!res.ok) {
        const err = (json as any)?.error || "โหลดข้อมูลไม่ได้";
        alert(err);
        return;
      }
      if (json) setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!openRow) return;

    const existing = openRow.answersJson?.scores ?? [];
    const answers = normalizeAnswers(openRow.answersJson);

    const initial = answers.map((_, i) =>
      typeof existing[i] === "number" && !isNaN(existing[i]) ? existing[i] : 0
    );

    setScores(initial);
  }, [openRow]);

  const rows = useMemo(() => {
    const responses = (data?.responses ?? []).filter((r) => {
      const byCourse = detectCourse(r) === COURSE;
      const byFormId = detectFormId(r) === FORM_ID;
      return byCourse || byFormId;
    });

    const latestByUser = new Map<string, Row>();

    responses.forEach((r) => {
      const key = normalizeNick(getDisplayName(r));
      if (!key) return;

      const prev = latestByUser.get(key);

      if (!prev || new Date(r.createdAt).getTime() > new Date(prev.createdAt).getTime()) {
        latestByUser.set(key, r);
      }
    });

    let result = Array.from(latestByUser.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const q = query.trim().toLowerCase();

    if (q) {
      result = result.filter((r) =>
        getDisplayName(r).toLowerCase().includes(q)
      );
    }

    return result;
  }, [data, query]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-blue-100 pb-20">
      <div className="relative max-w-7xl mx-auto px-6 py-10">

        <div className="mb-4">
          <Link
            href="/home"
            className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 font-bold text-cyan-200 hover:bg-cyan-400/20 transition"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-blue-500/20 p-6 shadow-2xl mb-8">
          <div className="flex justify-between items-center flex-wrap gap-4">

            <h1 className="text-3xl font-bold">
              Admin — Exam Scoring (Course 2)
            </h1>

            <button
              onClick={load}
              disabled={loading}
              className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white"
            >
              รีเฟรช
            </button>

          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาด้วยชื่อ..."
            className="mt-4 w-full px-4 py-3 rounded-xl bg-black/40 border border-blue-500/30"
          />

        </div>

        <div className="rounded-2xl overflow-hidden border border-blue-500/20 bg-white/5">

          <table className="w-full text-sm">

            <thead className="bg-black/50">

              <tr>
                <th className="p-4 text-left">ชื่อ</th>
                <th className="p-4 text-left">ส่งเมื่อ</th>
                <th className="p-4 text-left">สถานะ</th>
                <th className="p-4 text-left">การจัดการ</th>
                <th className="p-4 text-left">คะแนนล่าสุด</th>
                <th className="p-4 text-left">Role</th>
              </tr>

            </thead>

            <tbody>

              {rows.map((r) => {

                const rowKey = stateKeyFromRow(r);

                const locked = data?.stateMap?.[rowKey]?.locked ?? false;

                const role =
                  data?.stateMap?.[rowKey]?.role ??
                  r.user?.role ??
                  "LEARNER";

                return (

                  <tr key={r.id} className="border-t border-blue-500/10">

                    <td className="p-4 font-medium">
                      {getDisplayName(r)}
                    </td>

                    <td className="p-4">
                      {fmt(r.createdAt)}
                    </td>

                    <td className="p-4">
                      {locked ? "LOCKED" : "OPEN"}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => setOpenRow(r)}
                        className="px-4 py-2 bg-blue-600 rounded-full text-white"
                      >
                        ดู & ให้คะแนน
                      </button>
                    </td>

                    <td className="p-4 font-semibold text-cyan-300">
                      {r.totalScore} / {r.maxScore}
                    </td>

                    <td className="p-4">
                      {role}
                    </td>

                  </tr>

                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-blue-300">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>
      </div>
    </div>
  );
}