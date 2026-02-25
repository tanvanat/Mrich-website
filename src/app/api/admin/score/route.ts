// src/app/api/admin/score/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, isNickAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  // ✅ cookie-based admin check
  const adminNick = await getNickFromCookie(); // <-- ต้อง await
  if (!adminNick) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isNickAdmin(adminNick)) {
    return NextResponse.json({ error: "ต้องเป็น ADMIN เท่านั้น" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  const responseId = String(body?.responseId ?? "").trim();
  const scores: number[] = Array.isArray(body?.scores) ? body.scores : [];
  const total = Number(body?.total);
  const maxTotal = Number(body?.maxTotal);

  if (!responseId) {
    return NextResponse.json({ error: "missing responseId" }, { status: 400 });
  }
  if (!Array.isArray(scores) || scores.some((x) => typeof x !== "number" || Number.isNaN(x))) {
    return NextResponse.json({ error: "scores must be number[]" }, { status: 400 });
  }
  if (Number.isNaN(total) || Number.isNaN(maxTotal)) {
    return NextResponse.json({ error: "missing total/maxTotal" }, { status: 400 });
  }

  const percent = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

  // ✅ merge answersJson เดิมก่อน แล้วค่อยใส่ scores
  const prev = await prisma.response.findUnique({
    where: { id: responseId },
    select: { answersJson: true },
  });

  const prevJson =
    prev?.answersJson && typeof prev.answersJson === "object"
      ? (prev.answersJson as any)
      : {};

  const updated = await prisma.response.update({
    where: { id: responseId },
    data: {
      totalScore: total,
      maxScore: maxTotal,
      percent,
      answersJson: {
        ...prevJson,
        scores,
        _gradedBy: adminNick,
        _gradedAt: new Date().toISOString(),
      } as any,
    },
    select: { id: true, totalScore: true, maxScore: true, percent: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, updated });
}