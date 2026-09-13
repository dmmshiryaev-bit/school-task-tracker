import { Calendar } from "lucide-react";
import TaskCalendar, {
  type CalendarTask,
} from "../../components/TaskCalendar";
import { prisma } from "../../lib/prisma";

export default async function CalendarPage() {
  const student = await prisma.user.findFirst({
    where: { role: "STUDENT" },
  });

  if (!student) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        Ученик не найден. Выполните <code>npm run seed</code>.
      </div>
    );
  }

  const tasks = await prisma.task.findMany({
    where: { studentId: student.id, dueDate: { not: null } },
    include: {
      subject: { select: { name: true, color: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const calendarTasks: CalendarTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    dueDate: task.dueDate!.toISOString(),
    status: task.status,
    subject: { name: task.subject.name, color: task.subject.color },
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold">Календарь задач</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Все задания по датам: дедлайны, сроки и просрочки
        </p>
      </header>

      <TaskCalendar tasks={calendarTasks} />
    </div>
  );
}