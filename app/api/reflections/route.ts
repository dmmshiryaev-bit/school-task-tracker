import { prisma } from "../../../lib/prisma";
import { createNotification, NotificationType } from "../../../lib/notifications";

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;
const REFLECTION_BONUS = 3;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const taskId = Number(body.taskId);
  const difficulty = Number(body.difficulty);
  if (!Number.isInteger(taskId)) {
    return Response.json({ error: "Некорректный id задачи" }, { status: 400 });
  }
  if (
    !Number.isInteger(difficulty) ||
    difficulty < MIN_DIFFICULTY ||
    difficulty > MAX_DIFFICULTY
  ) {
    return Response.json({ error: "Сложность должна быть от 1 до 5" }, { status: 400 });
  }

  const whatWasEasy = typeof body.whatWasEasy === "string" ? body.whatWasEasy : "";
  const whatWasHard = typeof body.whatWasHard === "string" ? body.whatWasHard : "";
  const needHelp = Boolean(body.needHelp);
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string")
    : [];

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, studentId: true, subjectId: true, topicId: true },
  });
  if (!task) {
    return Response.json({ error: "Задача не найдена" }, { status: 404 });
  }

  const existing = await prisma.reflection.findFirst({
    where: { taskId: task.id, studentId: task.studentId },
  });
  if (existing) {
    return Response.json(
      { error: "Рефлексия для этой задачи уже отправлена" },
      { status: 409 }
    );
  }

  const rule = await prisma.rewardRule.findUnique({
    where: { code: "reflection_submitted" },
  });

  const result = await prisma.$transaction(async (tx) => {
    const reflection = await tx.reflection.create({
      data: {
        studentId: task.studentId,
        taskId: task.id,
        subjectId: task.subjectId,
        topicId: task.topicId,
        difficulty,
        whatWasEasy,
        whatWasHard,
        needHelp,
        tags,
      },
    });

    const { _sum } = await tx.rewardTransaction.aggregate({
      where: { studentId: task.studentId },
      _sum: { points: true },
    });
    const balanceAfter = (_sum.points ?? 0) + REFLECTION_BONUS;

    const transaction = await tx.rewardTransaction.create({
      data: {
        studentId: task.studentId,
        points: REFLECTION_BONUS,
        balanceAfter,
        ruleId: rule ? rule.id : null,
        taskId: task.id,
        reason: "Заполнена рефлексия",
        isManual: false,
      },
    });

    return {
      reflectionId: reflection.id,
      transactionId: transaction.id,
      balanceAfter,
    };
  });

  await createNotification(
    task.studentId,
    NotificationType.REWARD_EARNED,
    {
      points: REFLECTION_BONUS,
      reason: "Заполнена рефлексия",
      taskTitle: (await prisma.task.findUnique({
        where: { id: task.id },
        select: { title: true },
      }))?.title,
    },
    task.id
  );

  return Response.json(
    {
      reflectionId: result.reflectionId,
      points: REFLECTION_BONUS,
      balanceAfter: result.balanceAfter,
    },
    { status: 200 }
  );
}