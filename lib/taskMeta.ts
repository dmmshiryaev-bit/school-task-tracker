import { Priority, Role, TaskStatus } from "@prisma/client";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "Запланировано",
  [TaskStatus.TODO]: "К выполнению",
  [TaskStatus.IN_PROGRESS]: "В работе",
  [TaskStatus.REVIEW]: "На проверке",
  [TaskStatus.DONE]: "Выполнено",
  [TaskStatus.REWORK]: "Нужно доработать",
  [TaskStatus.CANCELED]: "Отменено",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "bg-gray-100 text-gray-700",
  [TaskStatus.TODO]: "bg-blue-100 text-blue-700",
  [TaskStatus.IN_PROGRESS]: "bg-amber-100 text-amber-700",
  [TaskStatus.REVIEW]: "bg-violet-100 text-violet-700",
  [TaskStatus.DONE]: "bg-green-100 text-green-700",
  [TaskStatus.REWORK]: "bg-rose-100 text-rose-700",
  [TaskStatus.CANCELED]: "bg-neutral-100 text-neutral-500",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: "Низкий",
  [Priority.MEDIUM]: "Средний",
  [Priority.HIGH]: "Высокий",
  [Priority.URGENT]: "Срочный",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.LOW]: "bg-slate-100 text-slate-600",
  [Priority.MEDIUM]: "bg-amber-100 text-amber-700",
  [Priority.HIGH]: "bg-orange-100 text-orange-700",
  [Priority.URGENT]: "bg-red-100 text-red-700",
};

export const TRANSITION_LABELS: Partial<Record<TaskStatus, string>> = {
  [TaskStatus.IN_PROGRESS]: "В работу",
  [TaskStatus.REVIEW]: "На проверку",
  [TaskStatus.TODO]: "К выполнению",
  [TaskStatus.CANCELED]: "Отменить",
  [TaskStatus.REWORK]: "Нужно доработать",
  [TaskStatus.DONE]: "Выполнено",
  [TaskStatus.BACKLOG]: "Запланировать",
};

export const TRANSITION_ORDER: TaskStatus[] = [
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.TODO,
  TaskStatus.CANCELED,
  TaskStatus.REWORK,
  TaskStatus.DONE,
];

const TRANSITION_MATRIX: Record<TaskStatus, Partial<Record<Role, TaskStatus[]>>> = {
  [TaskStatus.BACKLOG]: {
    [Role.TEACHER]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.CANCELED],
    [Role.ADMIN]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.CANCELED],
  },
  [TaskStatus.TODO]: {
    [Role.TEACHER]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELED],
    [Role.STUDENT]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELED],
    [Role.ADMIN]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELED],
  },
  [TaskStatus.IN_PROGRESS]: {
    [Role.STUDENT]: [TaskStatus.REVIEW, TaskStatus.TODO, TaskStatus.CANCELED],
    [Role.TEACHER]: [TaskStatus.REVIEW, TaskStatus.TODO, TaskStatus.CANCELED],
    [Role.ADMIN]: [TaskStatus.REVIEW, TaskStatus.TODO, TaskStatus.CANCELED],
  },
  [TaskStatus.REVIEW]: {
    [Role.TEACHER]: [TaskStatus.DONE, TaskStatus.REWORK, TaskStatus.IN_PROGRESS],
    [Role.ADMIN]: [TaskStatus.DONE, TaskStatus.REWORK, TaskStatus.IN_PROGRESS],
  },
  [TaskStatus.REWORK]: {
    [Role.STUDENT]: [TaskStatus.IN_PROGRESS, TaskStatus.TODO],
    [Role.TEACHER]: [TaskStatus.IN_PROGRESS, TaskStatus.TODO],
    [Role.ADMIN]: [TaskStatus.IN_PROGRESS, TaskStatus.TODO],
  },
  [TaskStatus.DONE]: {
    [Role.TEACHER]: [TaskStatus.REWORK, TaskStatus.IN_PROGRESS],
    [Role.ADMIN]: [TaskStatus.REWORK, TaskStatus.IN_PROGRESS],
  },
  [TaskStatus.CANCELED]: {
    [Role.TEACHER]: [TaskStatus.TODO],
    [Role.ADMIN]: [TaskStatus.TODO],
  },
};

export function allowedTransitions(status: TaskStatus, role: Role): TaskStatus[] {
  return TRANSITION_MATRIX[status]?.[role] ?? [];
}

export function rowTargets(status: TaskStatus): TaskStatus[] {
  const row = TRANSITION_MATRIX[status] ?? {};
  const unique = new Set<TaskStatus>();
  Object.values(row).forEach((targets) => targets.forEach((t) => unique.add(t)));
  return [...unique].sort(
    (a, b) => TRANSITION_ORDER.indexOf(a) - TRANSITION_ORDER.indexOf(b)
  );
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  })
    .format(date)
    .replace(".", "");
}