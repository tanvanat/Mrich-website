// src/app/api/exam/reset/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, isNickAdmin, getOrCreateUserByNick } from "@/lib/auth";

export const runtime = "nodejs";

const FORM_ID = "mrich-assessment-v1";

export async function POST() {
  const nick = await getNickFromCookie();
  if (!nick) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isNickAdmin(nick)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const user = await getOrCreateUserByNick(nick);

  const now = new Date();

  // ✅ ไม่ใช้ upsert เพราะ schema ไม่มี unique composite
  const existing = await prisma.examState.findFirst({
    where: { formId: FORM_ID, userId: user.id },
    select: { id: true },
  });

  if (existing?.id) {
    await prisma.examState.update({
      where: { id: existing.id }, // ✅ ใช้ unique ที่มีจริง (ปกติ id จะ unique)
      data: {
        locked: false,
        startedAt: now,
      },
    });
  } else {
    await prisma.examState.create({
      data: {
        formId: FORM_ID,
        userId: user.id,
        locked: false,
        startedAt: now,
      },
    });
  }

  return NextResponse.json(
    { ok: true, startedAt: now.toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}