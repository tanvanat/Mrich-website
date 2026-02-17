import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const FORM_ID = "mrich-assessment-v1";
const EXAM_MINUTES = 30;

function newAttemptToken() {
  return crypto.randomUUID();
}

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const email = (token.email as string).toLowerCase();
  const role = ((token as any).role ?? "USER") as "ADMIN" | "USER";

  const url = new URL(req.url);
  const reset = url.searchParams.get("reset") === "1"; // ✅ admin เท่านั้นถึงใช้ได้

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, email: true, name: true },
  });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  let state = await prisma.examState.findUnique({
    where: { userId_formId: { userId: user.id, formId: FORM_ID } },
  });

  // 1) create ครั้งแรก: เริ่มจับเวลาทันทีเมื่อเข้าหน้า
  if (!state) {
    state = await prisma.examState.create({
      data: {
        userId: user.id,
        formId: FORM_ID,
        attemptToken: newAttemptToken(),
        startedAt: new Date(),
        locked: false,
      },
    });
  } else {
    const startedAt = state.startedAt;
    const expired = startedAt
      ? Date.now() > startedAt.getTime() + EXAM_MINUTES * 60 * 1000
      : false;

    // 2) ✅ ADMIN: รีเซ็ตได้ “เฉพาะ” ตอน reset=1
    if (role === "ADMIN" && reset) {
      state = await prisma.examState.update({
        where: { id: state.id },
        data: {
          attemptToken: newAttemptToken(),
          startedAt: new Date(),
          locked: false,
        },
      });
    } else {
      // 3) ADMIN: ถ้าหมดเวลาหรือ locked -> เปิดรอบใหม่อัตโนมัติ (ถ้าคุณต้องการ)
      if (role === "ADMIN" && (expired || state.locked)) {
        state = await prisma.examState.update({
          where: { id: state.id },
          data: {
            attemptToken: newAttemptToken(),
            startedAt: new Date(),
            locked: false,
          },
        });
      }

      // 4) USER: เริ่มได้ครั้งเดียว (ถ้าตั้ง startedAt เป็น null ตอนปลดล็อค)
      if (role === "USER" && !state.locked && !state.startedAt) {
        state = await prisma.examState.update({
          where: { id: state.id },
          data: { startedAt: new Date() },
        });
      }
    }
  }

  const startedAt = state.startedAt;
  const expiresAt = startedAt
    ? new Date(startedAt.getTime() + EXAM_MINUTES * 60 * 1000)
    : null;

  const expired = startedAt ? Date.now() > expiresAt!.getTime() : false;

  return NextResponse.json({
    role,
    locked: state.locked,
    attemptToken: state.attemptToken,
    startedAt: startedAt?.toISOString() ?? null,
    expiresAt: expiresAt?.toISOString() ?? null,
    expired,
  });
}
