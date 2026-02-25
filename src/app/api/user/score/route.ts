import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, getOrCreateUserByNick } from "@/lib/auth";

const FORM_ID = "mrich-assessment-v1";

export async function GET() {
  const nick = await getNickFromCookie();
  if (!nick) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUserByNick(nick);

  const latestResponse = await prisma.response.findFirst({
    where: { userId: user.id, formId: FORM_ID },
    orderBy: { createdAt: "desc" },
    select: { totalScore: true, maxScore: true, updatedAt: true },
  });

  if (!latestResponse) {
    return NextResponse.json({ hasScore: false, message: "ยังไม่ได้รับการตรวจ" });
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