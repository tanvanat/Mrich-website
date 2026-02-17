import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needAuth =
    pathname.startsWith("/home") ||
    pathname.startsWith("/form") ||
    pathname.startsWith("/goal") ||
    pathname.startsWith("/admin");

  if (!needAuth) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // ยังไม่ login
  if (!token?.email) {
    const url = new URL("/signin", req.url);
    return NextResponse.redirect(url);
  }

  // ถ้าเข้า /admin ต้องเป็น ADMIN
  if (pathname.startsWith("/admin")) {
    const role = (token as any)?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/blocked", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/form/:path*", "/goal/:path*", "/admin/:path*"],
};
