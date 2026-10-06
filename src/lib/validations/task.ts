import { z } from "zod";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/task-config";

/** Radix Select doesn't allow "" as a value, so we use a sentinel for "nobody". */
export const UNASSIGNED = "unassigned";

/** "Design, bug, design " → ["design", "bug"] */
export function parseTags(input: string): string[] {
  const tags = input
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(tags));
}

// Form values are kept as plain strings (what inputs produce).
// We convert to DB shape on submit. This keeps React Hook Form types simple.
export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Keep it under 200 characters"),
  description: z.string().max(5000, "Keep it under 5000 characters"),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  due_date: z
    .string()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Invalid date"),
  assigned_to: z.string(),
  tags: z
    .string()
    .refine((v) => parseTags(v).length <= 5, "Up to 5 tags")
    .refine(
      (v) => parseTags(v).every((t) => t.length <= 20),
      "Each tag must be 20 characters or less",
    ),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

/** Shape we send to Supabase */
export type TaskPayload = {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_to: string | null;
  tags: string[];
};

export function emptyTaskForm(status: TaskStatus): TaskFormValues {
  return {
    title: "",
    description: "",
    status,
    priority: "medium",
    due_date: "",
    assigned_to: UNASSIGNED,
    tags: "",
  };
}

/** Form → database */
export function toTaskPayload(values: TaskFormValues): TaskPayload {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    status: values.status,
    priority: values.priority,
    due_date: values.due_date || null,
    assigned_to: values.assigned_to === UNASSIGNED ? null : values.assigned_to,
    tags: parseTags(values.tags),
  };
}

/** Database → form (for editing) */
export function toTaskFormValues(task: TaskPayload): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    due_date: task.due_date ?? "",
    assigned_to: task.assigned_to ?? UNASSIGNED,
    tags: task.tags.join(", "),
  };
}
