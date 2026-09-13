import {
  Activity,
  ArrowLeft,
  ArrowLeftRight,
  CalendarDays,
  CheckSquare,
  Clock,
  ListTodo,
  MessageSquare,
  PenLine,
  PlusCircle,
  type LucideIcon,
} from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Checklist from "../../../components/Checklist";
import Comments from "../../../components/Comments";
import ReflectionButton from "../../../components/ReflectionButton";
import TaskActions, { TransitionOption } from "../../../components/TaskActions";
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  TRANSITION_LABELS,
  allowedTransitions,
  formatShortDate,
  rowTargets,
} from "../../../lib/taskMeta";
import { prisma } from "../../../lib/prisma";

function activityText(actor: string, action: string, oldValue: string | null, newValue: string | null) {
  switch (action) {
    case "status_changed":
      return `${actor} изменил статус с «${STATUS_LABELS[oldValue as keyof typeof STATUS_LABELS] ?? oldValue}» на «${STATUS_LABELS[newValue as keyof typeof STATUS_LABELS] ?? newValue}»`;
    case "comment_added":
      return `${actor} добавил комментарий`;
    case "task_created":
      return `${actor} создал задачу`;
    case "task_updated":
      return `${actor} изменил задачу`;
    default:
      return `${actor} ${action.replace(/_/g, " ")}`;
  }
}

function activityIcon(action: string): LucideIcon {
  switch (action) {
    case "status_changed":
      return ArrowLeftRight;
    case "comment_added":
      return MessageSquare;
    case "task_created":
      return PlusCircle;
    case "task_updated":
      return PenLine;
    default:
      return Activity;
  }
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) {
    notFound();
  }

  const [task, student, activityLogs] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        checklistItems: { orderBy: { sortOrder: "asc" } },
        comments: {
          take: 50,
          where: { isDeleted: false },
          include: { author: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.findFirst({ where: { role: "STUDENT" } }),
    prisma.activityLog.findMany({
      where: { entityType: "Task", entityId: taskId },
      take: 50,
      include: { actor: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!task || !student || task.studentId !== student.id) {
    notFound();
  }

  const role = student.role;
  const allowed = new Set(allowedTransitions(task.status, role));
  const transitions: TransitionOption[] = rowTargets(task.status).map((target) => ({
    status: target,
    label: TRANSITION_LABELS[target] ?? STATUS_LABELS[target],
    locked: !allowed.has(target),
  }));

  const subjectColor = task.subject.color;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isOverdue =
    !!task.dueDate &&
    task.dueDate < todayStart &&
    task.status !== "DONE" &&
    task.status !== "CANCELED";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/tasks/kanban"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        К доске задач
      </Link>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ backgroundColor: `${subjectColor}1A`, color: subjectColor }}
              >
                {task.subject.name}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                {STATUS_LABELS[task.status]}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                {PRIORITY_LABELS[task.priority]}
              </span>
              {task.dueDate && (
                <span
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    isOverdue
                      ? "border-danger/40 bg-danger/10 text-danger"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatShortDate(new Date(task.dueDate))}
                  {isOverdue && <span className="font-semibold">Просрочено</span>}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <ListTodo className="h-4 w-4 text-primary" />
              Описание
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {task.description || "Описание не добавлено 📝"}
            </p>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <CheckSquare className="h-4 w-4 text-primary" />
              Чек-лист
            </h2>
            <Checklist taskId={task.id} items={task.checklistItems} />
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              Комментарии
            </h2>
            <Comments
              taskId={task.id}
              authorId={student.id}
              comments={task.comments.map((c) => ({
                ...c,
                createdAt: c.createdAt.toISOString(),
              }))}
            />
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <Activity className="h-4 w-4 text-primary" />
              История изменений
            </h2>
            {activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                История пока пуста ✨
              </p>
            ) : (
              <div>
                {activityLogs.map((log, idx) => {
                  const Icon = activityIcon(log.action);
                  const isLast = idx === activityLogs.length - 1;
                  return (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center self-stretch">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        {!isLast && (
                          <span className="mt-1 w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="mb-4 min-w-0 flex-1 pt-1">
                        <p className="text-sm text-foreground">
                          {activityText(
                            log.actor.fullName,
                            log.action,
                            log.oldValue,
                            log.newValue
                          )}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {log.actor.fullName} · {formatShortDate(new Date(log.createdAt))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Изменить статус
            </h2>
            <ReflectionButton taskId={task.id} status={task.status} />
          </div>
          <TaskActions
            taskId={task.id}
            statusLabel={STATUS_LABELS[task.status]}
            actorId={student.id}
            transitions={transitions}
          />
        </div>
      </div>
    </div>
  );
}