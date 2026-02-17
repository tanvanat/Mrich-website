import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const FORM_ID = "mrich-assessment-v1";
const EXAM_MINUTES = 30;

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  const email = (token?.email as string | undefined)?.toLowerCase();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // ✅ ตรวจ admin จาก DB (ชัวร์กว่า token.role)
  const me = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  if (!me) return NextResponse.json({ error: "user not found" }, { status: 404 });
  if (me.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

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

  const userIds = states.map((s) => s.user.id);

  // ดึง responses ล่าสุดต่อ user
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

  // map latest ต่อ userId
  const latestByUser: Record<string, (typeof latestResponses)[number]> = {};
  for (const r of latestResponses) {
    if (r.userId && !latestByUser[r.userId]) latestByUser[r.userId] = r;
  }

  const items = states.map((s) => {
    const latest = latestByUser[s.user.id] ?? null;

    const expiresAt = s.startedAt
      ? new Date(s.startedAt.getTime() + EXAM_MINUTES * 60 * 1000)
      : null;

    const expired = s.startedAt ? Date.now() > expiresAt!.getTime() : false;

    return {
      user: {
        id: s.user.id,
        email: s.user.email,
        name: s.user.name,
        role: s.user.role,
      },
      examState: {
        id: s.id,
        startedAt: s.startedAt ? s.startedAt.toISOString() : null,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        expired,
        locked: s.locked,
        updatedAt: s.updatedAt.toISOString(),
      },
      latestResponse: latest
        ? {
            ...latest,
            createdAt: latest.createdAt.toISOString(),
          }
        : null,
    };
  });

  return NextResponse.json({ items });
}
