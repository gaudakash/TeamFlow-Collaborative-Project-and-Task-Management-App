import { TASK_STATUSES, type TaskStatus } from "./task-config";

type Positioned = { status: TaskStatus; position: number };

export type TaskMove = { id: string; status: TaskStatus; position: number };

/** Groups tasks into columns, each sorted by position. */
export function groupTasksByStatus<T extends Positioned>(
  tasks: T[],
): Record<TaskStatus, T[]> {
  const groups = Object.fromEntries(
    TASK_STATUSES.map((s) => [s, [] as T[]]),
  ) as Record<TaskStatus, T[]>;
  for (const task of tasks) groups[task.status].push(task);
  for (const status of TASK_STATUSES)
    groups[status].sort((a, b) => a.position - b.position);
  return groups;
}

/** Position for a new task at the bottom of a column. Gaps of 1000 leave room for reordering. */
export function getNextPosition(
  tasks: Positioned[],
  status: TaskStatus,
): number {
  const positions = tasks
    .filter((t) => t.status === status)
    .map((t) => t.position);
  return positions.length ? Math.max(...positions) + 1000 : 1000;
}

/**
 * Position for a task dropped between two neighbors.
 * Only the moved task gets a new position. No other rows need updating.
 */
export function getPositionBetween(before?: number, after?: number): number {
  if (before !== undefined && after !== undefined) return (before + after) / 2;
  if (before !== undefined) return before + 1000; // dropped at the bottom
  if (after !== undefined) return after - 1000; // dropped at the top
  return 1000; // empty column
}

/** Applies a move to a task list (used for the optimistic cache update). */
export function applyTaskMove<T extends { id: string } & Positioned>(
  tasks: T[],
  move: TaskMove,
): T[] {
  return tasks.map((t) =>
    t.id === move.id
      ? { ...t, status: move.status, position: move.position }
      : t,
  );
}
