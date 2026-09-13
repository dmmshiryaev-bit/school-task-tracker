import { prisma } from "../../../lib/prisma";
import { notificationToView } from "../../../lib/notifications";

async function findStudent() {
  return prisma.user.findFirst({ where: { role: "STUDENT" } });
}

export async function GET() {
  const student = await findStudent();
  if (!student) {
    return Response.json({ error: "Ученик не найден" }, { status: 404 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: student.id, isRead: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return Response.json(
    {
      count: notifications.length,
      notifications: notifications.map(notificationToView),
    },
    { status: 200 }
  );
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const notificationId = Number(body?.notificationId);
  if (!Number.isInteger(notificationId)) {
    return Response.json(
      { error: "Укажите notificationId" },
      { status: 400 }
    );
  }

  const student = await findStudent();
  if (!student) {
    return Response.json({ error: "Ученик не найден" }, { status: 404 });
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== student.id) {
    return Response.json(
      { error: "Уведомление не найдено" },
      { status: 404 }
    );
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });

  const unread = await prisma.notification.count({
    where: { userId: student.id, isRead: false },
  });

  return Response.json({ ok: true, count: unread }, { status: 200 });
}