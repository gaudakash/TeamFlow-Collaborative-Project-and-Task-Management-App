"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATUS_CONFIG, type TaskStatus } from "@/lib/task-config";
import { cn } from "@/lib/utils";
import type { Task } from "@/hooks/use-tasks";
import { COLUMN_WIDTH_CLASS } from "./board-skeleton";
import { SortableTaskCard } from "./sortable-task-card";

type Props = {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onOpenTask: (taskId: string) => void;
};

export function BoardColumn({ status, tasks, onAddTask, onOpenTask }: Props) {
  const { label, dotClass } = STATUS_CONFIG[status];
  const headingId = `column-${status}`;

  // The column itself is a drop target, so you can drop into EMPTY columns
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <section
      aria-labelledby={headingId}
      className={cn(COLUMN_WIDTH_CLASS, "flex flex-col rounded-xl bg-muted/60")}
    >
      <header className="flex items-center gap-2 px-3 pt-3">
        <span className={cn("size-2 rounded-full", dotClass)} aria-hidden />
        <h2 id={headingId} className="text-sm font-semibold">
          {label}
        </h2>
        <span
          className="text-xs text-muted-foreground"
          aria-label={`${tasks.length} tasks`}
        >
          {tasks.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-7"
          onClick={() => onAddTask(status)}
          aria-label={`Add task to ${label}`}
        >
          <Plus className="size-4" />
        </Button>
      </header>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={cn(
            "m-2 flex min-h-24 flex-1 flex-col gap-2 rounded-lg transition-colors",
            isOver && "bg-primary/5",
          )}
        >
          {tasks.length === 0 ? (
            <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
              Drop tasks here
            </li>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onOpen={onOpenTask} />
            ))
          )}
        </ul>
      </SortableContext>
    </section>
  );
}
