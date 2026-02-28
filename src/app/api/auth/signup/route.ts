import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeNick, isNickAdmin } from "@/lib/auth";

function getAllowedNicks(): string[] {
  const admins = (process.env.ADMIN_NAMES || "")
    .split(",")
    .map((s) => normalizeNick(s))
    .filter(Boolean);

  const users = (process.env.USER_NAMES || "")
    .split(",")
    .map((s) => normalizeNick(s))
    .filter(Boolean);

  return [...admins, ...users];
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const nickname = normalizeNick(String(body?.nickname ?? ""));
  const password = String(body?.password ?? "");

  if (!nickname) {
    return NextResponse.json({ error: "invalid nickname" }, { status: 400 });
  }

  if (!/^[a-z0-9]{6}$/.test(password)) {
    return NextResponse.json({ error: "invalid password" }, { status: 400 });
  }

  // ✅ เช็คว่าชื่อนี้ได้รับอนุญาตหรือไม่
  const allowed = getAllowedNicks();
  if (!allowed.includes(nickname)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์สมัครสมาชิก" }, { status: 403 });
  }

  const email = `${nickname}@mrich.local`;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "ชื่อเล่นนี้ถูกใช้แล้ว" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const role = isNickAdmin(nickname) ? "ADMIN" : "USER";

  await prisma.user.create({
    data: { email, name: nickname, role, password: hashed },
  });

  return NextResponse.json({ ok: true });
}