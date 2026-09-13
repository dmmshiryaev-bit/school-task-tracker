"use client";

import type { CSSProperties } from "react";
import { TaskStatus, type Priority } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Minus,
  CalendarDays,
  CheckCircle2,
  Circle,
  MessageSquare,
} from "lucide-react";

export type SubjectSummary = {
  name: string;
  color: string;
};

export type ChecklistProgress = {
  done: number;
  total: number;
};

type TaskCardProps = {
  taskId: number;
  title: string;
  subject: SubjectSummary;
  dueDate: Date | null;
  priority: Priority;
  status: TaskStatus;
  checklistProgress: ChecklistProgress;
  overdue?: boolean;
  onReflect?: () => void;
};

type PriorityMeta = {
  icon: LucideIcon;
  label: string;
  className: string;
};

const priorityMeta: Record<Priority, PriorityMeta> = {
  URGENT: { icon: AlertTriangle, label: "Срочно", className: "text-danger" },
  HIGH: { icon: ChevronUp, label: "Высокий", className: "text-warning" },
  MEDIUM: { icon: Minus, label: "Средний", className: "text-muted-foreground" },
  LOW: { icon: ChevronDown, label: "Низкий", className: "text-muted-foreground" },
};

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
});

export default function TaskCard({
  taskId,
  title,
  subject,
  dueDate,
  priority,
  status,
  checklistProgress,
  overdue = false,
  onReflect,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: taskId });

  const draggableAttributes = Object.fromEntries(
    Object.entries(attributes).filter(([key]) => key !== "aria-describedby")
  ) as typeof attributes;

  const meta = priorityMeta[priority];
  const PriorityIcon = meta.icon;
  const dueLabel = dueDate ? dateFormat.format(dueDate) : null;
  const checklistDone = checklistProgress.done === checklistProgress.total;

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.5 : 1,
    borderLeft: `4px solid ${subject.color}`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...draggableAttributes}
      {...listeners}
      className={`touch-none rounded-lg bg-white p-4 shadow-sm ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {title}
        </h3>
        <PriorityIcon
          className={`h-4 w-4 shrink-0 ${meta.className}`}
          aria-label={meta.label}
        />
      </div>

      <p className="mt-1 text-xs text-muted-foreground">{subject.name}</p>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span
          className={`flex items-center gap-1 ${
            overdue ? "font-medium text-danger" : "text-muted-foreground"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {dueLabel ?? "Без срока"}
        </span>

        {checklistProgress.total > 0 && (
          <span className="flex items-center gap-1 text-muted-foreground">
            {checklistDone ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            {checklistProgress.done}/{checklistProgress.total}
          </span>
        )}
      </div>

      {status === TaskStatus.DONE && onReflect && (
        <button
          type="button"
          onClick={onReflect}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Рефлексия
        </button>
      )}
    </div>
  );
}