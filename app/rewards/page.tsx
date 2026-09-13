import {
  BookOpen,
  Clock,
  Flag,
  Medal,
  Plus,
  Shield,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "../../lib/prisma";

const BADGE_ICONS: Record<string, LucideIcon> = {
  trophy: Trophy,
  clock: Clock,
  book: BookOpen,
  flag: Flag,
  shield: Shield,
  star: Star,
  badge: Medal,
  medal: Medal,
};

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  trophy: { bg: "bg-amber-100", text: "text-amber-600" },
  clock: { bg: "bg-sky-100", text: "text-sky-600" },
  book: { bg: "bg-violet-100", text: "text-violet-600" },
  flag: { bg: "bg-emerald-100", text: "text-emerald-600" },
  shield: { bg: "bg-rose-100", text: "text-rose-600" },
  star: { bg: "bg-yellow-100", text: "text-yellow-600" },
  badge: { bg: "bg-indigo-100", text: "text-indigo-600" },
  medal: { bg: "bg-indigo-100", text: "text-indigo-600" },
};

const POINTS_PER_LEVEL = 100;

export default async function RewardsPage() {
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

  const [transactions, earnedUserBadges, allBadges, rules] =
    await Promise.all([
      prisma.rewardTransaction.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        include: { rule: { select: { name: true } } },
      }),
      prisma.userBadge.findMany({
        where: { userId: student.id },
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      }),
      prisma.badge.findMany({
        where: { isActive: true },
        orderBy: { id: "asc" },
      }),
      prisma.rewardRule.findMany({
        where: { isActive: true },
        orderBy: { points: "desc" },
      }),
    ]);

  const balance = transactions.reduce((sum, t) => sum + t.points, 0);
  const level = Math.floor(balance / POINTS_PER_LEVEL) + 1;
  const progressInLevel = balance % POINTS_PER_LEVEL;
  const pointsToNext = POINTS_PER_LEVEL - progressInLevel;

  const earnedBadgeIds = new Set(earnedUserBadges.map((u) => u.badgeId));
  const earnedBadges = earnedUserBadges.map((u) => u.badge);
  const availableBadges = allBadges.filter((b) => !earnedBadgeIds.has(b.id));

  const renderBadge = (
    badge: (typeof allBadges)[number],
    { earned }: { earned: boolean }
  ) => {
    const Icon = BADGE_ICONS[badge.icon] ?? Medal;
    return (
      <div
        key={badge.id}
        className={`flex flex-col items-center gap-3 rounded-xl border border-border/60 p-6 text-center shadow-sm transition-transform duration-200 hover:scale-105 ${
          earned ? "bg-white" : "bg-white grayscale"
        }`}
      >
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            earned
              ? (BADGE_COLORS[badge.icon] ?? BADGE_COLORS.badge).bg
              : "bg-muted"
          }`}
        >
          <Icon
            className={`h-8 w-8 ${
              earned
                ? (BADGE_COLORS[badge.icon] ?? BADGE_COLORS.badge).text
                : "text-muted-foreground"
            }`}
          />
        </span>
        <div>
          <p
            className={`font-semibold ${
              earned ? "" : "text-muted-foreground"
            }`}
          >
            {badge.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {earned ? badge.description : "Ещё не получен"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-amber-400" />
          <h1 className="text-2xl font-semibold">Мои награды</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Копи баллы и открывай бейджи, выполняя задания
        </p>
      </header>

      <div className="grid items-stretch gap-6 sm:grid-cols-2">
        <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Баланс баллов</p>
            <Trophy className="h-6 w-6 text-amber-400" />
          </div>
          <p className="mt-3 text-5xl font-bold text-primary">{balance}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            до следующего уровня: {pointsToNext} баллов
          </p>
        </div>

        <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Уровень</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-semibold">{level}</p>
            <p className="text-sm text-muted-foreground">
              {progressInLevel} из {POINTS_PER_LEVEL} баллов
            </p>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-primary via-primary to-amber-400"
              style={{ width: `${progressInLevel}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            Уровень {level} — каждые {POINTS_PER_LEVEL} баллов
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Полученные бейджи</h2>
        {earnedBadges.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Пока нет полученных бейджей — выполняй задания, чтобы их открыть.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {earnedBadges.map((badge) => renderBadge(badge, { earned: true }))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Доступные бейджи</h2>
        {availableBadges.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Все бейджи уже получены!
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableBadges.map((badge) => renderBadge(badge, { earned: false }))}
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Как получать баллы</h2>
        <ul className="mt-4 divide-y divide-border">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div>
                <p className="font-medium">{rule.name}</p>
                <p className="text-xs text-muted-foreground">
                  {rule.description}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <Plus className="h-3.5 w-3.5" />
                {rule.points}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}