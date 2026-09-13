import { BarChart3 } from "lucide-react";
import DifficultyTrendChart, {
  type TrendDatum,
} from "../../components/DifficultyTrendChart";
import SubjectDifficultyChart, {
  type SubjectDifficultyDatum,
} from "../../components/SubjectDifficultyChart";
import { prisma } from "../../lib/prisma";

const shortDate = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});

export default async function AnalyticsPage() {
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

  const [reflections, doneCount] = await Promise.all([
    prisma.reflection.findMany({
      where: { studentId: student.id },
      include: {
        subject: { select: { name: true, color: true } },
        task: { select: { title: true } },
        topic: { select: { title: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.task.count({
      where: { studentId: student.id, status: "DONE" },
    }),
  ]);

  // Сгруппировать по предметам → средняя сложность
  const bySubject = new Map<
    string,
    { name: string; color: string; sum: number; count: number }
  >();
  for (const r of reflections) {
    const name = r.subject?.name ?? "Без предмета";
    const entry = bySubject.get(name) ?? {
      name,
      color: r.subject?.color ?? "#6B7280",
      sum: 0,
      count: 0,
    };
    entry.sum += r.difficulty;
    entry.count += 1;
    bySubject.set(name, entry);
  }

  const subjectChartData: SubjectDifficultyDatum[] = [...bySubject.values()]
    .map((e) => ({ name: e.name, avg: e.sum / e.count, color: e.color }))
    .sort((a, b) => b.avg - a.avg);

  // Динамика за последние 2 недели
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - 13);
  const byDay = new Map<
    string,
    { sum: number; count: number; date: Date }
  >();
  for (const r of reflections) {
    if (r.createdAt < windowStart) continue;
    const day = new Date(r.createdAt);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString();
    const entry = byDay.get(key) ?? { sum: 0, count: 0, date: day };
    entry.sum += r.difficulty;
    entry.count += 1;
    byDay.set(key, entry);
  }

  const trendData: TrendDatum[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const entry = byDay.get(day.toISOString());
    trendData.push({
      label: shortDate.format(day),
      avg: entry ? entry.sum / entry.count : null,
    });
  }

  const hardTopics = reflections
    .filter((r) => r.difficulty >= 4)
    .sort((a, b) => b.difficulty - a.difficulty);

  const totalReflections = reflections.length;
  const totalDifficulty = reflections.reduce((s, r) => s + r.difficulty, 0);
  const overallAvg = totalReflections
    ? Math.round((totalDifficulty / totalReflections) * 10) / 10
    : 0;
  const needHelpCount = reflections.filter((r) => r.needHelp).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold">Аналитика успеваемости</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Следи за нагрузкой и сложными темами по рефлексиям
        </p>
      </header>

      <div className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4">
        <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Всего рефлексий</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {totalReflections}
          </p>
        </div>
        <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Средняя сложность</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {overallAvg}
          </p>
        </div>
        <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Тем с «нужна помощь»</p>
          <p className="mt-2 text-3xl font-semibold text-danger">
            {needHelpCount}
          </p>
        </div>
        <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Выполнено задач</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {doneCount}
          </p>
        </div>
      </div>

      {totalReflections === 0 ? (
        <section className="rounded-xl bg-white p-10 text-center shadow-sm">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 font-medium text-foreground">
            Пока нет данных для аналитики. Заполни первую рефлексию!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Рефлексия появляется после выполнения задания
          </p>
        </section>
      ) : (
        <>
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Сложность по предметам</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Средняя оценка сложности (1–5) по каждой дисциплине
        </p>
        <div className="mt-4">
          <SubjectDifficultyChart data={subjectChartData} />
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Динамика сложности</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Последние 2 недели: становится легче или сложнее
        </p>
        <div className="mt-4">
          <DifficultyTrendChart data={trendData} />
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Сложные темы</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Рефлексии со сложностью 4 и выше
        </p>

        {hardTopics.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            Сложных тем пока нет — так держать!
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Задача</th>
                  <th className="py-2 pr-4 font-medium">Предмет</th>
                  <th className="py-2 pr-4 font-medium">Дата</th>
                  <th className="py-2 pr-4 font-medium">Сложность</th>
                  <th className="py-2 pr-4 font-medium">Что было сложно</th>
                  <th className="py-2 font-medium">Нужна помощь</th>
                </tr>
              </thead>
              <tbody>
                {hardTopics.map((r, i) => (
                  <tr
                    key={r.id}
                    className={i % 2 === 1 ? "bg-muted/30" : "bg-white"}
                  >
                    <td className="max-w-56 truncate py-3 pr-4 font-medium">
                      {r.task?.title ?? r.topic?.title ?? r.subject?.name}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: r.subject?.color ?? "#6B7280" }}
                        />
                        {r.subject?.name ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {shortDate.format(r.createdAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          "font-semibold " +
                          (r.difficulty >= 5 ? "text-danger" : "text-warning")
                        }
                      >
                        {r.difficulty} / 5
                      </span>
                    </td>
                    <td className="max-w-72 truncate py-3 pr-4 text-muted-foreground">
                      {r.whatWasHard || "—"}
                    </td>
                    <td className="py-3">
                      {r.needHelp ? (
                        <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
                          Нужна помощь
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
}