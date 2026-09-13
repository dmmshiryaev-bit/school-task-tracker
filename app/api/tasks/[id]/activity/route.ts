import { prisma } from "../../../../../lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) {
    return Response.json({ error: "Некорректный id задачи" }, { status: 400 });
  }

  const logs = await prisma.activityLog.findMany({
    where: { entityType: "Task", entityId: taskId },
    include: { actor: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ logs }, { status: 200 });
}