"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  isPendingComment,
  useDeleteComment,
  type TaskComment,
} from "@/hooks/use-comments";
import { formatDateTime, formatRelativeTime, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  comment: TaskComment;
  taskId: string;
  isOwn: boolean;
};

export function CommentItem({ comment, taskId, isOwn }: Props) {
  const deleteComment = useDeleteComment(taskId);
  const pending = isPendingComment(comment);
  const name =
    comment.author?.full_name || comment.author?.email || "Former member";

  const handleDelete = () => {
    deleteComment.mutate(comment.id, {
      onSuccess: () => toast.success("Comment deleted"),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <li
      className={cn("flex gap-3", pending && "opacity-60")}
      aria-busy={pending}
    >
      <Avatar className="size-8 shrink-0">
        {comment.author?.avatar_url && (
          <AvatarImage src={comment.author.avatar_url} alt="" />
        )}
        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium">{name}</span>
          {isOwn && (
            <span className="text-xs text-muted-foreground">(you)</span>
          )}
          <time
            dateTime={comment.created_at}
            title={formatDateTime(comment.created_at)}
            className="text-xs text-muted-foreground"
          >
            {pending ? "Sending…" : formatRelativeTime(comment.created_at)}
          </time>

          {isOwn && !pending && (
            <ConfirmDialog
              title="Delete this comment?"
              description="This cannot be undone."
              confirmLabel="Delete comment"
              onConfirm={handleDelete}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-7 text-muted-foreground hover:text-destructive"
                  aria-label="Delete comment"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              }
            />
          )}
        </div>

        <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/60 px-3 py-2 text-sm">
          {comment.content}
        </p>
      </div>
    </li>
  );
}
