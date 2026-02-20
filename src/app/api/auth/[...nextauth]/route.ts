import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ฟังก์ชันสำหรับอ่าน Admin Emails จาก environment variables
function adminSet() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}
const ADMINS = adminSet();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account", // บังคับให้เลือกบัญชีทุกครั้ง
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  // ✅ ใช้ JWT strategy เพื่อให้ middleware ตรวจสอบ role ได้ง่าย
  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    // ตรวจสอบการ Sign In
    async signIn({ user }) {
      // ต้องมี email เท่านั้นถึงจะเข้าได้
      return !!user.email;
    },

    // JWT callback - ทำงานเมื่อมีการสร้างหรืออัปเดต JWT
    async jwt({ token, user }) {
      if (user?.email) {
        const email = user.email.toLowerCase();
        const role = ADMINS.has(email) ? "ADMIN" : "USER";

        try {
          await prisma.user.upsert({
            where: { email },
            create: {
              email,
              name: user.name ?? null,
              role: role as any,
            },
            update: {
              role: role as any,
            },
          });
        } catch (e) {
          console.error("Role upsert failed:", e);
        }

        token.email = email;
        (token as any).role = role;
      } else if (token?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { role: true },
        });

        (token as any).role = dbUser?.role ?? "USER";
      }

      return token;
    },
    // Session callback - ทำงานทุกครั้งที่เรียก useSession() หรือ getSession()
    async session({ session, token }) {
      if (session.user) {
        // ส่งข้อมูลจาก token ไปยัง session
        session.user.email = token.email as string;
        (session.user as any).role = (token as any).role ?? "USER";
        (session.user as any).id = token.sub; // เพิ่ม user id ถ้าต้องการ
      }
      return session;
    },
  },

  // เพิ่ม pages ที่กำหนดเอง (ถ้าต้องการ)
  pages: {
    signIn: "/signin",
    error: "/signin", // หน้า error
  },

  // เพิ่ม event handlers (optional)
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token.email}`);
    },
  },

  // เพิ่ม debug mode ใน development
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
