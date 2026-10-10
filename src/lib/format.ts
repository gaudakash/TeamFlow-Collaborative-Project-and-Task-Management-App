/** "Jane Doe" → "JD", "jane@x.com" → "J" */
export function getInitials(nameOrEmail: string | null | undefined): string {
  if (!nameOrEmail) return "?";
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * "2025-03-14" → local Date.
 * new Date("2025-03-14") parses as UTC midnight, which shows as March 13
 * for anyone west of London. Parsing the parts avoids that timezone bug.
 */
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

/** ISO timestamp → "Mar 14, 2025, 3:45 PM" */
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** ISO timestamp → "just now", "5 minutes ago", "yesterday", "3 weeks ago" */
export function formatRelativeTime(
  value: string,
  now: Date = new Date(),
): string {
  const diffSeconds = Math.round(
    (new Date(value).getTime() - now.getTime()) / 1000,
  );
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return "just now";

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (abs >= seconds)
      return rtf.format(Math.round(diffSeconds / seconds), unit);
  }
  return "just now";
}
