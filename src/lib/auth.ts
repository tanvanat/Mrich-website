import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export function normalizeNick(v: string) {
  return (v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function getNickFromCookie(): Promise<string> {
  const cookieStore = await cookies(); // ✅ Next 16 ต้อง await
  const nick = cookieStore.get("mrich_nick")?.value || "";
  return normalizeNick(nick);
}

export function getAdminNames(): string[] {
  return (process.env.ADMIN_NAMES || "")
    .split(",")
    .map((s) => normalizeNick(s))
    .filter(Boolean);
}

export function isNickAdmin(nick: string): boolean {
  return getAdminNames().includes(normalizeNick(nick));
}

export async function getOrCreateUserByNick(nickRaw: string): Promise<User> {
  const nick = normalizeNick(nickRaw);
  if (!nick) throw new Error("Missing nickname");

  const email = `${nick}@mrich.local`;
  const wantRole = isNickAdmin(nick) ? "ADMIN" : "USER";

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: { email, name: nick, role: wantRole },
    });
  } else if (user.role !== wantRole) {
    user = await prisma.user.update({
      where: { email },
      data: { role: wantRole },
    });
  }

  return user;
}