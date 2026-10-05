"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateBoard } from "@/hooks/use-boards";
import { boardSchema, type BoardFormValues } from "@/lib/validations/board";

type Props = {
  workspaceId: string;
  trigger: React.ReactNode;
};

export function CreateBoardDialog({ workspaceId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const createBoard = useCreateBoard(workspaceId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BoardFormValues>({
    resolver: zodResolver(boardSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const board = await createBoard.mutateAsync(values);
      toast.success(`Board "${board.name}" created`);
      reset();
      setOpen(false);
      router.push(`/app/boards/${board.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create board",
      );
    }
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create board</DialogTitle>
          <DialogDescription>
            Boards organize tasks into columns, like a project or sprint.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-name">Name</Label>
            <Input
              id="board-name"
              placeholder="Website Redesign"
              autoComplete="off"
              autoFocus
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "board-name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="board-name-error" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createBoard.isPending}>
              {createBoard.isPending ? "Creating…" : "Create board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
