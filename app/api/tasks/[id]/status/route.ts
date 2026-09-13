import { Role, TaskStatus } from "@prisma/client";
import { prisma } from "../../../../../lib/prisma";
import { createNotification, NotificationType } from "../../../../../lib/notifications";

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
  const status = body?.status as TaskStatus | undefined;
  if (!status || !Object.values(TaskStatus).includes(status)) {
    return Response.json({ error: "Некорректный статус" }, { status: 400 });
  }

  const actorId = request.headers.get("x-user-id");
  let actorIdNumber: number | null = null;
  if (actorId) {
    const parsed = Number(actorId);
    if (Number.isInteger(parsed)) {
      actorIdNumber = parsed;
    }
  }

  if (actorIdNumber !== null) {
    const actor = await prisma.user.findUnique({
      where: { id: actorIdNumber },
    });
    if (!actor) {
      return Response.json(
        { error: "Пользователь не найден" },
        { status: 403 }
      );
    }
    if (actor.role === Role.STUDENT && status === TaskStatus.DONE) {
      return Response.json(
        { error: "Ученик не может перевести задачу в статус «Выполнено»" },
        { status: 403 }
      );
    }
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return Response.json({ error: "Задача не найдена" }, { status: 404 });
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      updatedById: actorIdNumber ?? task.updatedById,
      completedAt: status === TaskStatus.DONE ? new Date() : null,
    },
    include: { subject: true, checklistItems: true },
  });

  await prisma.activityLog.create({
    data: {
      actorId: actorIdNumber ?? task.updatedById,
      entityType: "Task",
      entityId: task.id,
      action: "status_changed",
      fieldName: "status",
      oldValue: task.status,
      newValue: status,
    },
  });

  await createNotification(
    task.studentId,
    status === TaskStatus.DONE
      ? NotificationType.TASK_DONE
      : NotificationType.TASK_STATUS_CHANGED,
    {
      taskTitle: task.title,
      newStatus: status,
      oldStatus: task.status,
    },
    task.id
  );

  return Response.json(updatedTask, { status: 200 });
}