// src/lib/auth.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role, User } from "@prisma/client";

// --- config ---
const NICK_COOKIE = "mrich_nick";
const NICK_MAX_LEN = 24;

// --- helpers ---
export function normalizeNick(v: string): string {
  // lower-case + allow only a-z
  const s = (v || "").trim().toLowerCase();
  return s.replace(/[^a-z]/g, "").slice(0, NICK_MAX_LEN);
}

export function nickToEmail(nickRaw: string): string {
  const nick = normalizeNick(nickRaw);
  // ใช้เป็น unique key ใน Prisma User.email
  return `${nick}@mrich.local`;
}

export async function getNickFromCookie(): Promise<string> {
  const cookieStore = await cookies(); // ✅ Next 16 cookies() returns Promise
  const nick = cookieStore.get(NICK_COOKIE)?.value || "";
  return normalizeNick(nick);
}

export function getAdminNames(): string[] {
  return (process.env.ADMIN_NAMES || "")
    .split(",")
    .map((s) => normalizeNick(s))
    .filter(Boolean);
}

export function isNickAdmin(nick: string): boolean {
  const n = normalizeNick(nick);
  if (!n) return false;
  return getAdminNames().includes(n);
}

export function roleFromNick(nick: string): Role {
  return isNickAdmin(nick) ? "ADMIN" : "USER";
}

// --- guards for API routes ---
export async function requireNick(): Promise<string> {
  const nick = await getNickFromCookie();
  if (!nick) throw new Error("unauthorized");
  return nick;
}

export async function requireAdmin(): Promise<string> {
  const nick = await requireNick();
  if (!isNickAdmin(nick)) throw new Error("forbidden");
  return nick;
}

// --- DB: get/create user by nick (cookie-based auth) ---
export async function getOrCreateUserByNick(nickRaw: string): Promise<User> {
  const nick = normalizeNick(nickRaw);
  if (!nick) throw new Error("Missing nickname");

  const email = nickToEmail(nick);
  const wantRole: Role = roleFromNick(nick);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: nick,
        role: wantRole,
      },
    });
    return user;
  }

  // sync role in case env ADMIN_NAMES changed
  if (user.role !== wantRole) {
    user = await prisma.user.update({
      where: { email },
      data: { role: wantRole },
    });
  }

  // sync name (optional)
  if ((user.name ?? "") !== nick) {
    user = await prisma.user.update({
      where: { email },
      data: { name: nick },
    });
  }

  return user;
}