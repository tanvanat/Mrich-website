// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getNickFromCookie, isNickAdmin, getOrCreateUserByNick } from "@/lib/auth";

export async function GET() {
  const nick = await getNickFromCookie();
  if (!nick) return NextResponse.json({ authed: false }, { status: 401 });

  await getOrCreateUserByNick(nick); // sync user/role

  return NextResponse.json({
    authed: true,
    nick,
    role: isNickAdmin(nick) ? "ADMIN" : "USER",
  });
}