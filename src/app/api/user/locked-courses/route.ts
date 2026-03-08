// src/app/api/user/locked-courses/route.ts
//
// GET /api/user/locked-courses
// Returns { "mindset-principles": true, "proactive": false }
// — HomePage ใช้ตรวจว่า course ไหนส่งแล้ว (locked) จาก DB จริง
//
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNickFromCookie, getOrCreateUserByNick } from "@/lib/auth";

const FORM_COURSE_MAP: Record<string, string> = {
  "mrich-assessment-course1-v1": "mindset-principles",
  "mrich-assessment-course2-v1": "proactive",
  "mrich-assessment-v1":         "mindset-principles",
};

export async function GET() {
  const nick = await getNickFromCookie();
  if (!nick) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await getOrCreateUserByNick(nick);

  const states = await prisma.examState.findMany({
    where: { userId: user.id },
    select: { formId: true, locked: true },
  });

  // แปลงเป็น { "mindset-principles": true/false, "proactive": true/false }
  const result: Record<string, boolean> = {};
  for (const s of states) {
    const courseName = FORM_COURSE_MAP[s.formId];
    if (courseName) {
      // ถ้ามีหลาย formId map ไปยัง course เดียวกัน ให้ locked ชนะ
      result[courseName] = result[courseName] || s.locked;
    }
  }

  return NextResponse.json(result);
}