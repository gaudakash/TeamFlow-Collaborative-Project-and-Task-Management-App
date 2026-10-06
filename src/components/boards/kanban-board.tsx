"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useTasks } from "@/hooks/use-tasks";
import { TASK_STATUSES } from "@/lib/task-config";
import { groupTasksByStatus } from "@/lib/tasks";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { BoardColumn } from "./board-column";

type Props = {
  boardId: string;
  workspaceId: string;
};

const SCROLL_CONTAINER =
  "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:snap-none";

export function KanbanBoard({ boardId, workspaceId }: Props) {
  const { data: tasks, isPending, isError, error, refetch } = useTasks(boardId);
  const openCreate = useTaskDialogStore((s) => s.openCreate);
  const openEdit = useTaskDialogStore((s) => s.openEdit);
  const close = useTaskDialogStore((s) => s.close);

  // The store is global, so close any open dialog when leaving the board
  useEffect(() => () => close(), [close]);

  const columns = useMemo(() => groupTasksByStatus(tasks ?? []), [tasks]);

  if (isPending) {
    return (
      <div
        className={SCROLL_CONTAINER}
        aria-busy="true"
        aria-label="Loading board"
      >
        {TASK_STATUSES.map((status) => (
          <div
            key={status}
            className="w-[85vw] max-w-xs shrink-0 space-y-2 rounded-xl bg-muted/60 p-3 sm:w-72 xl:w-auto xl:max-w-none xl:flex-1"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center"
      >
        <p className="font-medium text-destructive">Couldn&apos;t load tasks</p>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={SCROLL_CONTAINER}>
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={columns[status]}
            onAddTask={openCreate}
            onOpenTask={openEdit}
          />
        ))}
      </div>

      <TaskDialog boardId={boardId} workspaceId={workspaceId} tasks={tasks} />
    </>
  );
}
