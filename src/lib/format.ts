/** "Jane Doe" → "JD", "jane@x.com" → "J" */
export function getInitials(nameOrEmail: string | null | undefined): string {
  if (!nameOrEmail) return "?";
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** "2025-03-14" → "Mar 14" */
export function formatDueDate(value: string): string {
  return parseDateOnly(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** True if the due date is before today (due today is NOT overdue). */
export function isOverdue(value: string, today: Date = new Date()): boolean {
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return parseDateOnly(value) < startOfToday;
}
