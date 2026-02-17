import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ใช้ questions / scoring ของคุณ
import { questions, maxTotal, scoreAnswer, levelFromPercent } from "@/lib/questions";

const FORM_ID = "mrich-assessment-v1";
const EXAM_MINUTES = 30;

export async function POST(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const email = (token.email as string).toLowerCase();
  const role = ((token as any).role ?? "USER") as "ADMIN" | "USER";

  const body = await req.json().catch(() => ({}));
  const answers = Array.isArray(body?.answers) ? body.answers : [];
  if (answers.length !== questions.length) {
    return NextResponse.json({ error: "answers length mismatch" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const state = await prisma.examState.findUnique({
    where: { userId_formId: { userId: user.id, formId: FORM_ID } },
  });
  if (!state) return NextResponse.json({ error: "state not found" }, { status: 404 });

  // USER ส่งแล้ว = ห้ามซ้ำ
  if (role === "USER" && state.locked) {
    return NextResponse.json({ error: "locked: already submitted" }, { status: 409 });
  }

  if (!state.startedAt) return NextResponse.json({ error: "not started" }, { status: 400 });

  const expiresAt = new Date(state.startedAt.getTime() + EXAM_MINUTES * 60 * 1000);
  const expired = Date.now() > expiresAt.getTime();
  if (expired) {
    // USER: หมดเวลาแล้ว lock ทิ้ง
    if (role === "USER") {
      await prisma.examState.update({ where: { id: state.id }, data: { locked: true } });
    }
    return NextResponse.json({ error: "expired" }, { status: 408 });
  }

  // scoring
  let total = 0;
  for (let i = 0; i < questions.length; i++) {
    total += scoreAnswer(questions[i], String(answers[i] ?? ""));
  }
  const percent = Math.round((total / maxTotal) * 100);
  const lvl = levelFromPercent(percent);

  // save to Response (model เดิม)
  const resp = await prisma.response.create({
    data: {
      formId: FORM_ID,
      name: user.name ?? user.email ?? email,
      totalScore: total,
      maxScore: maxTotal,
      percent: percent, // schema เป็น Float อยู่แล้ว
      level: lvl.level,
      tip: lvl.tip,
      userId: user.id,
      answersJson: {
        _meta: {
          attemptToken: state.attemptToken,
          startedAt: state.startedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
        answers,
      },
    },
  });

  if (role === "USER") {
    // USER: ล็อกทันทีหลังส่ง
    await prisma.examState.update({
      where: { id: state.id },
      data: { locked: true },
    });
  } else {
    // ADMIN: ทำได้หลายรอบ -> reset state ให้รอบใหม่ (เวลา 30 นาทีจะเริ่มใหม่เมื่อเข้าหน้าอีกครั้ง)
    await prisma.examState.update({
      where: { id: state.id },
      data: {
        locked: false,
        startedAt: null,
        attemptToken: crypto.randomUUID(),
      },
    });
  }

  return NextResponse.json({
    id: resp.id,
    name: resp.name ?? "",
    totalScore: resp.totalScore,
    maxScore: resp.maxScore,
    percent,
    level: resp.level,
    tip: resp.tip,
  });
}
