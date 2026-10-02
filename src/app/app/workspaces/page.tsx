import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";
import { WorkspaceList } from "@/components/workspaces/workspace-list";

export default function WorkspacesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">
            Choose a workspace or create a new one.
          </p>
        </div>
        <CreateWorkspaceDialog
          trigger={
            <Button>
              <Plus /> New workspace
            </Button>
          }
        />
      </div>

      <WorkspaceList />
    </div>
  );
}
