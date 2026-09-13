import { CheckCircle2, Flame, GraduationCap, Sparkles } from "lucide-react";
import { prisma } from "../../lib/prisma";
import ProfileEditor from "../../components/ProfileEditor";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

async function computeStats(studentId: number) {
  const [doneCount, balanceAgg, badgeCount, doneTasks] = await Promise.all([
    prisma.task.count({
      where: { studentId, status: "DONE" },
    }),
    prisma.rewardTransaction.aggregate({
      where: { studentId, points: { gt: 0 } },
      _sum: { points: true },
    }),
    prisma.userBadge.count({ where: { userId: studentId } }),
    prisma.task.findMany({
      where: { studentId, status: "DONE", completedAt: { not: null } },
      select: { completedAt: true },
    }),
  ]);

  const doneDays = new Set(
    doneTasks
      .map((t) => (t.completedAt ? dayKey(new Date(t.completedAt)) : null))
      .filter(Boolean)
  ) as Set<string>;

  let streak = 0;
  const cursor = new Date();
  if (!doneDays.has(dayKey(cursor))) {
    cursor.setTime(cursor.getTime() - DAY_MS);
  }
  while (doneDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setTime(cursor.getTime() - DAY_MS);
  }

  return {
    doneCount,
    balance: balanceAgg._sum?.points ?? 0,
    badgeCount,
    streak,
  };
}

export default async function ProfilePage() {
  const student = await prisma.user.findFirst({
    where: { role: "STUDENT" },
    include: {
      studentProfile: { include: { parent: true } },
    },
  });

  if (!student || !student.studentProfile) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm text-sm text-muted-foreground">
        Профиль ученика не найден
      </div>
    );
  }

  const stats = await computeStats(student.id);
  const notifSettings = student.notificationSettings as Record<string, boolean> | null;

  const statCards = [
    {
      label: "Выполнено задач",
      value: stats.doneCount,
      icon: CheckCircle2,
      iconClass: "text-success",
    },
    {
      label: "Баланс баллов",
      value: stats.balance,
      icon: Sparkles,
      iconClass: "text-primary",
    },
    {
      label: "Серия дней",
      value: stats.streak,
      icon: Flame,
      iconClass: "text-warning",
    },
    {
      label: "Бейджей получено",
      value: stats.badgeCount,
      icon: GraduationCap,
      iconClass: "text-[var(--chart-3)]",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Мой профиль</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ваши данные, статистика и настройки
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
            <Icon className={`h-5 w-5 ${iconClass}`} />
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <ProfileEditor
        fullName={student.fullName}
        email={student.email}
        roleLabel={student.role === "STUDENT" ? "студент" : student.role.toLowerCase()}
        grade={student.studentProfile.grade}
        parentName={student.studentProfile.parent?.fullName ?? null}
        initialNotifications={notifSettings}
      />
    </div>
  );
}