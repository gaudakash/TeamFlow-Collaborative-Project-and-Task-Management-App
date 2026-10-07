"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TaskCard } from "@/components/tasks/task-card";
import { cn } from "@/lib/utils";
import type { Task } from "@/hooks/use-tasks";

type Props = {
  task: Task;
  onOpen: (taskId: string) => void;
};

export function SortableTaskCard({ task, onOpen }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status, title: task.title },
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group relative select-none", isDragging && "opacity-40")}
      // Mouse/touch: drag from anywhere on the card
      {...listeners}
    >
      <TaskCard task={task} onOpen={onOpen} />

      {/* Keyboard: drag only from this handle, so Enter on the card still opens the dialog */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        aria-label={`Move task: ${task.title}`}
        className="absolute right-1.5 top-1.5 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing sm:opacity-0 sm:group-hover:opacity-100"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
    </li>
  );
}
