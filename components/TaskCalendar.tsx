"use client";

import { TaskStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef, useState } from "react";

export interface CalendarTask {
  id: number;
  title: string;
  dueDate: string;
  status: TaskStatus;
  subject: { name: string; color: string };
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG: "Бэклог",
  TODO: "К выполнению",
  IN_PROGRESS: "В работе",
  REVIEW: "На проверке",
  DONE: "Выполнено",
  REWORK: "На доработке",
  CANCELED: "Отменено",
};

const STATUS_CHIP: Record<TaskStatus, string> = {
  BACKLOG: "bg-muted text-muted-foreground",
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-sky-100 text-sky-600",
  REVIEW: "bg-violet-100 text-violet-600",
  DONE: "bg-emerald-100 text-emerald-600",
  REWORK: "bg-orange-100 text-orange-600",
  CANCELED: "bg-muted text-muted-foreground",
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const MONTH_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
  year: "numeric",
});

const DAY_LABEL = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});

const DAY_LABEL_SHORT = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  weekday: "short",
});

function pluralTasks(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "задача";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "задачи";
  return "задач";
}

export default function TaskCalendar({ tasks }: { tasks: CalendarTask[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const byDay = new Map<string, CalendarTask[]>();
  for (const task of tasks) {
    const key = keyOf(new Date(task.dueDate));
    const list = byDay.get(key) ?? [];
    list.push(task);
    byDay.set(key, list);
  }

  const first = new Date(cursor.y, cursor.m, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const prevDaysInMonth = new Date(cursor.y, cursor.m, 0).getDate();

  const cells: { day: number; date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < startWeekday; i++) {
    const day = prevDaysInMonth - startWeekday + i + 1;
    cells.push({
      day,
      date: new Date(cursor.y, cursor.m - 1, day),
      inMonth: false,
    });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, date: new Date(cursor.y, cursor.m, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const next = cells.length - startWeekday - daysInMonth + 1;
    cells.push({
      day: next,
      date: new Date(cursor.y, cursor.m + 1, next),
      inMonth: false,
    });
  }

  const todayKey = keyOf(today);
  const monthLabel = MONTH_FORMAT.format(first).replace(/ г\.$/, "");

  const changeMonth = (to: { y: number; m: number }) => {
    setCursor(to);
    setSelectedDate(null);
  };
  const prev = () =>
    changeMonth(
      cursor.m === 0 ? { y: cursor.y - 1, m: 11 } : { y: cursor.y, m: cursor.m - 1 }
    );
  const next = () =>
    changeMonth(
      cursor.m === 11 ? { y: cursor.y + 1, m: 0 } : { y: cursor.y, m: cursor.m + 1 }
    );
  const goToday = () => {
    setCursor({ y: today.getFullYear(), m: today.getMonth() });
    setSelectedDate(null);
  };

  const selectDate = (key: string) => {
    setSelectedDate(key);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      requestAnimationFrame(() =>
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  };

  const resetSelection = () => setSelectedDate(null);

  const dayTasks: { key: string; label: string; tasks: CalendarTask[] }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const key = keyOf(new Date(cursor.y, cursor.m, day));
    const dateTasks = byDay.get(key);
    if (dateTasks && dateTasks.length) {
      dayTasks.push({
        key,
        label: DAY_LABEL_SHORT.format(new Date(cursor.y, cursor.m, day)),
        tasks: dateTasks,
      });
    }
  }

  const selectedTasks = selectedDate ? (byDay.get(selectedDate) ?? []) : null;
  const selectedLabel = selectedDate
    ? DAY_LABEL.format(new Date(selectedDate + "T00:00:00"))
    : null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="min-w-0 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
            <button
              type="button"
              onClick={goToday}
              className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              Сегодня
            </button>
          </div>
          <button
            type="button"
            onClick={next}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Следующий месяц"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="rounded-lg bg-muted/60 py-1.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {w}
            </div>
          ))}

          {cells.map((cell, idx) => {
            const key = keyOf(cell.date);
            const tasksForDay = byDay.get(key);
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            const hasTasks = !!tasksForDay && tasksForDay.length > 0;
            const tooltip = hasTasks
              ? `${tasksForDay.length} ${pluralTasks(tasksForDay.length)}: ${tasksForDay
                  .slice(0, 4)
                  .map((t) => t.title)
                  .join(", ")}${tasksForDay.length > 4 ? "…" : ""}`
              : undefined;

            const cellClasses = [
              "flex",
              "min-h-[100px]",
              "w-full",
              "flex-col",
              "items-center",
              "gap-1",
              "rounded-lg",
              "border",
              "p-1.5",
              "transition-colors",
              "cursor-pointer",
              "hover:bg-muted/50",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-primary",
            ];
            if (isSelected) {
              cellClasses.push("border-primary bg-primary/10 ring-2 ring-primary");
            } else if (isToday) {
              cellClasses.push("border-primary/50 bg-primary/5 ring-2 ring-primary");
            } else if (cell.inMonth) {
              cellClasses.push(
                hasTasks ? "border-border bg-card" : "border-border bg-muted/40"
              );
            } else {
              cellClasses.push("border-border bg-muted/20 opacity-40");
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => selectDate(key)}
                title={tooltip}
                aria-pressed={isSelected}
                aria-label={DAY_LABEL_SHORT.format(cell.date)}
                className={cellClasses.join(" ")}
              >
                <span
                  className={`text-sm ${
                    isToday ? "font-semibold text-primary" : ""
                  } ${cell.inMonth ? "" : "text-muted-foreground"}`}
                >
                  {cell.day}
                </span>
                {tasksForDay && tasksForDay.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {tasksForDay.slice(0, 4).map((t) => (
                      <span
                        key={t.id}
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: t.subject.color }}
                      />
                    ))}
                    {tasksForDay.length > 4 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{tasksForDay.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={listRef} className="min-w-0 scroll-mt-20 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {selectedLabel ? `Задачи на ${selectedLabel}` : "Все задачи месяца"}
          </h2>
          {selectedDate && (
            <button
              type="button"
              onClick={resetSelection}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Сбросить
            </button>
          )}
        </div>

        {selectedTasks ? (
          <div
            key={selectedDate}
            className="mt-2 animate-in fade-in duration-200"
          >
            {selectedTasks.length === 0 ? (
              <p className="mt-4 text-muted-foreground">
                В этот день задач нет
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {selectedTasks.map((task) => {
                  const overdue =
                    new Date(task.dueDate) < todayStart &&
                    task.status !== TaskStatus.DONE &&
                    task.status !== TaskStatus.CANCELED;
                  return (
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
                          <p
                            className={`truncate font-medium ${
                              overdue ? "text-danger" : ""
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {task.subject.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {overdue && (
                          <span className="text-xs font-medium text-danger">
                            Просрочено
                          </span>
                        )}
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            STATUS_CHIP[task.status]
                          }`}
                        >
                          {STATUS_LABEL[task.status]}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : dayTasks.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            В этом месяце задач нет
          </p>
        ) : (
          <div key="all" className="mt-2 space-y-6">
            {dayTasks.map((group) => (
              <div key={group.key}>
                <h3 className="font-medium capitalize">{group.label}</h3>
                <ul className="mt-2 divide-y divide-border">
                  {group.tasks.map((task) => {
                    const overdue =
                      new Date(task.dueDate) < todayStart &&
                      task.status !== TaskStatus.DONE &&
                      task.status !== TaskStatus.CANCELED;
                    return (
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
                            <p
                              className={`truncate font-medium ${
                                overdue ? "text-danger" : ""
                              }`}
                            >
                              {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {task.subject.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {overdue && (
                            <span className="text-xs font-medium text-danger">
                              Просрочено
                            </span>
                          )}
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              STATUS_CHIP[task.status]
                            }`}
                          >
                            {STATUS_LABEL[task.status]}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}