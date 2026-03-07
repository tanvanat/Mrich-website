//ให้ admin รีเซ็ตเวลาใหม่
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, isNickAdmin, getOrCreateUserByNick } from "@/lib/auth";

export const runtime = "nodejs";

function getFormIdFromCourse(course?: string | null) {
  if (course === "proactive") return "mrich-assessment-course2-v1";
  return "mrich-assessment-course1-v1";
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

  const existing = await prisma.examState.findFirst({
    where: { formId, userId: user.id },
    select: { id: true },
  });

  if (existing?.id) {
    await prisma.examState.update({
      where: { id: existing.id },
      data: {
        locked: false,
        startedAt: now,
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
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}