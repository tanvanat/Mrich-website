// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeNick, isNickAdmin } from "@/lib/auth";

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

  // รองรับทั้ง USER_NAMES เดิม (backward compat) และ 3 roles ใหม่
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

  if (!nickname) {
    return NextResponse.json({ error: "กรุณากรอกชื่อเล่น" }, { status: 400 });
  }

  if (!/^[a-z0-9]{6}$/.test(password)) {
    return NextResponse.json(
      { error: "รหัสผ่านต้องเป็นตัวอักษร a-z, 0-9 จำนวน 6 ตัว" },
      { status: 400 }
    );
  }

  // เช็คสิทธิ์
  const allowed = getAllowedNicks();
  if (!allowed.includes(nickname)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์สมัครสมาชิก" }, { status: 403 });
  }

  const email = `${nickname}@mrich.local`;
  const hashed = await bcrypt.hash(password, 10);
  const role = isNickAdmin(nickname) ? "ADMIN" : "USER";

  // ✅ upsert: ถ้ามี user เดิมอยู่แล้ว (สมัยก่อนไม่มี password) → update password
  //           ถ้ายังไม่มี → create ใหม่
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // มี user อยู่แล้ว
    if (existing.password) {
      // มี password แล้ว = สมัครซ้ำจริงๆ
      return NextResponse.json(
        { error: "ชื่อเล่นนี้ถูกใช้แล้ว หากลืมรหัสผ่านกรุณาติดต่อ Admin" },
        { status: 409 }
      );
    }
    // ไม่มี password (user เก่า) → อัปเดต password ให้
    await prisma.user.update({
      where: { email },
      data: { password: hashed, role },
    });
    return NextResponse.json({ ok: true, migrated: true });
  }

  // ไม่มี user → create ใหม่
  await prisma.user.create({
    data: { email, name: nickname, role, password: hashed },
  });

  return NextResponse.json({ ok: true });
}