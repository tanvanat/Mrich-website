// สำหรับ user ทั่วไป ดูคะแนนของตัวเอง (GET) ในหน้า Home
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ปรับ path ให้ถูก
import { prisma } from "@/lib/prisma"; // ← ใช้แบบ named import

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  const latestResponse = await prisma.response.findFirst({
    where: {
      user: { email },
    },
    orderBy: { createdAt: "desc" },
    select: {
      totalScore: true,
      maxScore: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!latestResponse || latestResponse.totalScore === null) {
    return NextResponse.json({
      hasScore: false,
      message: "ยังไม่ได้รับการตรวจ",
    });
  }

  const percent = Math.round((latestResponse.totalScore / latestResponse.maxScore) * 100);

  return NextResponse.json({
    hasScore: true,
    totalScore: latestResponse.totalScore,
    maxScore: latestResponse.maxScore,
    percent,
    updatedAt: latestResponse.updatedAt,
  });
}