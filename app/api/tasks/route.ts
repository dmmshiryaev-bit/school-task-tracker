import { Priority, Role, TaskStatus, TaskType } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { createNotification, NotificationType } from "../../../lib/notifications";

const PRIORITY_VALUES = [
  Priority.LOW,
  Priority.MEDIUM,
  Priority.HIGH,
  Priority.URGENT,
];

export async function POST(request: Request) {
  try {
    return await handle(request);
  } catch (e) {
    console.error("[api/tasks POST]", e);
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

async function handle(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const actorId = Number(request.headers.get("x-user-id"));
  if (!Number.isInteger(actorId) || actorId <= 0) {
    return Response.json({ error: "Не авторизован" }, { status: 401 });
  }

  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (!actor || !actor.isActive) {
    return Response.json({ error: "Пользователь не найден" }, { status: 403 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return Response.json(
      { error: "Укажите название задачи" },
      { status: 400 }
    );
  }

  const subjectId = Number(body.subjectId);
  if (!Number.isInteger(subjectId)) {
    return Response.json({ error: "Укажите предмет" }, { status: 400 });
  }
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return Response.json({ error: "Предмет не найден" }, { status: 400 });
  }

  let priority: Priority = Priority.MEDIUM;
  if (body.priority !== undefined && body.priority !== null && body.priority !== "") {
    if (!PRIORITY_VALUES.includes(body.priority)) {
      return Response.json(
        { error: "Некорректный приоритет" },
        { status: 400 }
      );
    }
    priority = body.priority;
  }

  let dueDate: Date | null = null;
  if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== "") {
    const parsed = new Date(String(body.dueDate));
    if (Number.isNaN(parsed.getTime())) {
      return Response.json({ error: "Некорректная дата срока" }, { status: 400 });
    }
    dueDate = parsed;
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  let targetStudentId: number;
  if (actor.role === Role.STUDENT) {
    targetStudentId = actor.id;
  } else {
    const bodyStudentId = Number(body.studentId);
    if (!Number.isInteger(bodyStudentId) || bodyStudentId <= 0) {
      return Response.json({ error: "Укажите ученика" }, { status: 400 });
    }
    const target = await prisma.user.findUnique({
      where: { id: bodyStudentId },
      include: { studentProfile: true },
    });
    if (!target || target.role !== Role.STUDENT || !target.isActive) {
      return Response.json({ error: "Ученик не найден" }, { status: 400 });
    }
    if (
      actor.role === Role.PARENT &&
      target.studentProfile?.parentUserId !== actor.id
    ) {
      return Response.json(
        { error: "Можно создавать задачи только для своих детей" },
        { status: 403 }
      );
    }
    targetStudentId = bodyStudentId;
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      subjectId,
      priority,
      dueDate,
      status: TaskStatus.TODO,
      taskType: TaskType.HOMEWORK,
      studentId: targetStudentId,
      createdById: actor.id,
      updatedById: actor.id,
    },
    include: {
      subject: {
        select: { id: true, name: true, color: true },
      },
      student: { select: { id: true, fullName: true, role: true } },
      createdBy: { select: { id: true, fullName: true } },
      checklistItems: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: actor.id,
      entityType: "Task",
      entityId: task.id,
      action: "task_created",
      newValue: task.title,
    },
  });

  if (actor.id !== targetStudentId) {
    await createNotification(
      targetStudentId,
      NotificationType.TASK_CREATED,
      {
        taskTitle: task.title,
        subjectName: subject.name,
      },
      task.id
    );
  }

  return Response.json(task, { status: 201 });
}