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
import { useCreateWorkspace } from "@/hooks/use-workspaces";
import {
  workspaceSchema,
  type WorkspaceFormValues,
} from "@/lib/validations/workspace";

type Props = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateWorkspaceDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  // Works both controlled (from switcher) and uncontrolled (with a trigger button)
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const router = useRouter();
  const createWorkspace = useCreateWorkspace();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const workspace = await createWorkspace.mutateAsync(values);
      toast.success(`Workspace "${workspace.name}" created`);
      reset();
      setOpen(false);
      router.push(`/app/workspaces/${workspace.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create workspace",
      );
    }
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            A workspace holds your team&apos;s boards and tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              placeholder="Acme Inc."
              autoComplete="off"
              autoFocus
              aria-invalid={!!errors.name}
              aria-describedby={
                errors.name ? "workspace-name-error" : undefined
              }
              {...register("name")}
            />
            {errors.name && (
              <p id="workspace-name-error" className="text-sm text-destructive">
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
            <Button type="submit" disabled={createWorkspace.isPending}>
              {createWorkspace.isPending ? "Creating…" : "Create workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
