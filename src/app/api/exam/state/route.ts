//จัดการ “สถานะข้อสอบ” ของแต่ละคน เช่น เริ่มสอบแล้วไหม หมดเวลายัง ล็อกหรือยัง
// src/app/api/exam/state/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, getOrCreateUserByNick, isNickAdmin } from "@/lib/auth";

const EXAM_MINUTES = 35;

function getFormIdFromCourse(course?: string | null) {
  if (course === "proactive") return "mrich-assessment-course2-v1";
  return "mrich-assessment-course1-v1";
}

export async function GET(req: NextRequest) {
  const nick = await getNickFromCookie();
  if (!nick) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const course = req.nextUrl.searchParams.get("course");
  const formId = getFormIdFromCourse(course);

  const user = await getOrCreateUserByNick(nick);
  const role = isNickAdmin(nick) ? "ADMIN" : "USER";

  // ✅ findFirst + orderBy updatedAt desc — กันพังเมื่อมี duplicate rows
  let state = await prisma.examState.findFirst({
    where: { userId: user.id, formId },
    orderBy: { updatedAt: "desc" },
  });

  if (!state) {
    // ยังไม่มี state เลย → create ใหม่
    state = await prisma.examState.create({
      data: {
        userId: user.id,
        formId,
        attemptToken: crypto.randomUUID(),
        startedAt: role === "USER" ? new Date() : null,
        expiresAt:
          role === "USER"
            ? new Date(Date.now() + EXAM_MINUTES * 60 * 1000)
            : null,
        locked: false,
      },
    });
  } else if (role === "USER" && !state.locked && !state.startedAt) {
    // มี state แต่ยังไม่ได้เริ่ม → set startedAt
    state = await prisma.examState.update({
      where: { id: state.id },
      data: {
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + EXAM_MINUTES * 60 * 1000),
        attemptToken: crypto.randomUUID(),
      },
    });
  }

  const startedAt = state.startedAt;
  const expiresAt = state.expiresAt
    ? state.expiresAt
    : startedAt
    ? new Date(startedAt.getTime() + EXAM_MINUTES * 60 * 1000)
    : null;

  const expired = expiresAt ? Date.now() > expiresAt.getTime() : false;

  return NextResponse.json({
    role,
    course: course ?? "mindset-principles",
    formId,
    locked: state.locked,
    attemptToken: state.attemptToken,
    startedAt: startedAt?.toISOString() ?? null,
    expiresAt: expiresAt?.toISOString() ?? null,
    expired,
  });
}