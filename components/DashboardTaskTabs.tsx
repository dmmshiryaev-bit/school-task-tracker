"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type DashboardTaskRow = {
  id: number;
  title: string;
  subject: { name: string; color: string };
  dueDate: string | null;
  dueTime: string | null;
};

type DashboardTaskTabsProps = {
  todayTasks: DashboardTaskRow[];
  upcomingTasks: DashboardTaskRow[];
};

const dayMonth = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});

function TaskRow({ task }: { task: DashboardTaskRow }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: task.subject.color }}
        />
        <div className="min-w-0">
          <p className="truncate font-medium">{task.title}</p>
          <p className="text-xs text-muted-foreground">{task.subject.name}</p>
        </div>
      </div>
      <span className="shrink-0 text-sm text-muted-foreground">
        {task.dueTime
          ? `до ${task.dueTime}`
          : task.dueDate
            ? dayMonth.format(new Date(task.dueDate))
            : ""}
      </span>
    </li>
  );
}

export default function DashboardTaskTabs({
  todayTasks,
  upcomingTasks,
}: DashboardTaskTabsProps) {
  const [tab, setTab] = useState<"today" | "upcoming">("today");
  const current = tab === "today" ? todayTasks : upcomingTasks;

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("today")}
          className={cn(
            "-mb-px border-b-2 pb-2 text-sm font-medium transition-colors",
            tab === "today"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Сегодня ({todayTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={cn(
            "-mb-px border-b-2 pb-2 text-sm font-medium transition-colors",
            tab === "upcoming"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Предстоящие ({upcomingTasks.length})
        </button>
      </div>

      {current.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          {tab === "today"
            ? "На сегодня задач нет. Отдыхай! 🌟"
            : "Предстоящих задач нет"}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {current.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </section>
  );
}