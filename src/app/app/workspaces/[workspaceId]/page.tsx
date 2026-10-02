import { notFound } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ workspaceId: string }>;
};

export default async function WorkspacePage({ params }: Props) {
  const { workspaceId } = await params;
  const supabase = await createClient();

  // RLS returns nothing if the user isn't a member → we show 404
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, created_at")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{workspace.name}</h1>
        <p className="text-muted-foreground">Boards in this workspace</p>
      </div>

      <div className="flex flex-col items-center rounded-xl border border-dashed bg-background p-12 text-center">
        <LayoutGrid className="size-10 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold">Boards are coming next</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll add board creation and member invites in the next step.
        </p>
      </div>
    </div>
  );
}
