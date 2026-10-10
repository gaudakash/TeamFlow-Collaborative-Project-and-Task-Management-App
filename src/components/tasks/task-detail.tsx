"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommentsSection } from "@/components/comments/comments-section";
import { useTask } from "@/hooks/use-tasks";
import type { CommentAuthor } from "@/hooks/use-comments";
import {
  formatDateTime,
  formatDueDate,
  formatRelativeTime,
  getInitials,
  isOverdue,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import { TaskDetailSkeleton } from "./task-detail-skeleton";
import { TaskForm } from "./task-form";

type Props = {
  taskId: string;
  boardId: string;
  workspaceId: string;
  currentUser: CommentAuthor;
};

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

export function TaskDetail({
  taskId,
  boardId,
  workspaceId,
  currentUser,
}: Props) {
  const router = useRouter();
  const { data: task, isPending, isError, error, refetch } = useTask(taskId);
  const [editOpen, setEditOpen] = useState(false);

  if (isPending) return <TaskDetailSkeleton />;

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center"
      >
        <p className="font-medium text-destructive">
          Couldn&apos;t load this task
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

  if (!task) {
    return (
      <div className="rounded-xl border border-dashed bg-background p-12 text-center">
        <p className="font-medium">This task no longer exists</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={`/app/boards/${boardId}`}>Back to board</Link>
        </Button>
      </div>
    );
  }

  const assigneeName = task.assignee?.full_name || task.assignee?.email;
  const overdue =
    !!task.due_date && task.status !== "done" && isOverdue(task.due_date);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Main column */}
      <div className="min-w-0 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="break-words text-2xl font-bold tracking-tight">
            {task.title}
          </h1>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil aria-hidden /> Edit
          </Button>
        </div>

        <section aria-labelledby="description-heading" className="space-y-2">
          <h2
            id="description-heading"
            className="text-sm font-semibold text-muted-foreground"
          >
            Description
          </h2>
          {task.description ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {task.description}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No description
            </p>
          )}
        </section>

        <CommentsSection taskId={task.id} currentUser={currentUser} />
      </div>

      {/* Sidebar */}
      <aside aria-label="Task details">
        <Card>
          <CardContent>
            <dl className="space-y-5 text-sm">
              <DetailRow label="Status">
                <StatusBadge status={task.status} />
              </DetailRow>

              <DetailRow label="Priority">
                <PriorityBadge priority={task.priority} />
              </DetailRow>

              <DetailRow label="Assignee">
                {task.assignee ? (
                  <span className="flex items-center gap-2">
                    <Avatar className="size-6">
                      {task.assignee.avatar_url && (
                        <AvatarImage src={task.assignee.avatar_url} alt="" />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {getInitials(assigneeName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{assigneeName}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </DetailRow>

              <DetailRow label="Due date">
                {task.due_date ? (
                  <span
                    className={cn(overdue && "font-medium text-destructive")}
                  >
                    {formatDueDate(task.due_date)}
                    {overdue && " (overdue)"}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No due date</span>
                )}
              </DetailRow>

              <DetailRow label="Tags">
                {task.tags.length > 0 ? (
                  <ul className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        #{tag}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground">No tags</span>
                )}
              </DetailRow>

              <DetailRow label="Created">
                <time dateTime={task.created_at}>
                  {formatDateTime(task.created_at)}
                </time>
              </DetailRow>

              <DetailRow label="Last updated">
                <time
                  dateTime={task.updated_at}
                  title={formatDateTime(task.updated_at)}
                >
                  {formatRelativeTime(task.updated_at)}
                </time>
              </DetailRow>
            </dl>
          </CardContent>
        </Card>
      </aside>

      {/* Edit dialog (reuses the same TaskForm as the board) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>
              Update the details of this task.
            </DialogDescription>
          </DialogHeader>
          {editOpen && (
            <TaskForm
              boardId={boardId}
              workspaceId={workspaceId}
              task={task}
              defaultStatus={task.status}
              onDone={() => setEditOpen(false)}
              onDeleted={() => {
                setEditOpen(false);
                router.push(`/app/boards/${boardId}`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
