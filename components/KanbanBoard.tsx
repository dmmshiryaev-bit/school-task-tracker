"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Prisma, TaskStatus } from "@prisma/client";
import ReflectionModal from "./ReflectionModal";
import TaskCard, { type ChecklistProgress } from "./TaskCard";

export type BoardTask = Prisma.TaskGetPayload<{
  include: { subject: true; checklistItems: true };
}>;

type Column = {
  status: TaskStatus;
  title: string;
  dot: string;
};

const columns: Column[] = [
  { status: TaskStatus.TODO, title: "К выполнению", dot: "#6B7280" },
  { status: TaskStatus.IN_PROGRESS, title: "В работе", dot: "#4F46E5" },
  { status: TaskStatus.REVIEW, title: "На проверке", dot: "#D97706" },
  { status: TaskStatus.DONE, title: "Выполнено", dot: "#16A34A" },
  { status: TaskStatus.REWORK, title: "Нужно доработать", dot: "#DC2626" },
];

type KanbanBoardProps = {
  tasks: BoardTask[];
  currentUserId: number;
};

export default function KanbanBoard({
  tasks,
  currentUserId,
}: KanbanBoardProps) {
  const [boardTasks, setBoardTasks] = useState<BoardTask[]>(tasks);
  const [dragOrigin, setDragOrigin] = useState<{
    id: number;
    from: TaskStatus;
  } | null>(null);
  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reflectTaskId, setReflectTaskId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function resolveStatus(
    id: number | string | null | undefined
  ): TaskStatus | null {
    if (id == null) return null;
    if (typeof id === "string") {
      return Object.values(TaskStatus).includes(id as TaskStatus)
        ? (id as TaskStatus)
        : null;
    }
    const task = boardTasks.find((t) => t.id === id);
    return task ? task.status : null;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as number;
    const task = boardTasks.find((t) => t.id === id);
    if (task) setDragOrigin({ id, from: task.status });
    setActiveColumn(null);
    setError(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const from = resolveStatus(event.active.id);
    const to = resolveStatus(event.over ? event.over.id : null);
    if (to) setActiveColumn(to);
    if (from && to && from !== to) {
      setBoardTasks((prev) =>
        prev.map((t) =>
          t.id === event.active.id ? { ...t, status: to as TaskStatus } : t
        )
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const id = event.active.id as number;
    const origin = dragOrigin;
    setDragOrigin(null);
    setActiveColumn(null);

    const task = boardTasks.find((t) => t.id === id);
    if (!task) return;

    const target = resolveStatus(event.over ? event.over.id : null) ?? task.status;

    if (origin && target === origin.from) return;

    if (target !== task.status) {
      setBoardTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: target } : t))
      );
    }

    try {
      const res = await fetch(`/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(currentUserId),
        },
        body: JSON.stringify({ status: target }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Не удалось обновить статус");
        revert(id, origin?.from);
      }
    } catch {
      setError("Не удалось обновить статус");
      revert(id, origin?.from);
    }
  }

  function revert(id: number, from?: TaskStatus) {
    if (from) {
      setBoardTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: from } : t))
      );
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-flow-col auto-cols-[280px] gap-4 overflow-x-auto pb-2 md:grid-flow-row md:auto-cols-fr md:grid-cols-5 md:overflow-visible md:pb-0">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              column={column}
              tasks={boardTasks.filter(
                (task) => task.status === column.status
              )}
              isActive={activeColumn === column.status}
              onReflectTask={setReflectTaskId}
            />
          ))}
        </div>
      </DndContext>

      <ReflectionModal
        key={reflectTaskId ?? "none"}
        taskId={reflectTaskId ?? 0}
        isOpen={reflectTaskId !== null}
        onClose={() => setReflectTaskId(null)}
      />
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  isActive,
  onReflectTask,
}: {
  column: Column;
  tasks: BoardTask[];
  isActive: boolean;
  onReflectTask: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[400px] flex-col rounded-xl bg-muted/50 p-3 transition-shadow ${
        isOver || isActive ? "ring-2 ring-primary/50" : ""
      }`}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: column.dot }}
          />
          <h2 className="text-sm font-semibold">{column.title}</h2>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </header>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-3">
          {tasks.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              Нет задач
            </p>
          ) : (
            tasks.map((task) => {
              const progress: ChecklistProgress = {
                done: task.checklistItems.filter((item) => item.isDone).length,
                total: task.checklistItems.length,
              };

              return (
                <TaskCard
                  key={task.id}
                  taskId={task.id}
                  title={task.title}
                  subject={{
                    name: task.subject.name,
                    color: task.subject.color,
                  }}
                  dueDate={task.dueDate}
                  priority={task.priority}
                  status={task.status}
                  checklistProgress={progress}
                  overdue={isOverdue(task)}
                  onReflect={
                    task.status === TaskStatus.DONE
                      ? () => onReflectTask(task.id)
                      : undefined
                  }
                />
              );
            })
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function isOverdue(task: BoardTask): boolean {
  if (!task.dueDate) return false;
  if (task.status === TaskStatus.DONE || task.status === TaskStatus.CANCELED) {
    return false;
  }
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return task.dueDate < startOfToday;
}