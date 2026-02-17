import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const FORM_ID = "mrich-assessment-v1";

function newAttemptToken() {
  return crypto.randomUUID();
}

export async function POST(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if ((token as any).role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "missing email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true } });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  // ปลดล็อค: reset รอบใหม่ -> startedAt=null (จะเริ่มใหม่เมื่อ user เข้า /api/exam/state อีกครั้ง)
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

  return NextResponse.json({ ok: true, email });
}
