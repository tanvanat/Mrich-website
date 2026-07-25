// src/app/api/user/score/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, getOrCreateUserByNick } from "@/lib/auth";

const COURSE_CONFIG = [
  {
    slug: "mindset-principles",
    formId: "mrich-course1",
    label: "Course 1",
  },
  {
    slug: "proactive",
    formId: "mrich-course2",
    label: "Course 2",
  },
  {
    slug: "habit_one_two",
    formId: "mrich-course3",
    label: "Course 3",
  },
];

export type CourseScore = {
  slug: string;
  label: string;
  formId: string;
  hasScore: boolean;
  totalScore?: number;
  maxScore?: number;
  percent?: number;
  updatedAt?: string;
};

export async function GET() {
  const nick = await getNickFromCookie();
  if (!nick)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUserByNick(nick);

  const scores: CourseScore[] = await Promise.all(
    COURSE_CONFIG.map(async ({ slug, formId, label }) => {
      const response = await prisma.response.findFirst({
        where: { userId: user.id, formId },
        orderBy: { createdAt: "desc" },
        select: {
          totalScore: true,
          maxScore: true,
          percent: true,
          updatedAt: true,
          answersJson: true, // ✅ เพิ่มบรรทัดนี้ — ต้องดึงมาเพื่อเช็คว่า admin ให้คะแนนหรือยัง
        },
      });

      // ✅ เปลี่ยนเงื่อนไข: เช็คจาก answersJson.scores (ที่ admin เป็นคนบันทึก)
      // แทนการเช็คจาก totalScore === 0 (ซึ่งเป็นคะแนน auto-score ตอน submit)
      const adminScores = (response?.answersJson as any)?.scores;
      const isGradedByAdmin = Array.isArray(adminScores) && adminScores.length > 0;

      if (!response || !isGradedByAdmin) {
        return { slug, label, formId, hasScore: false };
      }

      return {
        slug,
        label,
        formId,
        hasScore: true,
        totalScore: response.totalScore ?? undefined,
        maxScore: response.maxScore ?? undefined,
        percent:
          response.percent ??
          (response.totalScore != null && response.maxScore
            ? Math.round((response.totalScore / response.maxScore) * 100)
            : undefined),
        updatedAt: response.updatedAt.toISOString(),
      };
    })
  );

  return NextResponse.json({ scores });
}