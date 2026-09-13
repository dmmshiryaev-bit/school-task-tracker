"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

const DIFFICULTY_OPTIONS = [
  { value: 1, emoji: "😊", label: "Легко" },
  { value: 2, emoji: "🙂", label: "Нормально" },
  { value: 3, emoji: "😐", label: "Средне" },
  { value: 4, emoji: "😟", label: "Сложно" },
  { value: 5, emoji: "🤯", label: "Очень сложно" },
];

const QUICK_TAGS = [
  "Понятно",
  "Нужно больше примеров",
  "Запутался",
  "Интересно",
];

type ReflectionModalProps = {
  taskId: number;
  isOpen: boolean;
  onClose: () => void;
};

export default function ReflectionModal({
  taskId,
  isOpen,
  onClose,
}: ReflectionModalProps) {
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [whatWasEasy, setWhatWasEasy] = useState("");
  const [whatWasHard, setWhatWasHard] = useState("");
  const [needHelp, setNeedHelp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [submitted, onClose]);

  if (!isOpen) return null;

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (difficulty === null || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          difficulty,
          whatWasEasy: whatWasEasy.trim(),
          whatWasHard: whatWasHard.trim(),
          needHelp,
          tags,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Не удалось отправить рефлексию");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setNewBalance(data.balanceAfter);
    } catch {
      setError("Не удалось отправить рефлексию");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Рефлексия"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Sparkles className="h-10 w-10 text-amber-500" />
            <span className="animate-bounce text-4xl font-bold text-success">
              +{newBalance !== null ? 3 : ""} балла
            </span>
            <p className="text-lg font-semibold">Спасибо за рефлексию!</p>
            <p className="text-sm text-muted-foreground">
              {newBalance !== null
                ? `Твой баланс: ${newBalance} баллов`
                : "Баллы начислены"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Как прошло? 🤔</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium">Насколько было сложно?</p>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDifficulty(option.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${
                      difficulty === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span
                      className={`text-center text-[11px] leading-tight ${
                        difficulty === option.value
                          ? "font-semibold text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium">Как прошло задание?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      tags.includes(tag)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="whatWasEasy"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Что было легко?
                </label>
                <textarea
                  id="whatWasEasy"
                  value={whatWasEasy}
                  onChange={(e) => setWhatWasEasy(e.target.value)}
                  rows={3}
                  autoFocus
                  className="mt-1 w-full resize-none rounded-lg border border-border bg-card p-3 text-sm outline-none transition-colors focus:border-primary"
                  placeholder="Например: быстро разобрался с формулами"
                />
              </div>
              <div>
                <label
                  htmlFor="whatWasHard"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Что было сложно?
                </label>
                <textarea
                  id="whatWasHard"
                  value={whatWasHard}
                  onChange={(e) => setWhatWasHard(e.target.value)}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-primary"
                  placeholder="Например: не понял правило использования"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium">Нужна помощь учителя</span>
              <button
                type="button"
                role="switch"
                aria-checked={needHelp}
                onClick={() => setNeedHelp((v) => !v)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  needHelp ? "bg-danger" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    needHelp ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={difficulty === null || submitting}
              className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Отправка…" : "Отправить рефлексию"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}