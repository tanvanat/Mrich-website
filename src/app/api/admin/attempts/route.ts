// src/app/api/admin/attempts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, isNickAdmin } from "@/lib/auth";

export const runtime = "nodejs"; // ✅ prisma ชัวร์ ไม่หลุด edge

const FORM_ID = "mrich-assessment-v1";

export async function GET() {
  // ✅ auth จาก cookie nick
  const nick = await getNickFromCookie();
  if (!nick) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isNickAdmin(nick)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // ✅ responses (เหมือนของเดิม)
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

  // ✅ states -> stateMap (เหมือนของเดิม)
  const states = await prisma.examState.findMany({
    where: { formId: FORM_ID },
    select: {
      locked: true,
      startedAt: true,
      updatedAt: true,
      user: { select: { email: true, role: true } },
    },
  });

  const stateMap: Record<
    string,
    { role: "USER" | "ADMIN"; locked: boolean; startedAt: string | null; updatedAt: string }
  > = {};

  for (const s of states) {
    const email = (s.user?.email ?? "").toLowerCase();
    if (!email) continue;
    stateMap[email] = {
      role: s.user.role,
      locked: s.locked,
      startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : null,
      updatedAt: new Date(s.updatedAt).toISOString(),
    };
  }

  return NextResponse.json({ responses, stateMap });
}