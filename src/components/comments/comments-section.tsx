"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useComments, type CommentAuthor } from "@/hooks/use-comments";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

type Props = {
  taskId: string;
  currentUser: CommentAuthor;
};

export function CommentsSection({ taskId, currentUser }: Props) {
  const {
    data: comments,
    isPending,
    isError,
    error,
    refetch,
  } = useComments(taskId);

  return (
    <section aria-labelledby="comments-heading" className="space-y-4">
      <h2 id="comments-heading" className="text-lg font-semibold">
        Comments{" "}
        {comments && (
          <span className="text-muted-foreground">({comments.length})</span>
        )}
      </h2>

      {isPending && (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-14 flex-1" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm"
        >
          <p className="text-destructive">
            Couldn&apos;t load comments: {error.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {comments &&
        (comments.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed p-6 text-center">
            <MessageSquare
              className="size-6 text-muted-foreground"
              aria-hidden
            />
            <p className="mt-2 text-sm text-muted-foreground">
              No comments yet. Start the conversation.
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                taskId={taskId}
                isOwn={comment.user_id === currentUser.id}
              />
            ))}
          </ol>
        ))}

      <CommentForm taskId={taskId} currentUser={currentUser} />
    </section>
  );
}
