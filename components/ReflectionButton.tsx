"use client";

import { TaskStatus } from "@prisma/client";
import { NotebookPen } from "lucide-react";
import { useState } from "react";
import ReflectionModal from "./ReflectionModal";

export default function ReflectionButton({
  taskId,
  status,
}: {
  taskId: number;
  status: TaskStatus;
}) {
  const [open, setOpen] = useState(false);

  if (status !== TaskStatus.DONE) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
      >
        <NotebookPen className="h-4 w-4" />
        Рефлексия
      </button>
      <ReflectionModal
        taskId={taskId}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}