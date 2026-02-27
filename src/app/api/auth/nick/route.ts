import { NextResponse } from "next/server";
import { getOrCreateUserByNick, normalizeNick } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const nicknameRaw = String(body?.nickname ?? "");
  const nickname = normalizeNick(nicknameRaw).replace(/[^a-z0-9]/g, "");

  if (!nickname || !/^[a-z0-9]+$/.test(nickname)) {
    return NextResponse.json({ error: "invalid nickname" }, { status: 400 });
  }

  // create/sync user in DB (role ADMIN/USER จาก env)
  await getOrCreateUserByNick(nickname);

  const res = NextResponse.json({ ok: true, nickname });

  // set cookie (httpOnly)
  res.cookies.set("mrich_nick", nickname, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}