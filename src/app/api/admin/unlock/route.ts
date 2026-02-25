import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, isNickAdmin, getOrCreateUserByNick } from "@/lib/auth";

const FORM_ID = "mrich-assessment-v1";

function newAttemptToken() {
  return crypto.randomUUID();
}

export async function POST(req: Request) {
  const adminNick = await getNickFromCookie();
  if (!adminNick) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isNickAdmin(adminNick)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const nickname = String(body?.nickname ?? "").trim().toLowerCase();

  if (!nickname || !/^[a-z]+$/.test(nickname)) {
    return NextResponse.json({ error: "invalid nickname" }, { status: 400 });
  }

  const user = await getOrCreateUserByNick(nickname);

  await prisma.examState.upsert({
    where: { userId_formId: { userId: user.id, formId: FORM_ID } },
    create: {
      userId: user.id,
      formId: FORM_ID,
      attemptToken: newAttemptToken(),
      startedAt: null,
      locked: false,
    },
    update: {
      attemptToken: newAttemptToken(),
      startedAt: null,
      locked: false,
    },
  });

  return NextResponse.json({ ok: true, nickname });
}