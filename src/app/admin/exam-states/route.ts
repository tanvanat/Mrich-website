import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const FORM_ID = "mrich-assessment-v1";
const EXAM_MINUTES = 30;

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if ((token as any).role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // ดึงทุกคนที่มี ExamState (เคยเริ่ม/เคยถูกล็อก/เคยปลดล็อก)
  const states = await prisma.examState.findMany({
    where: { formId: FORM_ID },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      startedAt: true,
      locked: true,
      updatedAt: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  // เอา userId ไปหา latest Response ต่อ user
  const userIds = states.map((s) => s.user.id);
  const latestResponses = await prisma.response.findMany({
    where: { formId: FORM_ID, userId: { in: userIds } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      totalScore: true,
      maxScore: true,
      percent: true,
      level: true,
      tip: true,
      answersJson: true,
    },
  });

  // map ล่าสุดต่อ userId (เพราะเรียง desc อยู่แล้ว ตัวแรกคือ latest)
  const latestByUser: Record<string, (typeof latestResponses)[number]> = {};
  for (const r of latestResponses) {
    if (r.userId && !latestByUser[r.userId]) latestByUser[r.userId] = r;
  }

  // สร้าง record สำหรับ UI
  const enriched = states.map((s) => {
    const latest = latestByUser[s.user.id] ?? null;

    const expiresAt = s.startedAt
      ? new Date(s.startedAt.getTime() + EXAM_MINUTES * 60 * 1000)
      : null;

    const expired = s.startedAt ? Date.now() > expiresAt!.getTime() : false;

    return {
      user: s.user,
      examState: {
        id: s.id,
        startedAt: s.startedAt,
        expiresAt,
        expired,
        locked: s.locked,
        updatedAt: s.updatedAt,
      },
      latestResponse: latest,
    };
  });

  return NextResponse.json({ items: enriched });
}
