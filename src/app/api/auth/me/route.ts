import { NextResponse } from "next/server";
import { getNickFromCookie, getOrCreateUserByNick } from "@/lib/auth";
import { getAccessInfo } from "@/lib/access";

export const runtime = "nodejs";

export async function GET() {
  try {
    const nick = await getNickFromCookie();

    if (!nick) {
      return NextResponse.json(
        { authed: false },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    await getOrCreateUserByNick(nick);

    const access = getAccessInfo(nick);

    return NextResponse.json(
      {
        authed: true,
        nick,
        role: access.role,
        permissions: {
          canAccessAdmin: access.canAccessAdmin,
          canAccessLeaderExam: access.canAccessLeaderExam,
          canAccessLearnerExam: access.canAccessLearnerExam,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("/api/auth/me error:", error);

    return NextResponse.json(
      { authed: false, error: "Failed to load auth info" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}