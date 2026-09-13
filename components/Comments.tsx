"use client";

import { AlertCircle, Loader2, Send } from "lucide-react";
import { useState } from "react";

type Comment = {
  id: number;
  text: string;
  createdAt: string;
  author: { id: number; fullName: string };
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(".", "");
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Comments({
  taskId,
  authorId,
  comments,
}: {
  taskId: number;
  authorId: number;
  comments: Comment[];
}) {
  const [list, setList] = useState(comments);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, authorId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Не удалось отправить комментарий");
        return;
      }
      setList((prev) => [data, ...prev]);
      setText("");
    } catch {
      setError("Не удалось отправить комментарий");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex items-start gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать комментарий…"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Отправить
        </button>
      </form>

      <div className="space-y-3">
        {list.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(c.author.fullName) || "?"}
                </span>
                <span className="truncate text-sm font-medium text-foreground">
                  {c.author.fullName}
                </span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(new Date(c.createdAt))}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">{c.text}</p>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground">Комментариев пока нет 💬</p>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}