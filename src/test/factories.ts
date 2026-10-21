import type { Task, TaskAssignee } from "@/hooks/use-tasks";

/**
 * Builds a valid Task with sensible defaults. Each test overrides only
 * the fields it cares about, which keeps tests short and readable.
 */
export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    board_id: "board-1",
    title: "Design homepage hero",
    description: null,
    status: "todo",
    priority: "medium",
    due_date: null,
    tags: [],
    assigned_to: null,
    created_by: "user-1",
    position: 1000,
    created_at: "2025-01-01T09:00:00.000Z",
    updated_at: "2025-01-01T09:00:00.000Z",
    assignee: null,
    ...overrides,
  };
}

export function makeAssignee(
  overrides: Partial<TaskAssignee> = {},
): TaskAssignee {
  return {
    id: "user-2",
    full_name: "Jane Doe",
    email: "jane@example.com",
    avatar_url: null,
    ...overrides,
  };
}
