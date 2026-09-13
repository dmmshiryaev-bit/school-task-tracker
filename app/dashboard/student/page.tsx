import { TaskStatus } from "@prisma/client";
import { Trophy } from "lucide-react";
import CreateTaskButton from "../../../components/CreateTaskButton";
import DashboardTaskTabs, {
  type DashboardTaskRow,
} from "../../../components/DashboardTaskTabs";
import { prisma } from "../../../lib/prisma";

const shortDate = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});

export default async function StudentDashboardPage() {
  const student = await prisma.user.findFirst({
    where: { role: "STUDENT" },
    include: { studentProfile: { include: { parent: true } } },
  });

  if (!student) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        Ученик не найден. Выполните <code>npm run seed</code>.
      </div>
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [todayTasks, upcomingTasks, overdueTasks, points, subjects] =
    await Promise.all([
    prisma.task.findMany({
      where: {
        studentId: student.id,
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELED] },
        dueDate: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        subject: { select: { name: true, color: true } },
      },
      orderBy: [{ dueTime: "asc" }, { priority: "desc" }],
    }),
    prisma.task.findMany({
      where: {
        studentId: student.id,
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELED] },
        dueDate: { gt: endOfDay },
      },
      include: {
        subject: { select: { name: true, color: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.task.findMany({
      where: {
        studentId: student.id,
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELED] },
        dueDate: { lt: startOfDay },
      },
      include: {
        subject: { select: { name: true, color: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.rewardTransaction.aggregate({
      where: { studentId: student.id },
      _sum: { points: true },
    }),
    prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const toRow = (task: {
    id: number;
    title: string;
    subject: { name: string; color: string };
    dueDate: Date | null;
    dueTime: string | null;
  }): DashboardTaskRow => ({
    id: task.id,
    title: task.title,
    subject: task.subject,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    dueTime: task.dueTime,
  });

  const balance = points._sum.points ?? 0;
  const nextLevel = Math.max(0, 100 - balance);
  const parentName = student.studentProfile?.parent?.fullName;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">
            Привет, {student.fullName}! 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {parentName
              ? `Родитель: ${parentName}`
              : "Следи за домашними заданиями и не пропускай сроки"}
          </p>
        </div>
        <CreateTaskButton
          currentUserId={student.id}
          currentUserRole={student.role}
          studentId={student.id}
          students={[]}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        />
      </header>

      <div className="grid items-stretch gap-6 sm:grid-cols-2">
        <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Прогресс недели</p>
          <p className="mt-2 text-3xl font-semibold">68%</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: "68%" }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            68% выполнено за неделю
          </p>
        </div>

        <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Баланс баллов</p>
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-primary">{balance}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            до следующего уровня: {nextLevel} баллов
          </p>
        </div>
      </div>

      <DashboardTaskTabs
        todayTasks={todayTasks.map(toRow)}
        upcomingTasks={upcomingTasks.map(toRow)}
      />

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Есть задания, которые ждут тебя
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Срок уже прошёл, но ты успеешь их закрыть
        </p>

        {overdueTasks.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            Просроченных заданий нет — так держать! 👍
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {overdueTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: task.subject.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.subject.name}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-sm text-danger">
                  {task.dueDate ? shortDate.format(task.dueDate) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
