"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { applyTaskMove, getNextPosition, type TaskMove } from "@/lib/tasks";
import type { TaskStatus } from "@/lib/task-config";
import type { TaskPayload } from "@/lib/validations/task";
import type { Tables } from "@/types/database";

// ---------- Types ----------
export type TaskAssignee = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "avatar_url"
>;
export type Task = Tables<"tasks"> & { assignee: TaskAssignee | null };

// tasks has TWO foreign keys to profiles (assigned_to, created_by),
// so we tell Supabase which one to follow with "!tasks_assigned_to_fkey".
const TASK_SELECT =
  "*, assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url)";

// ---------- Read ----------
export function useTasks(boardId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.byBoard(boardId),
    queryFn: async (): Promise<Task[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_SELECT)
        .eq("board_id", boardId)
        .order("position", { ascending: true });

      if (error) throw new Error(error.message);
      return data;
    },
  });
}

// ---------- Create ----------
export function useCreateTask(boardId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.tasks.byBoard(boardId);

  return useMutation({
    mutationFn: async (payload: TaskPayload) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in");

      const cached = queryClient.getQueryData<Task[]>(key) ?? [];

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...payload,
          board_id: boardId,
          created_by: user.id,
          position: getNextPosition(cached, payload.status),
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

// ---------- Update (edit dialog) ----------
type UpdateTaskInput = {
  id: string;
  previousStatus: TaskStatus;
  payload: TaskPayload;
};

export function useUpdateTask(boardId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.tasks.byBoard(boardId);

  return useMutation({
    mutationFn: async ({ id, previousStatus, payload }: UpdateTaskInput) => {
      const supabase = createClient();
      const cached = queryClient.getQueryData<Task[]>(key) ?? [];

      // Changing status in the form → move the task to the bottom of the new column
      const statusChanged = payload.status !== previousStatus;
      const update = statusChanged
        ? { ...payload, position: getNextPosition(cached, payload.status) }
        : payload;

      const { data, error } = await supabase
        .from("tasks")
        .update(update)
        .eq("id", id)
        .select("id");

      if (error) throw new Error(error.message);
      if (!data || data.length === 0)
        throw new Error("You do not have permission to edit this task");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

// ---------- Delete ----------
export function useDeleteTask(boardId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.tasks.byBoard(boardId);

  return useMutation({
    mutationFn: async (taskId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .select("id");

      if (error) throw new Error(error.message);
      if (!data || data.length === 0)
        throw new Error("You do not have permission to delete this task");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

// ---------- Move (drag-and-drop, optimistic) ----------
/**
 * 1. Update the cache immediately → card moves instantly
 * 2. Send the update to Supabase
 * 3. On error → roll back to the previous cache
 * 4. When done → refetch to sync with the server
 */
export function useMoveTask(boardId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.tasks.byBoard(boardId);
  const mutationKey = ["moveTask", boardId] as const;

  return useMutation({
    mutationKey,
    mutationFn: async ({ id, status, position }: TaskMove) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .update({ status, position })
        .eq("id", id)
        .select("id");

      if (error) throw new Error(error.message);
      if (!data || data.length === 0)
        throw new Error("Task not found or you lack permission");
    },

    onMutate: async (move) => {
      // Stop any in-flight refetch from overwriting our optimistic data
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);
      queryClient.setQueryData<Task[]>(key, (old) =>
        old ? applyTaskMove(old, move) : old,
      );
      return { previous };
    },

    onError: (_error, _move, context) => {
      // Roll back to the snapshot taken before the move
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },

    onSettled: () => {
      // Only refetch when this is the LAST pending move.
      // Otherwise a refetch could return old data while another move is still saving → flicker.
      if (queryClient.isMutating({ mutationKey }) === 1) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
