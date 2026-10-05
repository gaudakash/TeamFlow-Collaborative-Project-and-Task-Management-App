"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { InviteMemberFormValues } from "@/lib/validations/member";
import type { Enums } from "@/types/database";

export type WorkspaceMember = {
  role: Enums<"workspace_role">;
  joined_at: string;
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
};

export function useMembers(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.members.byWorkspace(workspaceId),
    queryFn: async (): Promise<WorkspaceMember[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("workspace_members")
        .select(
          "role, joined_at, profile:profiles(id, full_name, email, avatar_url)",
        )
        .eq("workspace_id", workspaceId)
        .order("joined_at", { ascending: true });

      if (error) throw new Error(error.message);

      return data.flatMap(({ role, joined_at, profile }) =>
        profile ? [{ role, joined_at, profile }] : [],
      );
    },
  });
}

export function useInviteMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: InviteMemberFormValues) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("add_workspace_member", {
        ws_id: workspaceId,
        member_email: email,
        member_role: role,
      });
      // The friendly messages we wrote in SQL come through here
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.byWorkspace(workspaceId),
      });
    },
  });
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .select("user_id");

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) {
        throw new Error("You do not have permission to remove this member");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.byWorkspace(workspaceId),
      });
    },
  });
}
