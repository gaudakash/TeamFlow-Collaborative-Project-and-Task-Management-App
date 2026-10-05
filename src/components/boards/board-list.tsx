"use client";

import Link from "next/link";
import { KanbanSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useBoards, useDeleteBoard } from "@/hooks/use-boards";
import { CreateBoardDialog } from "./create-board-dialog";

type Props = {
  workspaceId: string;
  isAdmin: boolean;
};

export function BoardList({ workspaceId, isAdmin }: Props) {
  const {
    data: boards,
    isPending,
    isError,
    error,
    refetch,
  } = useBoards(workspaceId);
  const deleteBoard = useDeleteBoard(workspaceId);

  const handleDelete = (boardId: string, name: string) => {
    deleteBoard.mutate(boardId, {
      onSuccess: () => toast.success(`Board "${name}" deleted`),
      onError: (err) => toast.error(err.message),
    });
  };

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center"
      >
        <p className="font-medium text-destructive">
          Couldn&apos;t load boards
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

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed bg-background p-10 text-center">
        <KanbanSquare className="size-10 text-muted-foreground" aria-hidden />
        <h3 className="mt-4 text-lg font-semibold">No boards yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create a board to start tracking tasks for a project.
        </p>
        <CreateBoardDialog
          workspaceId={workspaceId}
          trigger={
            <Button className="mt-6">
              <Plus /> Create your first board
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {boards.map((board) => (
        // `relative` so the delete button can sit on top WITHOUT being inside the <a>
        <li key={board.id} className="relative">
          <Link
            href={`/app/boards/${board.id}`}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader className="pr-12">
                <CardTitle className="truncate">{board.name}</CardTitle>
                <CardDescription>
                  Created {new Date(board.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {isAdmin && (
            <ConfirmDialog
              title={`Delete "${board.name}"?`}
              description="This permanently deletes the board and all of its tasks. This cannot be undone."
              confirmLabel="Delete board"
              onConfirm={() => handleDelete(board.id, board.name)}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete board ${board.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              }
            />
          )}
        </li>
      ))}
    </ul>
  );
}
