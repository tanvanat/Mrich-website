import { NextResponse } from "next/server";

function normalizeNick(v: string) {
  return (v || "").trim().toLowerCase().replace(/[^a-z]/g, "");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const nick = normalizeNick(String(body?.nickname ?? ""));

  if (!nick || !/^[a-z]+$/.test(nick)) {
    return NextResponse.json({ error: "invalid nickname" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, nick });

  // ✅ สำคัญ: ต้อง path="/" ไม่งั้นบางทีไปหน้าอื่นแล้ว cookie มองไม่เห็น
  res.cookies.set("mrich_nick", nick, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 วัน
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("mrich_nick", "", {
    path: "/",
    maxAge: 0,
  });
  return res;
}