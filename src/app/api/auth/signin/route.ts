// src/app/api/auth/signin/route.ts  (หรือ [...nextauth] credentials ถ้าใช้ NextAuth)
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeNick } from "@/lib/auth";

function getAllowedNicks(): string[] {
  const admins = (process.env.ADMIN_NAMES || "")
    .split(",")
    .map((s) => normalizeNick(s))
    .filter(Boolean);

  const leaders = (process.env.LEADER_NAMES || "")
    .split(",")
    .map((s) => normalizeNick(s))
    .filter(Boolean);

  const learners = (process.env.LEARNER_NAMES || "")
    .split(",")
    .map((s) => normalizeNick(s))
    .filter(Boolean);

  const legacy = (process.env.USER_NAMES || "")
    .split(",")
    .map((s) => normalizeNick(s))
    .filter(Boolean);

  return [...new Set([...admins, ...leaders, ...learners, ...legacy])];
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const nickname = normalizeNick(String(body?.nickname ?? ""));
  const password = String(body?.password ?? "");

  if (!nickname || !password) {
    return NextResponse.json({ error: "กรุณากรอกชื่อเล่นและรหัสผ่าน" }, { status: 400 });
  }

  // เช็คสิทธิ์จาก env
  const allowed = getAllowedNicks();
  if (!allowed.includes(nickname)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าใช้งาน" }, { status: 403 });
  }

  const email = `${nickname}@mrich.local`;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // ยังไม่เคยสมัคร
    return NextResponse.json(
      { error: "ยังไม่มีบัญชีนี้ กรุณาลงทะเบียนก่อน" },
      { status: 401 }
    );
  }

  if (!user.password) {
    // user เก่าที่ยังไม่ได้ตั้ง password → บอกให้ไปลงทะเบียนใหม่
    return NextResponse.json(
      { error: "บัญชีนี้ยังไม่มีรหัสผ่าน กรุณาลงทะเบียนใหม่อีกครั้ง" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  // ✅ set cookie
  const res = NextResponse.json({ ok: true, nickname });
  res.cookies.set("mrich_nick", nickname, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}