"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useMembers } from "@/hooks/use-members";
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
  type Task,
} from "@/hooks/use-tasks";
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/task-config";
import {
  UNASSIGNED,
  emptyTaskForm,
  taskSchema,
  toTaskFormValues,
  toTaskPayload,
  type TaskFormValues,
} from "@/lib/validations/task";

type Props = {
  boardId: string;
  workspaceId: string;
  task?: Task;
  defaultStatus: TaskStatus;
  onDone: () => void;
  onDeleted?: () => void;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function TaskForm({
  boardId,
  workspaceId,
  task,
  defaultStatus,
  onDone,
  onDeleted,
}: Props) {
  const { data: members = [] } = useMembers(workspaceId);
  const createTask = useCreateTask(boardId);
  const updateTask = useUpdateTask(boardId);
  const deleteTask = useDeleteTask(boardId);
  const isSaving = createTask.isPending || updateTask.isPending;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: task ? toTaskFormValues(task) : emptyTaskForm(defaultStatus),
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = toTaskPayload(values);
    try {
      if (task) {
        await updateTask.mutateAsync({
          id: task.id,
          previousStatus: task.status,
          payload,
        });
        toast.success("Task updated");
      } else {
        await createTask.mutateAsync(payload);
        toast.success("Task created");
      }
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save task",
      );
    }
  });

  const handleDelete = () => {
    if (!task) return;
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success("Task deleted");
        const finish = onDeleted ?? onDone;
        finish();
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          placeholder="Design the landing page hero"
          autoComplete="off"
          autoFocus
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "task-title-error" : undefined}
          {...register("title")}
        />
        <FieldError id="task-title-error" message={errors.title?.message} />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          rows={4}
          placeholder="Add more details…"
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        <FieldError
          id="task-description-error"
          message={errors.description?.message}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="task-status">Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="task-priority">Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_CONFIG[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Assignee */}
        <div className="space-y-2">
          <Label htmlFor="task-assignee">Assignee</Label>
          <Controller
            control={control}
            name="assigned_to"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-assignee" className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {members.map(({ profile }) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Due date */}
        <div className="space-y-2">
          <Label htmlFor="task-due-date">Due date</Label>
          <Input
            id="task-due-date"
            type="date"
            aria-invalid={!!errors.due_date}
            aria-describedby={
              errors.due_date ? "task-due-date-error" : undefined
            }
            {...register("due_date")}
          />
          <FieldError
            id="task-due-date-error"
            message={errors.due_date?.message}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="task-tags">Tags</Label>
        <Input
          id="task-tags"
          placeholder="design, frontend"
          autoComplete="off"
          aria-invalid={!!errors.tags}
          aria-describedby="task-tags-hint task-tags-error"
          {...register("tags")}
        />
        <p id="task-tags-hint" className="text-xs text-muted-foreground">
          Comma separated, up to 5 tags
        </p>
        <FieldError id="task-tags-error" message={errors.tags?.message} />
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        {task ? (
          <ConfirmDialog
            title="Delete this task?"
            description="This permanently deletes the task and its comments."
            confirmLabel="Delete task"
            onConfirm={handleDelete}
            trigger={
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 /> Delete
              </Button>
            }
          />
        ) : (
          <span aria-hidden />
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : task ? "Save changes" : "Create task"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
