// สำหรับ admin เท่านั้น บันทึก/อัปเดตคะแนน (POST) ในหน้า Admin Dashboard

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ปรับ path ให้ตรงกับโปรเจกต์ของคุณ
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // 1. ตรวจสอบ session และสิทธิ์ admin
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "ต้องเป็น ADMIN เท่านั้น" },
      { status: 403 }
    );
  }

  try {
    // 2. อ่าน body
    const body = await request.json();
    const { responseId, userEmail, scores, total, maxTotal } = body;

    // 3. Validate ข้อมูลที่จำเป็น
    if (
      !responseId ||
      typeof responseId !== "string" ||
      !userEmail ||
      typeof userEmail !== "string" ||
      !Array.isArray(scores) ||
      typeof total !== "number" ||
      typeof maxTotal !== "number"
    ) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วนหรือรูปแบบไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // 4. หา response เดิมเพื่อ merge answersJson (ปลอดภัยกับ TypeScript)
    const existingResponse = await prisma.response.findUnique({
      where: { id: responseId },
      select: { answersJson: true },
    });

    if (!existingResponse) {
      return NextResponse.json(
        { error: "ไม่พบ Response ID นี้" },
        { status: 404 }
      );
    }

    // 5. Merge answersJson อย่างปลอดภัย
    const currentAnswersJson = existingResponse.answersJson
      ? (existingResponse.answersJson as Record<string, any>)
      : {};

    const updatedAnswersJson = {
      ...currentAnswersJson,
      scores, // เพิ่ม/อัปเดต field scores
    };

    // 6. อัปเดตในฐานข้อมูล
    const updated = await prisma.response.update({
      where: { id: responseId },
      data: {
        totalScore: total,
        maxScore: maxTotal,
        percent: maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0,
        answersJson: updatedAnswersJson,
        // updatedAt จะอัตโนมัติถ้ามี @updatedAt ใน schema
      },
    });

    return NextResponse.json({
      success: true,
      updated: {
        id: updated.id,
        totalScore: updated.totalScore,
        maxScore: updated.maxScore,
        percent: updated.percent,
      },
    });
  } catch (error) {
    console.error("Admin save score error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึก";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}