"use client";

import type { Priority, Role } from "@prisma/client";
import { AlertCircle, ListPlus, X } from "lucide-react";
import { useState } from "react";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "LOW", label: "Низкий" },
  { value: "MEDIUM", label: "Средний" },
  { value: "HIGH", label: "Высокий" },
];

type SubjectOption = { id: number; name: string };
type StudentOption = { id: number; fullName: string };

type CreateTaskModalProps = {
  onClose: () => void;
  onCreated: (task: unknown) => void;
  currentUserId: number;
  currentUserRole: Role;
  studentId: number | null;
  students: StudentOption[];
  subjects: SubjectOption[];
};

export default function CreateTaskModal({
  onClose,
  onCreated,
  currentUserId,
  currentUserRole,
  studentId,
  students,
  subjects,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState<number>(subjects[0]?.id ?? 0);
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [targetStudentId, setTargetStudentId] = useState<number | null>(
    students[0]?.id ?? null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canChooseStudent = studentId === null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const target = canChooseStudent ? targetStudentId : studentId;
    if (!title.trim()) {
      setError("Укажите название задачи");
      return;
    }
    if (!subjectId) {
      setError("Выберите предмет");
      return;
    }
    if (canChooseStudent && !target) {
      setError("Выберите ученика");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(currentUserId),
        },
        body: JSON.stringify({
          title: title.trim(),
          subjectId,
          priority,
          dueDate: dueDate || undefined,
          description,
          studentId: target,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Не удалось создать задачу");
        setSubmitting(false);
        return;
      }

      onCreated(data);
      onClose();
    } catch {
      setError("Не удалось создать задачу");
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
        aria-label="Новая задача"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ListPlus className="h-5 w-5 text-primary" />
            Новая задача
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="task-title"
              className="text-sm font-medium text-muted-foreground"
            >
              Название задачи
            </label>
            <input
              id="task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="Например: решить № 118–122 на с. 85"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {canChooseStudent && (
            <div>
              <label
                htmlFor="task-student"
                className="text-sm font-medium text-muted-foreground"
              >
                Ученик
              </label>
              <select
                id="task-student"
                value={targetStudentId ?? ""}
                onChange={(e) => setTargetStudentId(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              >
                {students.length === 0 && <option value="">Нет учеников</option>}
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor="task-subject"
              className="text-sm font-medium text-muted-foreground"
            >
              Предмет
            </label>
            <select
              id="task-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-priority"
                className="text-sm font-medium text-muted-foreground"
              >
                Приоритет
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="task-due"
                className="text-sm font-medium text-muted-foreground"
              >
                Срок
              </label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="text-sm font-medium text-muted-foreground"
            >
              Описание
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Необязательно"
              className="mt-1 w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {currentUserRole === "PARENT" && (
            <p className="text-xs text-muted-foreground">
              Вы можете создавать задачи только для своих детей.
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm text-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Создаём…" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}