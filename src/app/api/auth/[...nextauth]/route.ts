// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ฟังก์ชันสำหรับอ่าน Admin Emails จาก env (case-insensitive)
function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

const ADMINS = getAdminEmails();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // Email Provider - ส่ง magic link จริงผ่าน SMTP (Gmail)
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "no-reply@mrich.com",
    }),
  ],

  // ใช้ JWT strategy เพื่อให้ middleware และ client อ่าน role ได้ง่าย
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 วัน
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/signin",
    signOut: "/signin",
    error: "/signin?error=true",
    newUser: "/home",
    verifyRequest: "/verify-request", // หน้า "Check your email" ที่คุณเห็น
  },

  callbacks: {
    async signIn({ user, account, profile, email }) {
      if (!user.email) {
        console.log("Sign in rejected: No email");
        return false;
      }

      const userEmail = user.email.toLowerCase();

      try {
        await prisma.user.upsert({
          where: { email: userEmail },
          create: {
            email: userEmail,
            name: user.name ?? profile?.name ?? null,
            role: ADMINS.has(userEmail) ? "ADMIN" : "USER",
          },
          update: {
            name: user.name ?? profile?.name ?? null,
            role: ADMINS.has(userEmail) ? "ADMIN" : "USER",
          },
        });

        console.log(`Sign in success: ${userEmail} (${ADMINS.has(userEmail) ? "ADMIN" : "USER"})`);
        return true;
      } catch (err) {
        console.error("SignIn upsert error:", err);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.email = user.email?.toLowerCase();
        token.role = ADMINS.has(token.email as string) ? "ADMIN" : "USER";
      } else if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "USER";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.email = token.email as string;
        (session.user as any).role = token.role ?? "USER";
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },

  events: {
    async signIn({ user }) {
      console.log(`[EVENT] User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`[EVENT] User signed out: ${token?.email}`);
    },
    async createUser({ user }) {
      console.log(`[EVENT] New user created: ${user.email}`);
    },
  },

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };