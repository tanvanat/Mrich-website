// src/app/api/admin/unlock/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getNickFromCookie,
  isNickAdmin,
  getOrCreateUserByNick,
} from "@/lib/auth";

// ✅ รองรับทุก course
const COURSE_FORM_MAP: Record<string, string> = {
  "mindset-principles": "mrich-assessment-course1-v1",
  proactive: "mrich-assessment-course2-v1",
  default: "mrich-assessment-v1",
};

function getAllFormIds() {
  return Object.values(COURSE_FORM_MAP);
}

function newAttemptToken() {
  return crypto.randomUUID();
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

  // ระบุ course → unlock เฉพาะ formId นั้น / ไม่ระบุ → unlock ทุก course
  const formIds =
    course && COURSE_FORM_MAP[course]
      ? [COURSE_FORM_MAP[course]]
      : getAllFormIds();

  // ✅ เพิ่มตรงนี้
  // ลบคำตอบเก่า เพื่อให้ทำใหม่ได้
  await prisma.response.deleteMany({
    where: {
      userId: user.id,
      formId: {
        in: formIds,
      },
    },
  });
  await Promise.all(
    formIds.map((formId) =>
      prisma.examState.upsert({
        where: { userId_formId: { userId: user.id, formId } },
        create: {
          userId: user.id,
          formId,
          attemptToken: newAttemptToken(),
          startedAt: null,
          locked: false,
        },
        update: {
          attemptToken: newAttemptToken(),
          startedAt: null,
          locked: false,
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true, nickname, unlockedFormIds: formIds });
}
