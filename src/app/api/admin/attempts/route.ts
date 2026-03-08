// ดึงข้อมูลทั้ง Responses และ ExamStates มาแสดงในหน้า Admin Dashboard เดียวกัน
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, isNickAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// ✅ formId ใหม่ทั้งสอง course
const FORM_IDS = [
  "mrich-assessment-course1-v1",
  "mrich-assessment-course2-v1",
  "mrich-assessment-v1", // backward compat ของเก่า
];

// formId → course name (ตรงกับที่ UI ใช้ใน detectCourse / stateKey)
const FORM_TO_COURSE: Record<string, string> = {
  "mrich-assessment-course1-v1": "mindset-principles",
  "mrich-assessment-course2-v1": "proactive",
  "mrich-assessment-v1":         "mindset-principles", // legacy fallback
};

function normalizeNick(v: string) {
  return (v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// อ่าน role จาก env 3 ระดับ
function getRoleFromNick(nick: string): "ADMIN" | "LEADER" | "LEARNER" {
  const u = normalizeNick(nick);
  const parse = (key: string) =>
    (process.env[key] || "").split(",").map((s) => normalizeNick(s)).filter(Boolean);
  if (parse("ADMIN_NAMES").includes(u)) return "ADMIN";
  if (parse("LEADER_NAMES").includes(u)) return "LEADER";
  return "LEARNER";
}

export async function GET() {
  const nick = await getNickFromCookie();
  if (!nick) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isNickAdmin(nick)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // ── 1. Responses (ทุก formId ที่รองรับ) ──────────────────────────────────
  const rawResponses = await prisma.response.findMany({
    where: { formId: { in: FORM_IDS } },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      createdAt: true,
      totalScore: true,
      maxScore: true,
      percent: true,
      level: true,
      tip: true,
      name: true,
      formId: true,
      userId: true,
      answersJson: true,
      user: { select: { name: true, role: true } },
    },
  });

  // แปลง role เป็น 3 ระดับ และเพิ่ม course field
  const responses = rawResponses.map((r) => {
    const answersJson = r.answersJson as any;
    const course =
      answersJson?.course ??             // ถ้า submit ใหม่จะมี field นี้
      FORM_TO_COURSE[r.formId] ??        // fallback จาก formId
      "mindset-principles";

    const displayName = r.user?.name ?? r.name ?? "";
    const nickNorm = normalizeNick(displayName);
    const roleFromEnv = nickNorm ? getRoleFromNick(nickNorm) : "LEARNER";

    return {
      ...r,
      createdAt: r.createdAt.toISOString(),
      course,
      user: r.user ? { name: r.user.name, role: roleFromEnv } : null,
    };
  });

  // ── 2. ExamStates → stateMap  key = "nick:course" ────────────────────────
  // UI ทั้ง 2 client ใช้ key แบบนี้:
  //   const key = `${normalizeNick(displayName)}:${course}`
  const states = await prisma.examState.findMany({
    where: { formId: { in: FORM_IDS } },
    select: {
      locked: true,
      startedAt: true,
      updatedAt: true,
      formId: true,
      user: { select: { name: true, role: true } },
    },
  });

  const stateMap: Record<
    string,
    {
      role: "ADMIN" | "LEADER" | "LEARNER";
      locked: boolean;
      startedAt: string | null;
      updatedAt: string;
    }
  > = {};

  for (const s of states) {
    const name = normalizeNick(s.user?.name ?? "");
    if (!name) continue;

    const course = FORM_TO_COURSE[s.formId] ?? "mindset-principles";
    const key = `${name}:${course}`;        // ✅ ตรงกับ UI เป๊ะ

    const roleFromEnv = getRoleFromNick(name);

    stateMap[key] = {
      role: roleFromEnv,
      locked: s.locked,
      startedAt: s.startedAt ? s.startedAt.toISOString() : null,
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  return NextResponse.json({ responses, stateMap });
}