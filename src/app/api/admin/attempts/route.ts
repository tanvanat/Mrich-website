import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const FORM_ID = "mrich-assessment-v1";

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if ((token as any).role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const responses = await prisma.response.findMany({
    where: { formId: FORM_ID },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      createdAt: true,
      totalScore: true,
      maxScore: true,
      percent: true,
      level: true,
      tip: true,
      user: { select: { email: true, role: true, name: true } },
      answersJson: true,
    },
  });

  const states = await prisma.examState.findMany({
    where: { formId: FORM_ID },
    select: {
      locked: true,
      startedAt: true,
      updatedAt: true,
      user: { select: { email: true, role: true } },
    },
  });

  const stateMap: Record<string, any> = {};
  for (const s of states) {
    const email = (s.user.email ?? "").toLowerCase();
    if (!email) continue;
    stateMap[email] = {
      role: s.user.role,
      locked: s.locked,
      startedAt: s.startedAt,
      updatedAt: s.updatedAt,
    };
  }

  return NextResponse.json({ responses, stateMap });
}
