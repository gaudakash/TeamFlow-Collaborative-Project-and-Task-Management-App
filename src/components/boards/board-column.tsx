import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/task-card";
import { STATUS_CONFIG, type TaskStatus } from "@/lib/task-config";
import { cn } from "@/lib/utils";
import type { Task } from "@/hooks/use-tasks";

type Props = {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onOpenTask: (taskId: string) => void;
};

export function BoardColumn({ status, tasks, onAddTask, onOpenTask }: Props) {
  const { label, dotClass } = STATUS_CONFIG[status];
  const headingId = `column-${status}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-[85vw] max-w-xs shrink-0 snap-start flex-col rounded-xl bg-muted/60 sm:w-72 xl:w-auto xl:min-w-0 xl:max-w-none xl:flex-1"
    >
      <header className="flex items-center gap-2 px-3 pt-3">
        <span className={cn("size-2 rounded-full", dotClass)} aria-hidden />
        <h2 id={headingId} className="text-sm font-semibold">
          {label}
        </h2>
        <span
          className="text-xs text-muted-foreground"
          aria-label={`${tasks.length} tasks`}
        >
          {tasks.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-7"
          onClick={() => onAddTask(status)}
          aria-label={`Add task to ${label}`}
        >
          <Plus className="size-4" />
        </Button>
      </header>

      <ul className="flex min-h-24 flex-1 flex-col gap-2 p-2">
        {tasks.length === 0 ? (
          <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
            No tasks
          </li>
        ) : (
          tasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} onOpen={onOpenTask} />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
