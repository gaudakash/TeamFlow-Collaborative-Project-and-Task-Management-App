"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { BoardFormValues } from "@/lib/validations/board";

export function useBoards(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.boards.byWorkspace(workspaceId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("boards")
        .select("id, name, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useCreateBoard(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: BoardFormValues) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("boards")
        .insert({ workspace_id: workspaceId, name })
        .select("id, name, created_at")
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.boards.byWorkspace(workspaceId),
      });
    },
  });
}

export function useDeleteBoard(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => {
      const supabase = createClient();
      // .select() returns deleted rows. If RLS blocked it, we get 0 rows (not an error!)
      const { data, error } = await supabase
        .from("boards")
        .delete()
        .eq("id", boardId)
        .select("id");

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) {
        throw new Error("You do not have permission to delete this board");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.boards.byWorkspace(workspaceId),
      });
    },
  });
}
