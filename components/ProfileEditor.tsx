"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

type NotificationKeys = "newTasksEmail" | "deadlineReminders" | "rewardsNotifications";

const NOTIFICATIONS: { key: NotificationKeys; label: string }[] = [
  { key: "newTasksEmail", label: "Email-уведомления о новых задачах" },
  { key: "deadlineReminders", label: "Напоминания о дедлайнах" },
  { key: "rewardsNotifications", label: "Уведомления о наградах" },
];

type Props = {
  fullName: string;
  email: string;
  roleLabel: string;
  grade: number | null;
  parentName: string | null;
  initialNotifications: Record<string, boolean> | null;
};

type Flash = { type: "success" | "error"; text: string } | null;

function FlashMessage({ flash }: { flash: Flash }) {
  if (!flash) return null;
  return (
    <p
      className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
        flash.type === "success" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
      }`}
    >
      {flash.type === "success" && <CheckCircle2 className="h-4 w-4" />}
      {flash.text}
    </p>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function ProfileEditor({
  fullName,
  email,
  roleLabel,
  grade,
  parentName,
  initialNotifications,
}: Props) {
  const [name, setName] = useState(fullName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameFlash, setNameFlash] = useState<Flash>(null);

  const [notifications, setNotifications] = useState({
    newTasksEmail: initialNotifications?.newTasksEmail ?? true,
    deadlineReminders: initialNotifications?.deadlineReminders ?? true,
    rewardsNotifications: initialNotifications?.rewardsNotifications ?? true,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifFlash, setNotifFlash] = useState<Flash>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passFlash, setPassFlash] = useState<Flash>(null);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === fullName || nameSaving) return;
    setNameSaving(true);
    setNameFlash(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNameFlash({ type: "error", text: data?.error ?? "Не удалось сохранить" });
        return;
      }
      setNameFlash({ type: "success", text: "Имя обновлено" });
    } catch {
      setNameFlash({ type: "error", text: "Не удалось сохранить" });
    } finally {
      setNameSaving(false);
    }
  }

  async function saveNotifications(next: typeof notifications) {
    setNotifSaving(true);
    setNotifFlash(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationSettings: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNotifFlash({ type: "error", text: data?.error ?? "Не удалось сохранить настройки" });
      }
    } catch {
      setNotifFlash({ type: "error", text: "Не удалось сохранить настройки" });
    } finally {
      setNotifSaving(false);
    }
  }

  function toggle(key: NotificationKeys) {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    void saveNotifications(next);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordBusy) return;
    if (newPassword.length < 8) {
      setPassFlash({ type: "error", text: "Новый пароль должен быть не короче 8 символов" });
      return;
    }
    setPassFlash(null);
    setPasswordBusy(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPassFlash({ type: "error", text: data?.error ?? "Не удалось сменить пароль" });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setPassFlash({ type: "success", text: "Пароль обновлён" });
    } catch {
      setPassFlash({ type: "error", text: "Не удалось сменить пароль" });
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
            Д
          </div>
          <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="display-name" className="text-sm font-medium text-muted-foreground">
                Имя
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="display-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={saveName}
                  disabled={nameSaving || !name.trim() || name.trim() === fullName}
                  className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {nameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="mt-1 text-sm text-foreground">{email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Роль</p>
              <p className="mt-1 text-sm capitalize text-foreground">{roleLabel}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Класс</p>
              <p className="mt-1 text-sm text-foreground">{grade ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Родитель</p>
              <p className="mt-1 text-sm text-foreground">{parentName ?? "—"}</p>
            </div>
          </div>
        </div>
        <FlashMessage flash={nameFlash} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Настройки уведомлений</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Выберите, какие уведомления вы хотите получать
            </p>
          </div>
          {notifSaving && <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="mt-4 space-y-3">
          {NOTIFICATIONS.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className="text-sm font-medium text-foreground">{label}</span>
              <Toggle on={notifications[key]} onClick={() => toggle(key)} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Изменения сохраняются после переключения
        </p>
        <FlashMessage flash={notifFlash} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Смена пароля</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Укажите текущий пароль и новый пароль (минимум 8 символов)
        </p>
        <form onSubmit={changePassword} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="current-password" className="text-sm font-medium text-muted-foreground">
              Текущий пароль
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="text-sm font-medium text-muted-foreground">
              Новый пароль
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={passwordBusy || !currentPassword || !newPassword}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {passwordBusy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Сменить пароль"}
            </button>
          </div>
        </form>
        <FlashMessage flash={passFlash} />
      </div>
    </>
  );
}