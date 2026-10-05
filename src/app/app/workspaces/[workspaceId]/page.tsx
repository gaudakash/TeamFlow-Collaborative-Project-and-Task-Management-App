import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { BoardList } from "@/components/boards/board-list";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { MembersPanel } from "@/components/members/members-panel";

type Props = {
  params: Promise<{ workspaceId: string }>;
};

export default async function WorkspacePage({ params }: Props) {
  const { workspaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Run both queries in parallel (faster than one after another)
  const [{ data: workspace }, { data: membership }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("id, name")
      .eq("id", workspaceId)
      .maybeSingle(),
    supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // RLS hides workspaces you're not a member of → 404
  if (!workspace || !membership) notFound();

  // UI decision only. The DATABASE enforces the real permission.
  const isAdmin = membership.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {workspace.name}
          </h1>
          <p className="text-muted-foreground">
            You are {isAdmin ? "an admin" : "a member"} of this workspace
          </p>
        </div>
        <CreateBoardDialog
          workspaceId={workspace.id}
          trigger={
            <Button>
              <Plus /> New board
            </Button>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="boards-heading" className="space-y-4">
          <h2 id="boards-heading" className="text-lg font-semibold">
            Boards
          </h2>
          <BoardList workspaceId={workspace.id} isAdmin={isAdmin} />
        </section>

        <aside aria-label="Workspace members">
          <MembersPanel
            workspaceId={workspace.id}
            currentUserId={user.id}
            isAdmin={isAdmin}
          />
        </aside>
      </div>
    </div>
  );
}
