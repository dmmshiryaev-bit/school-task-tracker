import { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "./prisma";

export const NotificationType = {
  TASK_CREATED: "task_created",
  TASK_STATUS_CHANGED: "task_status_changed",
  TASK_DONE: "task_done",
  REWARD_EARNED: "reward_earned",
  BADGE_EARNED: "badge_earned",
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  [NotificationType.TASK_CREATED]: "Задача",
  [NotificationType.TASK_STATUS_CHANGED]: "Статус",
  [NotificationType.TASK_DONE]: "Выполнено",
  [NotificationType.REWARD_EARNED]: "Баллы",
  [NotificationType.BADGE_EARNED]: "Бейдж",
};

const STATUS_LABELS: Record<string, string> = {
  [TaskStatus.BACKLOG]: "Запланировано",
  [TaskStatus.TODO]: "К выполнению",
  [TaskStatus.IN_PROGRESS]: "В работе",
  [TaskStatus.REVIEW]: "На проверке",
  [TaskStatus.DONE]: "Выполнено",
  [TaskStatus.REWORK]: "Нужно доработать",
  [TaskStatus.CANCELED]: "Отменено",
};

export type NotificationPayload = {
  taskTitle?: string;
  subjectName?: string;
  oldStatus?: string;
  newStatus?: string;
  points?: number;
  reason?: string;
  badgeName?: string;
  actorName?: string;
};

export function createNotification(
  userId: number,
  type: NotificationType,
  payload: NotificationPayload = {},
  taskId?: number
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      payload: payload as Prisma.InputJsonValue,
      taskId: taskId ?? null,
    },
  });
}

export function notificationToView(
  notification: {
    id: number;
    type: string;
    payload: Prisma.JsonValue;
    createdAt: Date;
    isRead: boolean;
  }
) {
  const payload = (notification.payload ?? {}) as NotificationPayload;
  let text = "";

  switch (notification.type) {
    case NotificationType.TASK_CREATED:
      text = `Новая задача «${payload.taskTitle ?? "Без названия"}» по предмету ${payload.subjectName ?? "—"}`;
      break;
    case NotificationType.TASK_STATUS_CHANGED:
      text = `Задача «${payload.taskTitle ?? "Без названия"}»: статус изменён на «${STATUS_LABELS[payload.newStatus ?? ""] ?? payload.newStatus ?? "—"}»`;
      break;
    case NotificationType.TASK_DONE:
      text = `Задача «${payload.taskTitle ?? "Без названия"}» выполнена`;
      break;
    case NotificationType.REWARD_EARNED:
      text = `Начислено ${payload.points ?? 0} баллов: ${payload.reason ?? "награда"}`;
      break;
    case NotificationType.BADGE_EARNED:
      text = `Получен бейдж «${payload.badgeName ?? "—"}»`;
      break;
    default:
      text = "Новое уведомление";
  }

  return {
    id: notification.id,
    type: notification.type,
    typeLabel: NOTIFICATION_TYPE_LABELS[notification.type] ?? "Уведомление",
    text,
    createdAt: notification.createdAt.toISOString(),
    isRead: notification.isRead,
  };
}