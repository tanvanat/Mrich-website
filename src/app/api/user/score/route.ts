// src/app/api/user/score/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, getOrCreateUserByNick } from "@/lib/auth";

const COURSE_CONFIG = [
  {
    slug: "mindset-principles",
    formId: "mrich-assessment-course1-v1",
    label: "Course 1",
  },
  {
    slug: "proactive",
    formId: "mrich-assessment-course2-v1",
    label: "Course 2",
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

  // ดึง response ล่าสุดของแต่ละ course แยกกัน
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
        },
      });

      if (!response || response.totalScore === 0) {
        return { slug, label, formId, hasScore: false };
      }

      return {
        slug,
        label,
        formId,
        hasScore: true,
        totalScore: response.totalScore,
        maxScore: response.maxScore,
        percent:
          response.percent ??
          Math.round((response.totalScore / response.maxScore) * 100),
        updatedAt: response.updatedAt.toISOString(),
      };
    })
  );

  return NextResponse.json({ scores });
}