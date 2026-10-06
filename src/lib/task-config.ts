// Single source of truth for statuses and priorities.
// Order here = column order on the board.
export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dotClass: string }
> = {
  backlog: { label: "Backlog", dotClass: "bg-slate-400" },
  todo: { label: "To Do", dotClass: "bg-blue-500" },
  in_progress: { label: "In Progress", dotClass: "bg-amber-500" },
  review: { label: "Review", dotClass: "bg-purple-500" },
  done: { label: "Done", dotClass: "bg-emerald-500" },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  },
  medium: {
    label: "Medium",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  high: {
    label: "High",
    className: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-500/15 text-red-700 dark:text-red-300",
  },
};
