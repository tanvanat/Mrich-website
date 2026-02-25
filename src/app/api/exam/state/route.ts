import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, getOrCreateUserByNick, isNickAdmin } from "@/lib/auth";

const FORM_ID = "mrich-assessment-v1";
const EXAM_MINUTES = 30;

function newAttemptToken() {
  return crypto.randomUUID();
}

export async function GET() {
  const nick = await getNickFromCookie();
  if (!nick) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await getOrCreateUserByNick(nick);
  const role = isNickAdmin(nick) ? "ADMIN" : "USER";

  let state = await prisma.examState.findUnique({
    where: { userId_formId: { userId: user.id, formId: FORM_ID } },
  });

  // create ครั้งแรก
  if (!state) {
    state = await prisma.examState.create({
      data: {
        userId: user.id,
        formId: FORM_ID,
        attemptToken: newAttemptToken(),
        startedAt: role === "USER" ? new Date() : null, // user เริ่มจับเวลาเมื่อเข้า
        locked: false,
      },
    });
  } else {
    // USER: ถ้ายังไม่ startedAt (เช่นถูก admin ปลดแล้วตั้ง startedAt=null) → เริ่มใหม่
    if (role === "USER" && !state.locked && !state.startedAt) {
      state = await prisma.examState.update({
        where: { id: state.id },
        data: { startedAt: new Date(), attemptToken: newAttemptToken() },
      });
    }
  }

  const startedAt = state.startedAt;
  const expiresAt = startedAt
    ? new Date(startedAt.getTime() + EXAM_MINUTES * 60 * 1000)
    : null;

  const expired = startedAt ? Date.now() > expiresAt!.getTime() : false;

  return NextResponse.json({
    role,
    locked: state.locked,
    attemptToken: state.attemptToken,
    startedAt: startedAt?.toISOString() ?? null,
    expiresAt: expiresAt?.toISOString() ?? null,
    expired,
  });
}