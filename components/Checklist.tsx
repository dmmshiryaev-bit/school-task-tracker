"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useState } from "react";

type ChecklistItem = {
  id: number;
  text: string;
  isDone: boolean;
};

export default function Checklist({
  taskId,
  items,
}: {
  taskId: number;
  items: ChecklistItem[];
}) {
  const [list, setList] = useState(items);
  const [busyIds, setBusyIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const doneCount = list.filter((i) => i.isDone).length;
  const total = list.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  async function toggle(item: ChecklistItem) {
    if (busyIds.includes(item.id)) return;

    const prev = list;
    const next = list.map((i) => (i.id === item.id ? { ...i, isDone: !i.isDone } : i));
    setList(next);
    setBusyIds((ids) => [...ids, item.id]);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, isDone: !item.isDone }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.items) {
        setList(prev);
        setError(data?.error ?? "Не удалось обновить чек-лист");
        return;
      }
      setList(data.items);
    } catch {
      setList(prev);
      setError("Не удалось обновить чек-лист");
    } finally {
      setBusyIds((ids) => ids.filter((id) => id !== item.id));
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-medium text-muted-foreground">
          {doneCount}/{total} выполнено
        </span>
      </div>

      <div className="space-y-2">
        {list.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/50"
          >
            <input
              type="checkbox"
              checked={item.isDone}
              onChange={() => toggle(item)}
              className="peer sr-only"
            />
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                item.isDone
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-transparent"
              }`}
            >
              {busyIds.includes(item.id) ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
            <span
              className={`text-sm ${
                item.isDone ? "text-muted-foreground line-through" : "text-foreground"
              }`}
            >
              {item.text}
            </span>
          </label>
        ))}
        {total === 0 && (
          <p className="text-sm text-muted-foreground">Чек-лист пуст 📝</p>
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