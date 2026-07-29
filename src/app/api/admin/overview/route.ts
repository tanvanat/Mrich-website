// src/app/api/admin/overview/route.ts
//
// GET /api/admin/overview
// รวมสถานะของ "ทุกคน" ในระบบไว้ในที่เดียว สำหรับหน้า /admin/overview:
//   - signed in / online ตอนนี้ไหม (จาก User.lastSeenAt)
//   - กำลังเปิด/ทำ course ไหนอยู่ตอนนี้ (จาก ExamState.startedAt / expiresAt / locked)
//   - ล็อกอยู่ไหมในแต่ละ course (1 / 2 / 3)
//
// ใช้ auth แบบเดียวกับ endpoint admin อื่น ๆ ในระบบ (cookie mrich_nick + isNickAdmin)
// ไม่ใช้ next-auth JWT (getToken) เพราะหน้า /admin ทั้งหมดถูกป้องกันด้วย middleware.ts
// ผ่าน cookie นี้เท่านั้น — ระบบไม่เคยสร้าง next-auth session คู่ขนานให้ user กลุ่มนี้
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, isNickAdmin, normalizeNick } from "@/lib/auth";

export const runtime = "nodejs";

const EXAM_MINUTES = 40;
const ONLINE_WINDOW_MS = 2 * 60 * 1000; // ถือว่า "online ตอนนี้" ถ้า lastSeenAt ไม่เกิน 2 นาทีที่แล้ว

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
    orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastSeenAt: true,
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

    const courses: CourseCell[] = FORM_IDS.map((formId) => {
      const state = stateByFormId.get(formId) ?? null;
      const courseKey = FORM_TO_COURSE[formId];
      const latest = latestResponseByKey.get(`${u.id}:${formId}`) ?? null;

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

    const lastSeenAt = u.lastSeenAt ? u.lastSeenAt.toISOString() : null;
    const online = !!u.lastSeenAt && now - u.lastSeenAt.getTime() <= ONLINE_WINDOW_MS;
    const doingNow = courses.find((c) => c.status === "in_progress")?.label ?? null;

    return {
      id: u.id,
      nick: normalizeNick(u.name ?? u.email ?? ""),
      displayName: u.name ?? u.email ?? "—",
      role: u.role,
      lastSeenAt,
      online,
      doingNow, // course ที่กำลังเปิดทำอยู่ตอนนี้ (ถ้ามี), null ถ้าไม่มี
      courses,
    };
  });

  return NextResponse.json({ items, onlineWindowMs: ONLINE_WINDOW_MS });
}
