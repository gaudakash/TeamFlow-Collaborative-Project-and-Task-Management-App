"use client";

import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

export function WorkspaceList() {
  const {
    data: workspaces,
    isPending,
    isError,
    error,
    refetch,
  } = useWorkspaces();

  // 1. Loading state
  if (isPending) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  // 2. Error state
  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center"
      >
        <p className="font-medium text-destructive">
          Couldn&apos;t load workspaces
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  // 3. Empty state
  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed bg-background p-12 text-center">
        <FolderKanban className="size-10 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold">No workspaces yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create your first workspace to start organizing boards and tasks with
          your team.
        </p>
        <CreateWorkspaceDialog
          trigger={
            <Button className="mt-6">
              <Plus /> Create your first workspace
            </Button>
          }
        />
      </div>
    );
  }

  // 4. Success state
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((ws) => (
        <li key={ws.id}>
          <Link
            href={`/app/workspaces/${ws.id}`}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="truncate">{ws.name}</CardTitle>
                  <Badge
                    variant={ws.role === "admin" ? "default" : "secondary"}
                  >
                    {ws.role}
                  </Badge>
                </div>
                <CardDescription>
                  Created {new Date(ws.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
