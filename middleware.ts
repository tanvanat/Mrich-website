// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

function normalizeNick(v: string) {
  return (v || "").trim().toLowerCase().replace(/[^a-z]/g, "");
}

function isAdminNick(nick: string) {
  const admins = (process.env.ADMIN_NAMES || "")
    .split(",")
    .map((s) => normalizeNick(s))
    .filter(Boolean);
  return admins.includes(normalizeNick(nick));
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ✅ public routes
  if (
    pathname === "/" ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/api/auth/nick") ||
    pathname.startsWith("/api/auth/me") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets")
  ) {
    return NextResponse.next();
  }

  const nick = normalizeNick(req.cookies.get("mrich_nick")?.value || "");

  // ✅ protect routes
  const protectedPaths = ["/home", "/form", "/goal", "/admin"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !nick) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  // ✅ admin only
  if (pathname.startsWith("/admin") && !isAdminNick(nick)) {
    const url = req.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};