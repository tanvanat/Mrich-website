import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthed(req: Request) {
  const pass = process.env.ADMIN_PASSWORD || "";
  const got = req.headers.get("x-admin-password") || "";
  return pass.length > 0 && got === pass;
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export async function GET(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await prisma.response.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = ["id","formId","name","totalScore","maxScore","percent","level","createdAt"];
  const lines = [header.join(",")];

  for (const r of rows) {
    lines.push([
      r.id,
      r.formId,
      r.name,
      r.totalScore,
      r.maxScore,
      r.percent,
      r.level,
      r.createdAt.toISOString(),
    ].map(csvEscape).join(","));
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mrich_responses.csv"`,
    },
  });
}
