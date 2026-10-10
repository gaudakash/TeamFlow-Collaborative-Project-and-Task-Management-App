"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAddComment, type CommentAuthor } from "@/hooks/use-comments";
import {
  commentSchema,
  type CommentFormValues,
} from "@/lib/validations/comment";

type Props = {
  taskId: string;
  currentUser: CommentAuthor;
};

export function CommentForm({ taskId, currentUser }: Props) {
  const addComment = useAddComment(taskId, currentUser);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });

  const onSubmit = handleSubmit(({ content }) => {
    // Optimistic: clear the box immediately. If saving fails, put the text back.
    reset();
    addComment.mutate(content, {
      onError: (err) => {
        setValue("content", content);
        toast.error(`Couldn't post comment: ${err.message}`);
      },
    });
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + Enter (Windows) or Cmd + Enter (Mac) sends the comment
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      <Label htmlFor="comment-content" className="sr-only">
        Add a comment
      </Label>
      <Textarea
        id="comment-content"
        rows={3}
        placeholder="Write a comment…"
        aria-invalid={!!errors.content}
        aria-describedby={
          errors.content ? "comment-hint comment-error" : "comment-hint"
        }
        onKeyDown={handleKeyDown}
        {...register("content")}
      />
      {errors.content && (
        <p id="comment-error" className="text-sm text-destructive">
          {errors.content.message}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <p id="comment-hint" className="text-xs text-muted-foreground">
          Press Ctrl + Enter to send
        </p>
        <Button type="submit" size="sm">
          <SendHorizontal aria-hidden /> Comment
        </Button>
      </div>
    </form>
  );
}
