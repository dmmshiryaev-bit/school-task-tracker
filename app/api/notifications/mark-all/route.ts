import { prisma } from "../../../../lib/prisma";

export async function POST() {
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  if (!student) {
    return Response.json({ error: "Ученик не найден" }, { status: 404 });
  }

  const result = await prisma.notification.updateMany({
    where: { userId: student.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return Response.json({ ok: true, updated: result.count }, { status: 200 });
}