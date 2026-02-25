import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function normalizeNick(v: string) {
  return (v || "").trim().toLowerCase();
}

function parseAdminNames(envVal: string | undefined) {
  return (envVal || "")
    .split(",")
    .map((s) => normalizeNick(s))
    .filter(Boolean);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/home") ||
    pathname.startsWith("/form") ||
    pathname.startsWith("/goal") ||
    pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  const nick = normalizeNick(req.cookies.get("mrich_nick")?.value || "");
  if (!nick) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // admin gate
  if (pathname.startsWith("/admin")) {
    const admins = parseAdminNames(process.env.ADMIN_NAMES);
    const isAdmin = admins.includes(nick);
    if (!isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/blocked";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/form/:path*", "/goal/:path*", "/admin/:path*"],
};