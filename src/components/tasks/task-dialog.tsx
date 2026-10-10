"use client";

import Link from "next/link";
import { Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import type { Task } from "@/hooks/use-tasks";
import { TaskForm } from "./task-form";

type Props = {
  boardId: string;
  workspaceId: string;
  tasks: Task[];
};

export function TaskDialog({ boardId, workspaceId, tasks }: Props) {
  const dialog = useTaskDialogStore((s) => s.dialog);
  const close = useTaskDialogStore((s) => s.close);

  // Always read the task from the Query cache, never a stale copy
  const task =
    dialog.mode === "edit"
      ? tasks.find((t) => t.id === dialog.taskId)
      : undefined;
  const open = dialog.mode === "create" || (dialog.mode === "edit" && !!task);

  // A new `key` remounts the form, so it always starts with the right default values
  const formKey =
    dialog.mode === "edit"
      ? dialog.taskId
      : dialog.mode === "create"
        ? `new-${dialog.status}`
        : "closed";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {task
              ? "Update the details of this task."
              : "Add a task to this board."}
          </DialogDescription>
          {task && (
            <Link
              href={`/app/tasks/${task.id}`}
              className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <Maximize2 className="size-3.5" aria-hidden />
              Open full page &amp; comments
            </Link>
          )}
        </DialogHeader>

        {open && (
          <TaskForm
            key={formKey}
            boardId={boardId}
            workspaceId={workspaceId}
            task={task}
            defaultStatus={dialog.mode === "create" ? dialog.status : "todo"}
            onDone={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
