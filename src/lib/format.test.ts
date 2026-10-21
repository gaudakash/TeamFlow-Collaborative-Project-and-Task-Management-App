import { describe, expect, it } from "vitest";
import { formatRelativeTime, getInitials, isOverdue } from "./format";

describe("getInitials", () => {
  it.each([
    ["Jane Doe", "JD"],
    ["Mary Ann Smith", "MS"], // first + last name
    ["jane@example.com", "J"],
    ["  padded   name  ", "PN"],
    ["", "?"],
    ["   ", "?"],
    [null, "?"],
    [undefined, "?"],
  ])("getInitials(%j) → %s", (input, expected) => {
    expect(getInitials(input)).toBe(expected);
  });
});

describe("isOverdue", () => {
  const today = new Date(2025, 2, 14, 15, 30); // Mar 14, 2025, 3:30 PM local time

  it("is overdue when the due date was yesterday", () => {
    expect(isOverdue("2025-03-13", today)).toBe(true);
  });

  it("is NOT overdue when due today, even late in the day", () => {
    expect(isOverdue("2025-03-14", today)).toBe(false);
  });

  it("is not overdue for future dates", () => {
    expect(isOverdue("2025-03-15", today)).toBe(false);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2025-03-14T12:00:00.000Z");
  const ago = (seconds: number) =>
    new Date(now.getTime() - seconds * 1000).toISOString();

  it('says "just now" for less than a minute', () => {
    expect(formatRelativeTime(ago(30), now)).toBe("just now");
  });

  it("formats minutes, hours, and days", () => {
    expect(formatRelativeTime(ago(5 * 60), now)).toBe("5 minutes ago");
    expect(formatRelativeTime(ago(3 * 3600), now)).toBe("3 hours ago");
    expect(formatRelativeTime(ago(86_400), now)).toBe("yesterday");
  });
});
