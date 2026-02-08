import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthed(req: Request) {
  const pass = process.env.ADMIN_PASSWORD || "";
  const got = req.headers.get("x-admin-password") || "";
  return pass.length > 0 && got === pass;
}

export async function GET(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await prisma.response.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(
    rows.map((r: any) => ({
      id: r.id,
      formId: r.formId,
      name: r.name,
      totalScore: r.totalScore,
      maxScore: r.maxScore,
      percent: r.percent,
      level: r.level,
      createdAt: r.createdAt,
    }))
  );
}
