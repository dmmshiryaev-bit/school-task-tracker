import { prisma } from "../../../../../lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) {
    return Response.json({ error: "Некорректный id задачи" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const authorId = Number(body?.authorId);

  if (!text) {
    return Response.json({ error: "Текст комментария не может быть пустым" }, { status: 400 });
  }
  if (!Number.isInteger(authorId)) {
    return Response.json({ error: "Укажите authorId" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return Response.json({ error: "Задача не найдена" }, { status: 404 });
  }

  const author = await prisma.user.findUnique({ where: { id: authorId } });
  if (!author) {
    return Response.json({ error: "Автор не найден" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: { taskId, authorId, text },
    include: { author: { select: { id: true, fullName: true } } },
  });

  await prisma.activityLog.create({
    data: {
      actorId: authorId,
      entityType: "Task",
      entityId: taskId,
      action: "comment_added",
      fieldName: "comments",
      newValue: text.slice(0, 200),
    },
  });

  return Response.json(comment, { status: 201 });
}