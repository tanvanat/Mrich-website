// src/app/api/admin/unlock/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getNickFromCookie,
  isNickAdmin,
  getOrCreateUserByNick,
} from "@/lib/auth";

const COURSE_FORM_MAP: Record<string, string> = {
  "mindset-principles": "mrich-assessment-course1-v1",
  proactive: "mrich-assessment-course2-v1",
  default: "mrich-assessment-v1",
};

function getAllFormIds() {
  return Object.values(COURSE_FORM_MAP);
}

export async function POST(req: Request) {
  const adminNick = await getNickFromCookie();
  if (!adminNick)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isNickAdmin(adminNick))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const nickname = String(body?.nickname ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const course = String(body?.course ?? "").trim();

  if (!nickname) {
    return NextResponse.json({ error: "invalid nickname" }, { status: 400 });
  }

  const user = await getOrCreateUserByNick(nickname);

  const formIds =
    course && COURSE_FORM_MAP[course]
      ? [COURSE_FORM_MAP[course]]
      : getAllFormIds();

  // ✅ deleteMany ทุก duplicate แล้ว create ใหม่สะอาดทีละ formId
  await Promise.all(
    formIds.map(async (formId) => {
      await prisma.examState.deleteMany({
        where: { userId: user.id, formId },
      });
      await prisma.examState.create({
        data: {
          userId: user.id,
          formId,
          attemptToken: crypto.randomUUID(),
          startedAt: null,
          expiresAt: null,
          locked: false,
        },
      });
    }),
  );

  return NextResponse.json({ ok: true, nickname, unlockedFormIds: formIds });
}