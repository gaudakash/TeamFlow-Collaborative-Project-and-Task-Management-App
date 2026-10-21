import { describe, expect, it } from "vitest";
import {
  UNASSIGNED,
  emptyTaskForm,
  parseTags,
  taskSchema,
  toTaskFormValues,
  toTaskPayload,
  type TaskFormValues,
} from "./task";

const valid = (patch: Partial<TaskFormValues> = {}): TaskFormValues => ({
  ...emptyTaskForm("todo"),
  title: "Write launch copy",
  ...patch,
});

/** Returns the first validation message, or undefined if the values are valid */
function firstError(values: unknown) {
  const result = taskSchema.safeParse(values);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("parseTags", () => {
  it("trims, lowercases, removes empties, and removes duplicates", () => {
    expect(parseTags("Design, bug, design ,, UI ")).toEqual([
      "design",
      "bug",
      "ui",
    ]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseTags("   ")).toEqual([]);
  });
});

describe("taskSchema", () => {
  it("accepts a valid task", () => {
    expect(firstError(valid())).toBeUndefined();
  });

  it.each([
    ["empty title", { title: "" }, "Title is required"],
    ["whitespace-only title", { title: "    " }, "Title is required"],
    [
      "title over 200 characters",
      { title: "a".repeat(201) },
      "Keep it under 200 characters",
    ],
    ["more than 5 tags", { tags: "a, b, c, d, e, f" }, "Up to 5 tags"],
    [
      "a tag over 20 characters",
      { tags: "a".repeat(21) },
      "Each tag must be 20 characters or less",
    ],
    ["an invalid date", { due_date: "tomorrow" }, "Invalid date"],
  ])("rejects %s", (_label, patch, message) => {
    expect(firstError(valid(patch))).toBe(message);
  });

  it("allows exactly 5 tags and duplicates that collapse to 5 or fewer", () => {
    expect(firstError(valid({ tags: "a, b, c, d, e" }))).toBeUndefined();
    expect(firstError(valid({ tags: "a, A, b, B, c, C" }))).toBeUndefined();
  });

  it("allows an empty due date", () => {
    expect(firstError(valid({ due_date: "" }))).toBeUndefined();
  });

  it("rejects unknown status and priority values", () => {
    expect(firstError({ ...valid(), status: "archived" })).toBeDefined();
    expect(firstError({ ...valid(), priority: "critical" })).toBeDefined();
  });
});

describe("toTaskPayload (form → database)", () => {
  it("converts empty strings to null and parses tags", () => {
    expect(
      toTaskPayload(
        valid({
          title: "  Ship it  ",
          description: "   ",
          due_date: "",
          assigned_to: UNASSIGNED,
          tags: "Bug, bug",
        }),
      ),
    ).toEqual({
      title: "Ship it",
      description: null,
      status: "todo",
      priority: "medium",
      due_date: null,
      assigned_to: null,
      tags: ["bug"],
    });
  });

  it("keeps a real assignee id", () => {
    expect(toTaskPayload(valid({ assigned_to: "user-123" })).assigned_to).toBe(
      "user-123",
    );
  });
});

describe("toTaskFormValues (database → form)", () => {
  it("round-trips with toTaskPayload", () => {
    const payload = toTaskPayload(
      valid({
        description: "Details",
        due_date: "2025-03-14",
        assigned_to: "user-1",
        tags: "ui, design",
      }),
    );
    expect(toTaskPayload(toTaskFormValues(payload))).toEqual(payload);
  });
});
