"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mutationKeys, queryKeys } from "@/lib/query-keys";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import type { Task } from "@/hooks/use-tasks";
import type { TaskComment } from "@/hooks/use-comments";
import type { Tables } from "@/types/database";
import { useRealtimeChannel } from "./use-realtime-channel";

type TaskRow = Tables<"tasks">;
type CommentRow = Tables<"comments">;

/** True if the incoming row is at least as new as what we have (events can arrive out of order). */
function isSameOrNewer(incoming: string, current: string): boolean {
  const a = Date.parse(incoming);
  const b = Date.parse(current);
  if (Number.isNaN(a) || Number.isNaN(b)) return true; // unknown format → trust the server
  return a >= b;
}

// =====================================================================
// Board: live task changes
// =====================================================================
type BoardOptions = {
  /** True while the user is dragging or a move is saving. Remote changes are queued meanwhile. */
  paused: boolean;
};

export function useRealtimeBoardTasks(
  boardId: string,
  { paused }: BoardOptions,
) {
  const queryClient = useQueryClient();
  const pausedRef = useRef(paused);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Debounced refetch: a burst of 10 events becomes ONE request */
  const refetchSoon = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.byBoard(boardId),
      });
    }, 200);
  }, [queryClient, boardId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // When the user finishes dragging, apply anything that arrived in the meantime
  useEffect(() => {
    pausedRef.current = paused;
    if (paused || !pendingRef.current) return;
    // A move is still saving → its onSettled refetch will pick everything up
    if (
      queryClient.isMutating({ mutationKey: mutationKeys.moveTask(boardId) }) >
      0
    )
      return;
    pendingRef.current = false;
    refetchSoon();
  }, [paused, queryClient, boardId, refetchSoon]);

  /** Patch one task in the cache. Falls back to a refetch when we lack data. */
  const applyUpdate = useCallback(
    (row: TaskRow) => {
      const outcome = { refetch: false };

      queryClient.setQueryData<Task[]>(
        queryKeys.tasks.byBoard(boardId),
        (old) => {
          if (!old) return old;
          const index = old.findIndex((t) => t.id === row.id);
          if (index === -1) {
            outcome.refetch = true;
            return old;
          }

          const current = old[index];
          if (!isSameOrNewer(row.updated_at, current.updated_at)) return old; // stale event

          // Realtime rows don't include the joined assignee profile → refetch to get it
          if (row.assigned_to !== current.assigned_to) {
            outcome.refetch = true;
            return old;
          }

          const next = [...old];
          next[index] = { ...current, ...row };
          return next;
        },
      );

      if (outcome.refetch) refetchSoon();
    },
    [queryClient, boardId, refetchSoon],
  );

  return useRealtimeChannel(
    `board:${boardId}`,
    (channel) => {
      const filter = `board_id=eq.${boardId}`;

      channel
        .on<TaskRow>(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "tasks", filter },
          () => {
            if (pausedRef.current) {
              pendingRef.current = true;
              return;
            }
            refetchSoon(); // new rows need the assignee join
          },
        )
        .on<TaskRow>(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "tasks", filter },
          (payload) => {
            if (pausedRef.current) {
              pendingRef.current = true;
              return;
            }
            applyUpdate(payload.new);
          },
        )
        // DELETE events can't be filtered, and with RLS they only contain the primary key.
        // So we listen to all task deletes and ignore ids that aren't on this board.
        .on<TaskRow>(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "tasks" },
          (payload) => {
            const id = payload.old.id;
            const key = queryKeys.tasks.byBoard(boardId);
            if (
              !id ||
              !queryClient.getQueryData<Task[]>(key)?.some((t) => t.id === id)
            )
              return;

            // Someone else deleted the task we're editing? Tell the user why the dialog closed.
            const dialog = useTaskDialogStore.getState().dialog;
            const isOwnAction = queryClient.isMutating() > 0;
            if (
              !isOwnAction &&
              dialog.mode === "edit" &&
              dialog.taskId === id
            ) {
              toast.info("This task was deleted by a teammate");
            }

            if (pausedRef.current) {
              pendingRef.current = true;
              return;
            }
            queryClient.setQueryData<Task[]>(key, (old) =>
              old?.filter((t) => t.id !== id),
            );
          },
        );
    },
    refetchSoon,
  );
}

// =====================================================================
// Task detail page: live task + comments
// =====================================================================
export function useRealtimeTask(taskId: string) {
  const queryClient = useQueryClient();

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.comments.byTask(taskId),
    });
  }, [queryClient, taskId]);

  return useRealtimeChannel(
    `task:${taskId}`,
    (channel) => {
      channel
        .on<TaskRow>(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "tasks",
            filter: `id=eq.${taskId}`,
          },
          () =>
            queryClient.invalidateQueries({
              queryKey: queryKeys.tasks.detail(taskId),
            }),
        )
        .on<TaskRow>(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "tasks" },
          (payload) => {
            // Shows the "This task no longer exists" state
            if (payload.old.id === taskId) {
              queryClient.setQueryData(queryKeys.tasks.detail(taskId), null);
            }
          },
        )
        .on<CommentRow>(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "comments",
            filter: `task_id=eq.${taskId}`,
          },
          () => {
            // Our own optimistic comment is still saving → its onSettled will refetch
            if (
              queryClient.isMutating({
                mutationKey: mutationKeys.addComment(taskId),
              }) > 0
            )
              return;
            queryClient.invalidateQueries({
              queryKey: queryKeys.comments.byTask(taskId),
            });
          },
        )
        .on<CommentRow>(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "comments" },
          (payload) => {
            const id = payload.old.id;
            if (!id) return;
            queryClient.setQueryData<TaskComment[]>(
              queryKeys.comments.byTask(taskId),
              (old) =>
                old?.some((c) => c.id === id)
                  ? old.filter((c) => c.id !== id)
                  : old,
            );
          },
        );
    },
    refreshAll,
  );
}
