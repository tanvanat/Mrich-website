import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",  // เพิ่มตรงนี้ เพื่อให้เลือกบัญชีทุกครั้ง
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  session: { strategy: "database" },
  secret: process.env.NEXTAUTH_SECRET,
  // ถ้ามี callbacks หรือการตั้งค่าอื่นๆ ก็ใส่ไว้ตรงนี้
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };