import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export function normalizeNick(v: string) {
  return (v || "").trim().toLowerCase();
}

// ✅ FIX: cookies() อาจเป็น Promise ต้อง await
export async function getNickFromCookie() {
  const cookieStore = await cookies();
  const nick = cookieStore.get("mrich_nick")?.value || "";
  return normalizeNick(nick);
}

export function getAdminNames() {
  return (process.env.ADMIN_NAMES || "")
    .split(",")
    .map((s) => normalizeNick(s))
    .filter(Boolean);
}

export function isNickAdmin(nick: string) {
  const admins = getAdminNames();
  return admins.includes(normalizeNick(nick));
}

export async function getOrCreateUserByNick(nickRaw: string): Promise<User> {
  const nick = normalizeNick(nickRaw);
  if (!nick) throw new Error("Missing nickname");

  const email = `${nick}@mrich.local`; // unique key for Prisma User.email

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: nick,
        role: isNickAdmin(nick) ? "ADMIN" : "USER",
      },
    });
  } else {
    const wantRole = isNickAdmin(nick) ? "ADMIN" : "USER";
    if (user.role !== wantRole || user.name !== nick) {
      user = await prisma.user.update({
        where: { email },
        data: { role: wantRole, name: nick },
      });
    }
  }

  return user;
}