import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from "./task-config";
import { groupTasksByStatus } from "./tasks";

// ---------- Options ----------
export const DUE_FILTERS = ["overdue", "today", "week", "none"] as const;
export type DueFilter = (typeof DUE_FILTERS)[number];

export const TASK_SORTS = [
  "manual",
  "due_date",
  "priority",
  "newest",
  "title",
] as const;
export type TaskSort = (typeof TASK_SORTS)[number];

export const DUE_FILTER_LABELS: Record<DueFilter, string> = {
  overdue: "Overdue",
  today: "Due today",
  week: "Due this week",
  none: "No due date",
};

export const SORT_LABELS: Record<TaskSort, string> = {
  manual: "Manual order",
  due_date: "Due date",
  priority: "Priority",
  newest: "Newest first",
  title: "Title (A–Z)",
};

/** Special assignee values. Anything else must be a user id. */
export const ASSIGNEE_ME = "me";
export const ASSIGNEE_NONE = "unassigned";

export type TaskFilters = {
  q: string;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  assignee: string | null;
  due: DueFilter | null;
  sort: TaskSort;
};

export const DEFAULT_FILTERS: TaskFilters = {
  q: "",
  status: null,
  priority: null,
  assignee: null,
  due: null,
  sort: "manual",
};

/** The minimum a task needs to be filtered. Works with the real Task type AND simple test data. */
export type FilterableTask = {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_to: string | null;
  tags: string[];
  created_at: string;
  position: number;
};

export type FilterContext = {
  currentUserId: string;
  today?: Date;
};

// ---------- URL parsing (never trust the URL) ----------
type ParamsLike = { get(name: string): string | null };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function oneOf<T extends string>(
  allowed: readonly T[],
  value: string | null,
): T | null {
  return value !== null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function parseAssignee(value: string | null): string | null {
  if (value === ASSIGNEE_ME || value === ASSIGNEE_NONE) return value;
  if (value && UUID_RE.test(value)) return value;
  return null;
}

/** URL → filters. Unknown or invalid values fall back to defaults. */
export function parseTaskFilters(params: ParamsLike): TaskFilters {
  return {
    q: (params.get("q") ?? "").slice(0, 100),
    status: oneOf(TASK_STATUSES, params.get("status")),
    priority: oneOf(TASK_PRIORITIES, params.get("priority")),
    assignee: parseAssignee(params.get("assignee")),
    due: oneOf(DUE_FILTERS, params.get("due")),
    sort: oneOf(TASK_SORTS, params.get("sort")) ?? "manual",
  };
}

/** Filters → URL. Default values are left out so URLs stay short and clean. */
export function serializeTaskFilters(filters: TaskFilters): URLSearchParams {
  const params = new URLSearchParams();
  const q = filters.q.trim();
  if (q) params.set("q", q);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.assignee) params.set("assignee", filters.assignee);
  if (filters.due) params.set("due", filters.due);
  if (filters.sort !== "manual") params.set("sort", filters.sort);
  return params;
}

/** How many filters are active (sort is not counted as a filter). */
export function countActiveFilters(filters: TaskFilters): number {
  return [
    filters.q.trim(),
    filters.status,
    filters.priority,
    filters.assignee,
    filters.due,
  ].filter(Boolean).length;
}

// ---------- Dates ----------
/** Local date → "YYYY-MM-DD" (same format as the DB `date` column, so strings compare correctly) */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function matchesDueFilter(
  task: FilterableTask,
  due: DueFilter,
  today: Date,
): boolean {
  const todayStr = toDateString(today);
  switch (due) {
    case "none":
      return task.due_date === null;
    case "overdue":
      // Done tasks are never overdue (matches the red date on the card)
      return (
        task.due_date !== null &&
        task.status !== "done" &&
        task.due_date < todayStr
      );
    case "today":
      return task.due_date === todayStr;
    case "week":
      return (
        task.due_date !== null &&
        task.due_date >= todayStr &&
        task.due_date <= toDateString(addDays(today, 6))
      );
  }
}

// ---------- Filtering ----------
export function matchesSearch(task: FilterableTask, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    task.title.toLowerCase().includes(q) ||
    (task.description ?? "").toLowerCase().includes(q) ||
    task.tags.some((tag) => tag.includes(q))
  );
}

export function filterTasks<T extends FilterableTask>(
  tasks: T[],
  filters: TaskFilters,
  { currentUserId, today = new Date() }: FilterContext,
): T[] {
  return tasks.filter((task) => {
    if (!matchesSearch(task, filters.q)) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;

    if (filters.assignee === ASSIGNEE_ME && task.assigned_to !== currentUserId)
      return false;
    if (filters.assignee === ASSIGNEE_NONE && task.assigned_to !== null)
      return false;
    if (
      filters.assignee &&
      filters.assignee !== ASSIGNEE_ME &&
      filters.assignee !== ASSIGNEE_NONE &&
      task.assigned_to !== filters.assignee
    ) {
      return false;
    }

    if (filters.due && !matchesDueFilter(task, filters.due, today))
      return false;
    return true;
  });
}

// ---------- Sorting ----------
const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** Returns a NEW sorted array (never mutates the cache). */
export function sortTasks<T extends FilterableTask>(
  tasks: T[],
  sort: TaskSort,
): T[] {
  const byPosition = (a: T, b: T) => a.position - b.position;
  const copy = [...tasks];

  switch (sort) {
    case "manual":
      return copy.sort(byPosition);
    case "due_date":
      // Earliest first, tasks without a due date at the bottom
      return copy.sort((a, b) => {
        if (a.due_date === b.due_date) return byPosition(a, b);
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date < b.due_date ? -1 : 1;
      });
    case "priority":
      return copy.sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          byPosition(a, b),
      );
    case "newest":
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case "title":
      return copy.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      );
  }
}

// ---------- Everything together ----------
/** Filter → group into columns → sort each column. */
export function buildBoardColumns<T extends FilterableTask>(
  tasks: T[],
  filters: TaskFilters,
  context: FilterContext,
) {
  const visible = filterTasks(tasks, filters, context);
  const columns = groupTasksByStatus(visible);

  if (filters.sort !== "manual") {
    for (const status of TASK_STATUSES)
      columns[status] = sortTasks(columns[status], filters.sort);
  }

  return { columns, visibleCount: visible.length };
}
