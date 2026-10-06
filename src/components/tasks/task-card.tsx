import { CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDueDate, getInitials, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/hooks/use-tasks";
import { PriorityBadge } from "./priority-badge";

type Props = {
  task: Task;
  onOpen: (taskId: string) => void;
};

export function TaskCard({ task, onOpen }: Props) {
  const overdue =
    task.due_date && task.status !== "done" && isOverdue(task.due_date);
  const assigneeName = task.assignee?.full_name || task.assignee?.email;

  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="w-full space-y-3 rounded-lg border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className="line-clamp-2 text-sm font-medium">{task.title}</p>

      {task.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label="Tags">
          {task.tags.map((tag) => (
            <li
              key={tag}
              className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              #{tag}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.due_date && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                overdue
                  ? "font-medium text-destructive"
                  : "text-muted-foreground",
              )}
            >
              <CalendarDays className="size-3" aria-hidden />
              {overdue && <span className="sr-only">Overdue, </span>}
              {formatDueDate(task.due_date)}
            </span>
          )}
        </div>

        {task.assignee && (
          <Avatar className="size-6" title={assigneeName ?? undefined}>
            {task.assignee.avatar_url && (
              <AvatarImage src={task.assignee.avatar_url} alt="" />
            )}
            <AvatarFallback className="text-[10px]">
              {getInitials(assigneeName)}
            </AvatarFallback>
            <span className="sr-only">Assigned to {assigneeName}</span>
          </Avatar>
        )}
      </div>
    </button>
  );
}
