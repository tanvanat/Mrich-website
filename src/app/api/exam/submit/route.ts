import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questions, maxTotal, scoreAnswer, levelFromPercent } from "@/lib/questions";
import { getNickFromCookie, getOrCreateUserByNick, isNickAdmin } from "@/lib/auth";
import crypto from "crypto";

const FORM_ID = "mrich-assessment-v1";
const EXAM_MINUTES = 30;

export async function POST(req: Request) {
  console.time("submit-total-time");

  try {
    const nick = await getNickFromCookie();
    if (!nick) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const role = isNickAdmin(nick) ? "ADMIN" : "USER";
    const user = await getOrCreateUserByNick(nick);

    const body = await req.json().catch(() => ({}));
    const answers: string[] = Array.isArray(body?.answers) ? body.answers : [];

    if (answers.length !== questions.length) {
      return NextResponse.json({ error: "answers length mismatch" }, { status: 400 });
    }

    const state = await prisma.examState.findUnique({
      where: { userId_formId: { userId: user.id, formId: FORM_ID } },
    });
    if (!state) return NextResponse.json({ error: "state not found" }, { status: 404 });

    if (role === "USER" && state.locked) {
      return NextResponse.json({ error: "locked: already submitted" }, { status: 409 });
    }

    if (!state.startedAt) {
      return NextResponse.json({ error: "not started" }, { status: 400 });
    }

    const expiresAt = new Date(state.startedAt.getTime() + EXAM_MINUTES * 60 * 1000);
    const now = Date.now();
    const expired = now > expiresAt.getTime();

    // scoring
    let total = 0;
    for (let i = 0; i < questions.length; i++) {
      total += scoreAnswer(questions[i], String(answers[i] ?? ""));
    }
    const percent = Math.round((total / maxTotal) * 100);
    const lvl = levelFromPercent(percent);

    const attemptToken = state.attemptToken ?? crypto.randomUUID();

    const resp = await prisma.response.create({
      data: {
        formId: FORM_ID,
        name: nick,
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
          answers,
        } as any,
      },
    });

    if (role === "USER") {
      await prisma.examState.update({
        where: { id: state.id },
        data: { locked: true },
      });
    } else {
      // admin: เปิดรอบใหม่ให้ตัวเอง (optional)
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
      { status: 500 }
    );
  }
}