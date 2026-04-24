//จัดการ “สถานะข้อสอบ” ของแต่ละคน เช่น เริ่มสอบแล้วไหม หมดเวลายัง ล็อกหรือยัง
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, getOrCreateUserByNick, isNickAdmin } from "@/lib/auth";

const EXAM_MINUTES = 35;

function newAttemptToken() {
  return crypto.randomUUID();
}

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

  let state = await prisma.examState.findUnique({
    where: {
      userId_formId: {
        userId: user.id,
        formId,
      },
    },
  });

  if (!state) {
    state = await prisma.examState.create({
      data: {
        userId: user.id,
        formId,
        attemptToken: newAttemptToken(),
        startedAt: role === "USER" ? new Date() : null,
        locked: false,
      },
    });
  } else {
    if (role === "USER" && !state.locked && !state.startedAt) {
      state = await prisma.examState.update({
        where: { id: state.id },
        data: {
          startedAt: new Date(),
          attemptToken: newAttemptToken(),
        },
      });
    }
  }

  const startedAt = state.startedAt;
  const expiresAt = startedAt
    ? new Date(startedAt.getTime() + EXAM_MINUTES * 60 * 1000)
    : null;

  const expired = startedAt ? Date.now() > expiresAt!.getTime() : false;

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