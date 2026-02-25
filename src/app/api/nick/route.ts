import { NextResponse } from "next/server";
import { getOrCreateUserByNick } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const nickname = String(body?.nickname ?? "").trim().toLowerCase().replace(/[^a-z]/g, "");

  if (!nickname) {
    return NextResponse.json({ error: "missing nickname" }, { status: 400 });
  }

  // สร้าง/อัปเดต user role ตาม ADMIN_NAMES
  await getOrCreateUserByNick(nickname);

  const res = NextResponse.json({ ok: true, nickname });

  res.cookies.set("mrich_nick", nickname, {
    path: "/",
    httpOnly: true,          // middleware อ่านได้
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 วัน
  });

  return res;
}