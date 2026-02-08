// src/app/api/responses/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { FORM_ID, questions, maxTotal, levelFromPercent } from "@/lib/questions";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; // ✅ เปลี่ยน path ถ้าไฟล์คุณอยู่ที่อื่น

// -----------------------------
// Rate limit (simple in-memory)
// -----------------------------
const rateMap = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000; // 1 นาที
const LIMIT = 10; // 10 requests ต่อ 1 นาที

function rateLimit(key: string) {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now - entry.ts > WINDOW_MS) {
    rateMap.set(key, { count: 1, ts: now });
    return { ok: true };
  }

  if (entry.count >= LIMIT) return { ok: false };

  entry.count += 1;
  rateMap.set(key, entry);
  return { ok: true };
}

const BodySchema = z.object({
  name: z.string().min(1).max(60),
  answers: z.array(z.number()).min(1),
});

export async function POST(req: Request) {
  try {
    // ✅ 1) ต้อง login ก่อน
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ 2) Rate limit ต่อ IP (และจะเช็คก่อน parse body ก็ได้)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const rl = rateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // ✅ 3) Validate body
    const body = BodySchema.parse(await req.json());

    if (body.answers.length !== questions.length) {
      return NextResponse.json(
        { error: `answers length must be ${questions.length}` },
        { status: 400 }
      );
    }

    // ✅ 4) รวมคะแนน
    let total = 0;
    for (let i = 0; i < questions.length; i++) {
      // ถ้า type Question ของคุณไม่มี weight ให้ลบ 2 บรรทัดนี้ออก
      // หรือแก้ type ให้มี weight?: number ใน lib/questions
      const w = (questions[i] as any).weight ?? 1;
      total += Number(body.answers[i]) * w;
    }

    const pct = Number(((total / maxTotal) * 100).toFixed(2));
    const { level, tip } = levelFromPercent(pct);

    // ✅ 5) Save
    const saved = await prisma.response.create({
      data: {
        formId: FORM_ID,
        name: body.name.trim(),
        // ถ้า schema ของคุณเป็น Json/JsonB ให้ใช้ array ได้เลย
        // ถ้ายังเป็น String ให้กลับไปใช้ JSON.stringify(body.answers)
        answersJson: body.answers as any,
        totalScore: total,
        maxScore: maxTotal,
        percent: pct,
        level,
        tip,
        // แนะนำ: เก็บผู้ใช้ไว้ด้วย (ถ้าคุณมีฟิลด์นี้ใน schema)
        // userEmail: session.user.email,
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
    return NextResponse.json(
      { error: e?.message ?? "unknown error" },
      { status: 400 }
    );
  }
}
