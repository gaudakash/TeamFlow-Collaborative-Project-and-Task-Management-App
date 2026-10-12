import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoardLoader } from "@/components/boards/kanban-board-loader";

type Props = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardPage({ params }: Props) {
  const { boardId } = await params;
  const supabase = await createClient();

  // Both requests in parallel
  const [
    {
      data: { user },
    },
    { data: board },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("boards")
      .select("id, name, workspace:workspaces(id, name)")
      .eq("id", boardId)
      .maybeSingle(),
  ]);

  // RLS hides boards from non-members → 404
  if (!user || !board || !board.workspace) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/workspaces/${board.workspace.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden /> {board.workspace.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{board.name}</h1>
      </div>

      <KanbanBoardLoader
        boardId={board.id}
        workspaceId={board.workspace.id}
        currentUserId={user.id}
      />
    </div>
  );
}
