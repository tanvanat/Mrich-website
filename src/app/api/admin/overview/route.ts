// src/app/api/admin/overview/route.ts
//
// GET /api/admin/overview
// รวมสถานะของ "ทุกคน" ที่เคย signed in ไว้ในที่เดียว สำหรับหน้า /admin/overview
// สถานะของแต่ละคนไล่ตาม funnel นี้ (คำนวณจาก ExamState/Response ที่มีอยู่แล้ว
// ไม่ต้องเพิ่ม field ใหม่ในฐานข้อมูล):
//
//   login            → มีบัญชี (เคย signed in) แต่ยังไม่เริ่มคอร์สไหนเลย
//   doing course N   → เปิดคอร์ส N ค้างอยู่ (startedAt แล้ว ยังไม่ล็อก ยังไม่หมดเวลา)
//   locked course N  → ส่งคำตอบคอร์ส N ไปแล้ว 1 ครั้ง (ตามกติกา 1 คน 1 ครั้งต่อคอร์ส)
//                      → ล็อกอยู่จนกว่า admin จะ unlock
//   expired course N → เวลาหมดแต่ยังไม่ได้ส่ง (ค้างอยู่ ยังไม่ locked ในฐานข้อมูล)
//
// ใช้ auth แบบเดียวกับ endpoint admin อื่น ๆ ในระบบ (cookie mrich_nick + isNickAdmin)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, isNickAdmin, normalizeNick } from "@/lib/auth";

export const runtime = "nodejs";

const EXAM_MINUTES = 40;

const FORM_IDS = ["mrich-course1", "mrich-course2", "mrich-course3"] as const;
type FormId = (typeof FORM_IDS)[number];

const FORM_TO_COURSE: Record<FormId, string> = {
  "mrich-course1": "mindset-principles",
  "mrich-course2": "proactive",
  "mrich-course3": "habit_one_two",
};

const COURSE_LABEL: Record<string, string> = {
  "mindset-principles": "Course 1",
  proactive: "Course 2",
  habit_one_two: "Course 3",
};

type CourseStatus = "locked" | "in_progress" | "expired" | "not_started";

type CourseCell = {
  formId: FormId;
  courseKey: string;
  label: string;
  status: CourseStatus;
  locked: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  latestPercent: number | null;
  latestLevel: string | null;
  latestSubmittedAt: string | null;
};

function computeStatus(
  locked: boolean,
  startedAt: Date | null,
  expiresAt: Date | null,
  now: number
): CourseStatus {
  if (locked) return "locked";
  if (!startedAt) return "not_started";
  const expiry = expiresAt ?? new Date(startedAt.getTime() + EXAM_MINUTES * 60 * 1000);
  if (now > expiry.getTime()) return "expired";
  return "in_progress";
}

export async function GET() {
  const nick = await getNickFromCookie();
  if (!nick) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isNickAdmin(nick)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const now = Date.now();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      examStates: {
        where: { formId: { in: FORM_IDS as unknown as string[] } },
        orderBy: { updatedAt: "desc" },
        select: {
          formId: true,
          locked: true,
          startedAt: true,
          expiresAt: true,
          updatedAt: true,
        },
      },
    },
  });

  const userIds = users.map((u) => u.id);

  const responses = await prisma.response.findMany({
    where: { formId: { in: FORM_IDS as unknown as string[] }, userId: { in: userIds } },
    orderBy: { createdAt: "desc" },
    select: {
      userId: true,
      formId: true,
      percent: true,
      level: true,
      createdAt: true,
    },
  });

  // ล่าสุดต่อ (userId, formId) — responses เรียง desc มาแล้ว ตัวแรกที่เจอคือ latest
  const latestResponseByKey = new Map<string, (typeof responses)[number]>();
  for (const r of responses) {
    if (!r.userId) continue;
    const key = `${r.userId}:${r.formId}`;
    if (!latestResponseByKey.has(key)) latestResponseByKey.set(key, r);
  }

  const items = users.map((u) => {
    // อาจมี duplicate ExamState row ต่อ formId เดิม (บั๊กเก่า) — เอาแถวที่ updatedAt ล่าสุดต่อ formId
    const stateByFormId = new Map<FormId, (typeof u.examStates)[number]>();
    for (const s of u.examStates) {
      const formId = s.formId as FormId;
      if (!stateByFormId.has(formId)) stateByFormId.set(formId, s);
    }

    let lastActivityAt: number | null = null;

    const courses: CourseCell[] = FORM_IDS.map((formId) => {
      const state = stateByFormId.get(formId) ?? null;
      const courseKey = FORM_TO_COURSE[formId];
      const latest = latestResponseByKey.get(`${u.id}:${formId}`) ?? null;

      if (state?.updatedAt) lastActivityAt = Math.max(lastActivityAt ?? 0, state.updatedAt.getTime());
      if (latest?.createdAt) lastActivityAt = Math.max(lastActivityAt ?? 0, latest.createdAt.getTime());

      return {
        formId,
        courseKey,
        label: COURSE_LABEL[courseKey],
        status: computeStatus(
          state?.locked ?? false,
          state?.startedAt ?? null,
          state?.expiresAt ?? null,
          now
        ),
        locked: state?.locked ?? false,
        startedAt: state?.startedAt ? state.startedAt.toISOString() : null,
        expiresAt: state?.expiresAt ? state.expiresAt.toISOString() : null,
        latestPercent: latest?.percent ?? null,
        latestLevel: latest?.level ?? null,
        latestSubmittedAt: latest?.createdAt ? latest.createdAt.toISOString() : null,
      };
    });

    // ── สรุปสถานะล่าสุดของ user ทั้งคน ตาม funnel: doing > locked > expired > login ──
    const doing = courses.filter((c) => c.status === "in_progress");
    const locked = courses.filter((c) => c.status === "locked");
    const expired = courses.filter((c) => c.status === "expired");

    let latestStatus: { stage: "doing" | "locked" | "expired" | "login"; courses: string[] };
    if (doing.length > 0) {
      latestStatus = { stage: "doing", courses: doing.map((c) => c.label) };
    } else if (locked.length > 0) {
      latestStatus = { stage: "locked", courses: locked.map((c) => c.label) };
    } else if (expired.length > 0) {
      latestStatus = { stage: "expired", courses: expired.map((c) => c.label) };
    } else {
      latestStatus = { stage: "login", courses: [] };
    }

    return {
      id: u.id,
      nick: normalizeNick(u.name ?? u.email ?? ""),
      displayName: u.name ?? u.email ?? "—",
      role: u.role,
      latestStatus,
      lastActivityAt: lastActivityAt ? new Date(lastActivityAt).toISOString() : null,
      courses,
    };
  });

  // คนที่มีกิจกรรมล่าสุดขึ้นก่อน คนที่ยังไม่เริ่มอะไรเลยไปท้ายสุด
  items.sort((a, b) => {
    const at = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : -1;
    const bt = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : -1;
    return bt - at;
  });

  return NextResponse.json({ items });
}
