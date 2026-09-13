"use client";

import { AlertCircle, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type TransitionOption = {
  status: string;
  label: string;
  locked: boolean;
};

export default function TaskActions({
  taskId,
  statusLabel,
  actorId,
  transitions,
}: {
  taskId: number;
  statusLabel: string;
  actorId: number;
  transitions: TransitionOption[];
}) {
  const router = useRouter();
  const [busyTo, setBusyTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function move(status: string) {
    if (busyTo) return;
    setBusyTo(status);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(actorId),
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Не удалось изменить статус");
        return;
      }
      router.refresh();
    } catch {
      setError("Не удалось изменить статус");
    } finally {
      setBusyTo(null);
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Текущий статус: <span className="font-medium text-foreground">{statusLabel}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        {transitions.map((t) => (
          <button
            key={t.status}
            type="button"
            disabled={t.locked || busyTo !== null}
            onClick={() => move(t.status)}
            title={t.locked ? "Доступно только учителю" : undefined}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
              t.locked
                ? "border-border bg-muted/40 text-muted-foreground disabled:opacity-60"
                : "border-border bg-card text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
            }`}
          >
            {t.locked && <Lock className="h-3.5 w-3.5" />}
            {busyTo === t.status ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t.label
            )}
          </button>
        ))}
        {transitions.length === 0 && (
          <p className="text-sm text-muted-foreground">Нет доступных переходов</p>
        )}
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}