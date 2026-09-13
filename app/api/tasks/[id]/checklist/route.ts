import { prisma } from "../../../../../lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) {
    return Response.json({ error: "Некорректный id задачи" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const itemId = Number(body?.itemId);
  const isDone = body?.isDone;

  if (!Number.isInteger(itemId) || typeof isDone !== "boolean") {
    return Response.json(
      { error: "Укажите itemId и isDone" },
      { status: 400 }
    );
  }

  const item = await prisma.checklistItem.findUnique({ where: { id: itemId } });
  if (!item || item.taskId !== taskId) {
    return Response.json(
      { error: "Пункт чек-листа не найден" },
      { status: 404 }
    );
  }

  await prisma.checklistItem.update({
    where: { id: itemId },
    data: { isDone },
  });

  const items = await prisma.checklistItem.findMany({
    where: { taskId },
    orderBy: { sortOrder: "asc" },
  });

  return Response.json({ items }, { status: 200 });
}