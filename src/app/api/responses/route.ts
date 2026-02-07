import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { FORM_ID, questions, maxTotal, levelFromPercent } from "@/lib/questions";

const BodySchema = z.object({
  name: z.string().min(1).max(60),
  answers: z.array(z.number()).min(1),
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());

    if (body.answers.length !== questions.length) {
      return NextResponse.json(
        { error: `answers length must be ${questions.length}` },
        { status: 400 }
      );
    }

    // รวมคะแนน (รองรับ weight)
    let total = 0;
    for (let i = 0; i < questions.length; i++) {
      const w = questions[i].weight ?? 1;
      total += Number(body.answers[i]) * w;
    }

    const pct = Number(((total / maxTotal) * 100).toFixed(2));
    const { level, tip } = levelFromPercent(pct);

    const saved = await prisma.response.create({
      data: {
        formId: FORM_ID,
        name: body.name.trim(),
        answersJson: body.answers,
        totalScore: total,
        maxScore: maxTotal,
        percent: pct,
        level,
        tip,
      },
    });

    return NextResponse.json({
      id: saved.id,
      totalScore: saved.totalScore,
      maxScore: saved.maxScore,
      percent: saved.percent,
      level: saved.level,
      tip: saved.tip,
      createdAt: saved.createdAt,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 400 });
  }
}
