import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, KanbanSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardPage({ params }: Props) {
  const { boardId } = await params;
  const supabase = await createClient();

  const { data: board } = await supabase
    .from("boards")
    .select("id, name, workspace:workspaces(id, name)")
    .eq("id", boardId)
    .maybeSingle();

  if (!board || !board.workspace) notFound();

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

      <div className="flex flex-col items-center rounded-xl border border-dashed bg-background p-12 text-center">
        <KanbanSquare className="size-10 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold">
          The Kanban board is coming in Phase 3
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Columns, tasks, and drag-and-drop will live here.
        </p>
      </div>
    </div>
  );
}
