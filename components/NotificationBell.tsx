"use client";

import { AlertCircle, Bell, Check, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ViewNotification = {
  id: number;
  type: string;
  typeLabel: string;
  text: string;
  createdAt: string;
  isRead: boolean;
};

const TYPE_CHIP: Record<string, string> = {
  task_created: "bg-blue-100 text-blue-700",
  task_status_changed: "bg-violet-100 text-violet-700",
  task_done: "bg-green-100 text-green-700",
  reward_earned: "bg-amber-100 text-amber-700",
  badge_earned: "bg-pink-100 text-pink-700",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(d)
    .replace(".", "");
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ViewNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then((res) => res.json().catch(() => null))
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        } else {
          setError("Не удалось загрузить уведомления");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить уведомления");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function markRead(n: ViewNotification) {
    const prev = notifications;
    setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: n.id }),
      });
      if (!res.ok) {
        throw new Error();
      }
    } catch {
      setNotifications(prev);
    }
  }

  async function markAll() {
    const prev = notifications;
    setNotifications((list) => list.map((x) => ({ ...x, isRead: true })));
    try {
      const res = await fetch("/api/notifications/mark-all", { method: "POST" });
      if (!res.ok) {
        throw new Error();
      }
    } catch {
      setNotifications(prev);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Уведомления"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] origin-top-right rounded-xl bg-white p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 md:left-full md:right-auto md:ml-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <p className="text-sm font-semibold text-foreground">Уведомления</p>
            <span className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} непрочитанных` : "всё прочитано"}
            </span>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="space-y-3 py-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse space-y-2 rounded-lg bg-card p-3"
                  >
                    <div className="h-3 w-20 rounded bg-muted/50" />
                    <div className="h-3 w-full rounded bg-muted/50" />
                    <div className="h-2 w-24 rounded bg-muted/50" />
                  </div>
                ))}
              </div>
            )}
            {!loading && error && (
              <p className="flex items-center justify-center gap-2 py-6 text-center text-sm text-danger">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            {!loading && !error && notifications.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Нет новых уведомлений 🔔
              </p>
            )}
            {!loading &&
              !error &&
              notifications.map((n) => {
                const done = n.isRead;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 border-b border-border/60 py-3 ${
                      done ? "opacity-60" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            TYPE_CHIP[n.type] ?? "bg-primary/10 text-primary"
                          }`}
                        >
                          {n.typeLabel}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-snug text-foreground">{n.text}</p>
                    </div>
                    {!done && (
                      <button
                        type="button"
                        onClick={() => markRead(n)}
                        title="Отметить как прочитанное"
                        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
          </div>

          {!loading && notifications.length > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <CheckCheck className="h-4 w-4" />
              Отметить все как прочитанные
            </button>
          )}
        </div>
      )}
    </div>
  );
}