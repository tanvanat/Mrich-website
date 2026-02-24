// app/api/exam/submit/route.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { questions, maxTotal, scoreAnswer, levelFromPercent } from "@/lib/questions";
import crypto from "crypto";

const FORM_ID = "mrich-assessment-v1";
const EXAM_MINUTES = 30;

export async function POST(req: Request) {
  console.time("submit-total-time");

  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const email = (token.email as string).toLowerCase();
    const role = ((token as any).role ?? "USER") as "ADMIN" | "USER";

    const body = await req.json().catch(() => ({}));
    
    // กำหนด type ชัดเจนเพื่อแก้ implicit any
    const answers: string[] = Array.isArray(body?.answers) ? body.answers : [];
    if (answers.length !== questions.length) {
      return NextResponse.json({ error: "answers length mismatch" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const state = await prisma.examState.findUnique({
      where: { userId_formId: { userId: user.id, formId: FORM_ID } },
    });
    if (!state) {
      return NextResponse.json({ error: "state not found" }, { status: 404 });
    }

    // USER ส่งแล้ว = ห้ามซ้ำ
    if (role === "USER" && state.locked) {
      return NextResponse.json({ error: "locked: already submitted" }, { status: 409 });
    }

    if (!state.startedAt) {
      return NextResponse.json({ error: "not started" }, { status: 400 });
    }

    const expiresAt = new Date(state.startedAt.getTime() + EXAM_MINUTES * 60 * 1000);
    const now = Date.now();
    const expired = now > expiresAt.getTime();

    // ถ้าหมดเวลา (USER) → ยังอนุญาตส่ง แต่ lock หลังส่ง
    if (expired && role === "USER") {
      console.log(`Expired submission for user ${email}`);
    }

    // Scoring
    let total = 0;
    for (let i = 0; i < questions.length; i++) {
      total += scoreAnswer(questions[i], String(answers[i] ?? ""));
    }
    const percent = Math.round((total / maxTotal) * 100);
    const lvl = levelFromPercent(percent);

    // บันทึก response (ใช้ answersJson แทน model answer)
    const attemptToken = state.attemptToken ?? crypto.randomUUID();

    const resp = await prisma.response.create({
      data: {
        formId: FORM_ID,
        name: user.name ?? user.email ?? email,
        totalScore: total,
        maxScore: maxTotal,
        percent,
        level: lvl.level,
        tip: lvl.tip,
        userId: user.id,
        answersJson: {
          _meta: {
            attemptToken,
            startedAt: state.startedAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            submittedAt: new Date(now).toISOString(),
            expired,
          },
          answers, // array<string>
        } as any, // Prisma รับ JsonValue ได้ แต่ TS อาจบ่น → any ปลอดภัย
      },
    });

    // Lock สำหรับ USER
    if (role === "USER") {
      await prisma.examState.update({
        where: { id: state.id },
        data: {
          locked: true,
          // ถ้า schema มี field lockedAt สามารถเพิ่มได้
          // lockedAt: new Date(now),
        },
      });
    } else {
      // ADMIN reset สำหรับรอบใหม่
      await prisma.examState.update({
        where: { id: state.id },
        data: {
          locked: false,
          startedAt: null,
          attemptToken: crypto.randomUUID(),
        },
      });
    }

    console.timeEnd("submit-total-time");

    return NextResponse.json({
      id: resp.id,
      name: resp.name ?? "",
      totalScore: resp.totalScore,
      maxScore: resp.maxScore,
      percent,
      level: resp.level,
      tip: resp.tip,
      expired,
      message: expired 
        ? "หมดเวลาแล้ว แต่ระบบบันทึกคำตอบที่คุณตอบไว้เรียบร้อย" 
        : "ส่งสำเร็จ",
    });
  } catch (error: any) {
    console.error("Submit error:", error);
    console.timeEnd("submit-total-time");

    return NextResponse.json(
      { error: error.message || "internal server error" },
      { status: error.status || 500 }
    );
  }
}