import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  if (!user) {
    return Response.json({ error: "Ученик не найден" }, { status: 404 });
  }

  const data: Prisma.UserUpdateInput = {};

  if (typeof body.fullName === "string" && body.fullName.trim()) {
    data.fullName = body.fullName.trim();
  }

  if (
    body.notificationSettings &&
    typeof body.notificationSettings === "object"
  ) {
    data.notificationSettings = body.notificationSettings;
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Нет данных для обновления" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      role: true,
      notificationSettings: true,
    },
  });

  return Response.json({ user: updated }, { status: 200 });
}