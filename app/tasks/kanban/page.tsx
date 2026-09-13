import { Role, TaskStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/currentUser";
import KanbanBoard from "../../../components/KanbanBoard";
import CreateTaskButton from "../../../components/CreateTaskButton";

export default async function KanbanPage() {
  const user = await getCurrentUser();
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });

  if (!student) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        Ученик не найден. Выполните <code>npm run seed</code>.
      </div>
    );
  }

  const [tasks, subjects, students] = await Promise.all([
    prisma.task.findMany({
      where: {
        studentId: student.id,
        status: {
          in: [
            TaskStatus.TODO,
            TaskStatus.IN_PROGRESS,
            TaskStatus.REVIEW,
            TaskStatus.DONE,
            TaskStatus.REWORK,
          ],
        },
      },
      include: { subject: true, checklistItems: true },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    }),
    prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", isActive: true },
      include: { studentProfile: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  if (!user) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        Пользователь не найден. Выполните <code>npm run seed</code>.
      </div>
    );
  }

  const targetStudents =
    user.role === Role.PARENT
      ? students.filter((s) => s.studentProfile?.parentUserId === user.id)
      : students;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Задачи</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Канбан-доска: перетаскивание появится позже
          </p>
        </div>
        <CreateTaskButton
          currentUserId={user.id}
          currentUserRole={user.role}
          studentId={user.role === Role.STUDENT ? user.id : null}
          students={targetStudents.map((s) => ({
            id: s.id,
            fullName: s.fullName,
          }))}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        />
      </header>

      <KanbanBoard
        key={tasks.map((t) => `${t.id}:${t.status}`).join("|")}
        tasks={tasks}
        currentUserId={student.id}
      />
    </div>
  );
}