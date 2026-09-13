import bcrypt from "bcrypt";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return Response.json(
      { error: "Укажите текущий и новый пароль" },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return Response.json(
      { error: "Новый пароль должен быть не короче 8 символов" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  if (!user) {
    return Response.json({ error: "Ученик не найден" }, { status: 404 });
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordMatches) {
    return Response.json(
      { error: "Текущий пароль указан неверно" },
      { status: 400 }
    );
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  return Response.json({ ok: true }, { status: 200 });
}