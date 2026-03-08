// src/app/api/user/score/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, getOrCreateUserByNick } from "@/lib/auth";

// ✅ รองรับทุก course
const FORM_IDS = [
  "mrich-assessment-course1-v1",
  "mrich-assessment-course2-v1",
  "mrich-assessment-v1", // legacy
];

export async function GET() {
  const nick = await getNickFromCookie();
  if (!nick) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUserByNick(nick);

  // ดึง response ล่าสุดของ user จากทุก course
  const latestResponse = await prisma.response.findFirst({
    where: {
      userId: user.id,
      formId: { in: FORM_IDS },
    },
    orderBy: { createdAt: "desc" },
    select: {
      totalScore: true,
      maxScore: true,
      percent: true,
      formId: true,
      updatedAt: true,
    },
  });

  if (!latestResponse) {
    return NextResponse.json({ hasScore: false, message: "ยังไม่ได้รับการตรวจ" });
  }

  // ถ้า totalScore ยังเป็น 0 (ส่งแล้วแต่ยังไม่ได้ให้คะแนน)
  if (latestResponse.totalScore === 0) {
    return NextResponse.json({ hasScore: false, message: "ยังไม่ได้รับการตรวจ" });
  }

  const percent =
    latestResponse.percent ??
    Math.round((latestResponse.totalScore / latestResponse.maxScore) * 100);

  return NextResponse.json({
    hasScore: true,
    totalScore: latestResponse.totalScore,
    maxScore: latestResponse.maxScore,
    percent,
    updatedAt: latestResponse.updatedAt,
  });
}