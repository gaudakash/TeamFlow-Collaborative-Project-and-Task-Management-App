"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { TaskAssignee } from "@/hooks/use-tasks";

export type CommentAuthor = TaskAssignee;

// Named TaskComment (not Comment) to avoid clashing with the browser's built-in DOM "Comment" type
export type TaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: CommentAuthor | null; // null if the author left the workspace (profile privacy RLS)
};

const COMMENT_SELECT =
  "id, task_id, user_id, content, created_at, author:profiles!comments_user_id_fkey(id, full_name, email, avatar_url)";

/** Optimistic comments get a temporary id until the server confirms them */
export const isPendingComment = (comment: TaskComment) =>
  comment.id.startsWith("temp-");

export function useComments(taskId: string) {
  return useQuery({
    queryKey: queryKeys.comments.byTask(taskId),
    queryFn: async (): Promise<TaskComment[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .select(COMMENT_SELECT)
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useAddComment(taskId: string, currentUser: CommentAuthor) {
  const queryClient = useQueryClient();
  const key = queryKeys.comments.byTask(taskId);
  const mutationKey = ["addComment", taskId] as const;

  return useMutation({
    mutationKey,
    mutationFn: async (content: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("comments")
        .insert({ task_id: taskId, user_id: currentUser.id, content });

      if (error) throw new Error(error.message);
    },

    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TaskComment[]>(key);

      const optimistic: TaskComment = {
        id: `temp-${crypto.randomUUID()}`,
        task_id: taskId,
        user_id: currentUser.id,
        content,
        created_at: new Date().toISOString(),
        author: currentUser,
      };
      queryClient.setQueryData<TaskComment[]>(key, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { previous };
    },

    onError: (_error, _content, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },

    onSettled: () => {
      // Same race-condition guard as useMoveTask
      if (queryClient.isMutating({ mutationKey }) === 1) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.comments.byTask(taskId);

  return useMutation({
    mutationFn: async (commentId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .select("id");

      if (error) throw new Error(error.message);
      if (!data || data.length === 0)
        throw new Error("You can only delete your own comments");
    },

    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TaskComment[]>(key);
      queryClient.setQueryData<TaskComment[]>(key, (old) =>
        old?.filter((c) => c.id !== commentId),
      );
      return { previous };
    },

    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
