"use client";

import type { Role } from "@prisma/client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CreateTaskModal from "./CreateTaskModal";

type CreateTaskButtonProps = {
  currentUserId: number;
  currentUserRole: Role;
  studentId: number | null;
  students: { id: number; fullName: string }[];
  subjects: { id: number; name: string }[];
};

export default function CreateTaskButton({
  currentUserId,
  currentUserRole,
  studentId,
  students,
  subjects,
}: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Добавить задачу
      </button>

      {open && (
        <CreateTaskModal
          onClose={() => setOpen(false)}
          onCreated={() => router.refresh()}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          studentId={studentId}
          students={students}
          subjects={subjects}
        />
      )}
    </>
  );
}