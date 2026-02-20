import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ allow NextAuth + Next.js internals always
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ✅ protect only these routes
  const needAuth =
    pathname.startsWith("/home") ||
    pathname.startsWith("/form") ||
    pathname.startsWith("/goal") ||
    pathname.startsWith("/admin");

  if (!needAuth) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ยังไม่ login → ไปหน้า signin
  if (!token?.email) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    // (optional) remember where user wanted to go
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // ถ้าเข้า /admin ต้องเป็น ADMIN
  if (pathname.startsWith("/admin")) {
    const role = (token as any)?.role;
    if (role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/blocked";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // ✅ match everything except NextAuth + Next.js internals
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
