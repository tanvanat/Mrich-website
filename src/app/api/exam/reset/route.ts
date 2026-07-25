//ให้ admin รีเซ็ตเวลาใหม่
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, isNickAdmin, getOrCreateUserByNick } from "@/lib/auth";

export const runtime = "nodejs";

const EXAM_MINUTES = 40;

// ⚠️ Synced to the formIds used in /api/exam/state and /api/exam/submit.
// This was previously out of sync (still using the old
// "mrich-assessment-courseN-v1" strings and missing course3 entirely),
// which meant this endpoint updated a different ExamState row than the
// one /api/exam/state actually reads — so resets silently did nothing.
function getFormIdFromCourse(course?: string | null) {
  if (course === "proactive") return "mrich-course2";
  if (course === "habit_one_two") return "mrich-course3";
  return "mrich-course1";
}

export async function POST(req: Request) {
  const nick = await getNickFromCookie();
  if (!nick) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isNickAdmin(nick)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const course = body?.course ?? "mindset-principles";
  const formId = getFormIdFromCourse(course);

  const user = await getOrCreateUserByNick(nick);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXAM_MINUTES * 60 * 1000);

  // ✅ orderBy updatedAt desc — same duplicate-row safeguard as
  // /api/exam/state, so we always touch the row the exam page actually reads.
  const existing = await prisma.examState.findFirst({
    where: { formId, userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (existing?.id) {
    await prisma.examState.update({
      where: { id: existing.id },
      data: {
        locked: false,
        startedAt: now,
        expiresAt,
        attemptToken: crypto.randomUUID(),
      },
    });
  } else {
    await prisma.examState.create({
      data: {
        formId,
        userId: user.id,
        locked: false,
        startedAt: now,
        expiresAt,
        attemptToken: crypto.randomUUID(),
      },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      course,
      formId,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}