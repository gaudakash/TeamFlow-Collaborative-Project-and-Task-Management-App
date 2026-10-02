"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

export function WorkspaceSwitcher() {
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const { data: workspaces, isPending } = useWorkspaces();
  const [createOpen, setCreateOpen] = useState(false);

  const current = workspaces?.find((ws) => ws.id === workspaceId);

  if (isPending) return <Skeleton className="h-9 w-40 sm:w-56" />;

  return (
    <>
      {/* modal={false} avoids a focus bug when opening a Dialog from a menu item */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-40 justify-between sm:w-56"
            aria-label="Switch workspace"
          >
            <span className="truncate">
              {current?.name ?? "Select workspace"}
            </span>
            <ChevronsUpDown className="size-4 opacity-50" aria-hidden />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces?.map((ws) => (
            <DropdownMenuItem key={ws.id} asChild>
              <Link href={`/app/workspaces/${ws.id}`}>
                <span className="truncate">{ws.name}</span>
                {ws.id === workspaceId && (
                  <Check className="ml-auto size-4" aria-hidden />
                )}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden /> New workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
