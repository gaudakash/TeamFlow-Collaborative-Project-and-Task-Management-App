"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { Enums } from "@/types/database";
import type { WorkspaceFormValues } from "@/lib/validations/workspace";

export type WorkspaceWithRole = {
  id: string;
  name: string;
  created_at: string;
  role: Enums<"workspace_role">;
};

async function getCurrentUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in");
  return user.id;
}

/** All workspaces the current user belongs to, with their role in each. */
export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces.all,
    queryFn: async (): Promise<WorkspaceWithRole[]> => {
      const supabase = createClient();
      const userId = await getCurrentUserId();

      const { data, error } = await supabase
        .from("workspace_members")
        .select("role, workspace:workspaces(id, name, created_at)")
        .eq("user_id", userId)
        .order("joined_at", { ascending: true });

      if (error) throw new Error(error.message);

      return data.flatMap(({ role, workspace }) =>
        workspace ? [{ ...workspace, role }] : [],
      );
    },
  });
}

/** Creates a workspace. A DB trigger automatically makes the creator an admin. */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: WorkspaceFormValues) => {
      const supabase = createClient();
      const userId = await getCurrentUserId();

      const { data, error } = await supabase
        .from("workspaces")
        .insert({ name, created_by: userId })
        .select("id, name, created_at")
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });
}
