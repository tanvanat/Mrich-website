// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getNickFromCookie, isNickAdmin, getOrCreateUserByNick } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const nick = await getNickFromCookie();
  if (!nick) {
    return NextResponse.json({ authed: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  await getOrCreateUserByNick(nick);

  return NextResponse.json(
    { authed: true, nick, role: isNickAdmin(nick) ? "ADMIN" : "USER" },
    { headers: { "Cache-Control": "no-store" } }
  );
}