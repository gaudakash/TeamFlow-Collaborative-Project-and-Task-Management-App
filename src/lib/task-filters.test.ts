import { describe, expect, it } from "vitest";
import {
  ASSIGNEE_ME,
  ASSIGNEE_NONE,
  DEFAULT_FILTERS,
  buildBoardColumns,
  countActiveFilters,
  filterTasks,
  matchesDueFilter,
  parseTaskFilters,
  serializeTaskFilters,
  sortTasks,
  type FilterableTask,
  type TaskFilters,
} from "./task-filters";

const TODAY = new Date(2025, 2, 14); // Friday, Mar 14, 2025 (local time)
const ME = "me-id";
const OTHER = "11111111-1111-4111-8111-111111111111";
const ctx = { currentUserId: ME, today: TODAY };

function task(overrides: Partial<FilterableTask> = {}): FilterableTask {
  return {
    title: "Task",
    description: null,
    status: "todo",
    priority: "medium",
    due_date: null,
    assigned_to: null,
    tags: [],
    created_at: "2025-01-01T00:00:00.000Z",
    position: 1000,
    ...overrides,
  };
}

const filters = (patch: Partial<TaskFilters>): TaskFilters => ({
  ...DEFAULT_FILTERS,
  ...patch,
});
const titles = (tasks: FilterableTask[]) => tasks.map((t) => t.title);

// ---------------------------------------------------------------
describe("parseTaskFilters (URL → filters)", () => {
  it("reads valid values", () => {
    const params = new URLSearchParams(
      `q=design&status=review&priority=high&assignee=${OTHER}&due=overdue&sort=priority`,
    );
    expect(parseTaskFilters(params)).toEqual({
      q: "design",
      status: "review",
      priority: "high",
      assignee: OTHER,
      due: "overdue",
      sort: "priority",
    });
  });

  it("ignores invalid or malicious values instead of crashing", () => {
    const params = new URLSearchParams(
      "priority=banana&status=<script>&sort=hack&assignee=xyz&due=yesterday",
    );
    expect(parseTaskFilters(params)).toEqual(DEFAULT_FILTERS);
  });

  it('accepts the special "me" and "unassigned" assignee values', () => {
    expect(parseTaskFilters(new URLSearchParams("assignee=me")).assignee).toBe(
      ASSIGNEE_ME,
    );
    expect(
      parseTaskFilters(new URLSearchParams("assignee=unassigned")).assignee,
    ).toBe(ASSIGNEE_NONE);
  });

  it("limits the search query to 100 characters", () => {
    const params = new URLSearchParams({ q: "a".repeat(500) });
    expect(parseTaskFilters(params).q).toHaveLength(100);
  });
});

describe("serializeTaskFilters (filters → URL)", () => {
  it("produces an empty query string for default filters", () => {
    expect(serializeTaskFilters(DEFAULT_FILTERS).toString()).toBe("");
  });

  it("round-trips through the URL without losing anything", () => {
    const original = filters({
      q: "bug",
      priority: "urgent",
      assignee: ASSIGNEE_ME,
      sort: "due_date",
    });
    expect(parseTaskFilters(serializeTaskFilters(original))).toEqual(original);
  });

  it("trims whitespace-only searches out of the URL", () => {
    expect(serializeTaskFilters(filters({ q: "   " })).has("q")).toBe(false);
  });
});

describe("countActiveFilters", () => {
  it("counts filters but not the sort or blank searches", () => {
    expect(
      countActiveFilters(filters({ q: "  ", priority: "high", sort: "title" })),
    ).toBe(1);
    expect(
      countActiveFilters(filters({ q: "x", status: "done", due: "none" })),
    ).toBe(3);
  });
});

// ---------------------------------------------------------------
describe("filterTasks", () => {
  it("searches title, description, and tags (case-insensitive)", () => {
    const tasks = [
      task({ title: "Homepage DESIGN" }),
      task({ title: "B", description: "needs a new design system" }),
      task({ title: "C", tags: ["design"] }),
      task({ title: "Unrelated" }),
    ];
    expect(titles(filterTasks(tasks, filters({ q: "Design" }), ctx))).toEqual([
      "Homepage DESIGN",
      "B",
      "C",
    ]);
  });

  it("filters by priority and status", () => {
    const tasks = [
      task({ title: "high todo", priority: "high" }),
      task({ title: "high done", priority: "high", status: "done" }),
      task({ title: "low todo", priority: "low" }),
    ];
    expect(
      titles(filterTasks(tasks, filters({ priority: "high" }), ctx)),
    ).toEqual(["high todo", "high done"]);
    expect(
      titles(filterTasks(tasks, filters({ status: "done" }), ctx)),
    ).toEqual(["high done"]);
  });

  describe("assignee", () => {
    const tasks = [
      task({ title: "mine", assigned_to: ME }),
      task({ title: "theirs", assigned_to: OTHER }),
      task({ title: "nobody", assigned_to: null }),
    ];

    it.each([
      [ASSIGNEE_ME, ["mine"]],
      [ASSIGNEE_NONE, ["nobody"]],
      [OTHER, ["theirs"]],
    ])("assignee=%s", (assignee, expected) => {
      expect(titles(filterTasks(tasks, filters({ assignee }), ctx))).toEqual(
        expected,
      );
    });
  });

  it("combines filters with AND", () => {
    const tasks = [
      task({ title: "design high", priority: "high" }),
      task({ title: "design low", priority: "low" }),
      task({ title: "other high", priority: "high" }),
    ];
    expect(
      titles(
        filterTasks(tasks, filters({ q: "design", priority: "high" }), ctx),
      ),
    ).toEqual(["design high"]);
  });
});

describe("matchesDueFilter", () => {
  it("overdue: past dates, but never for Done tasks", () => {
    expect(
      matchesDueFilter(task({ due_date: "2025-03-13" }), "overdue", TODAY),
    ).toBe(true);
    expect(
      matchesDueFilter(
        task({ due_date: "2025-03-13", status: "done" }),
        "overdue",
        TODAY,
      ),
    ).toBe(false);
    expect(
      matchesDueFilter(task({ due_date: "2025-03-14" }), "overdue", TODAY),
    ).toBe(false);
  });

  it("today: exactly today", () => {
    expect(
      matchesDueFilter(task({ due_date: "2025-03-14" }), "today", TODAY),
    ).toBe(true);
    expect(
      matchesDueFilter(task({ due_date: "2025-03-15" }), "today", TODAY),
    ).toBe(false);
  });

  it("week: today through 6 days from now", () => {
    expect(
      matchesDueFilter(task({ due_date: "2025-03-14" }), "week", TODAY),
    ).toBe(true);
    expect(
      matchesDueFilter(task({ due_date: "2025-03-20" }), "week", TODAY),
    ).toBe(true);
    expect(
      matchesDueFilter(task({ due_date: "2025-03-21" }), "week", TODAY),
    ).toBe(false);
    expect(
      matchesDueFilter(task({ due_date: "2025-03-13" }), "week", TODAY),
    ).toBe(false);
  });

  it("none: tasks without a due date", () => {
    expect(matchesDueFilter(task({ due_date: null }), "none", TODAY)).toBe(
      true,
    );
    expect(
      matchesDueFilter(task({ due_date: "2025-03-14" }), "none", TODAY),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------
describe("sortTasks", () => {
  it("priority: urgent → high → medium → low", () => {
    const tasks = [
      task({ title: "low", priority: "low" }),
      task({ title: "urgent", priority: "urgent" }),
      task({ title: "medium", priority: "medium" }),
      task({ title: "high", priority: "high" }),
    ];
    expect(titles(sortTasks(tasks, "priority"))).toEqual([
      "urgent",
      "high",
      "medium",
      "low",
    ]);
  });

  it("due date: earliest first, tasks without a date last", () => {
    const tasks = [
      task({ title: "none", due_date: null }),
      task({ title: "later", due_date: "2025-04-01" }),
      task({ title: "sooner", due_date: "2025-03-15" }),
    ];
    expect(titles(sortTasks(tasks, "due_date"))).toEqual([
      "sooner",
      "later",
      "none",
    ]);
  });

  it("title: alphabetical, ignoring case", () => {
    const tasks = [
      task({ title: "banana" }),
      task({ title: "Apple" }),
      task({ title: "cherry" }),
    ];
    expect(titles(sortTasks(tasks, "title"))).toEqual([
      "Apple",
      "banana",
      "cherry",
    ]);
  });

  it("newest: most recently created first", () => {
    const tasks = [
      task({ title: "old", created_at: "2025-01-01T00:00:00.000Z" }),
      task({ title: "new", created_at: "2025-03-01T00:00:00.000Z" }),
    ];
    expect(titles(sortTasks(tasks, "newest"))).toEqual(["new", "old"]);
  });

  it("returns a new array and never mutates the input", () => {
    const tasks = [
      task({ title: "b", position: 2000 }),
      task({ title: "a", position: 1000 }),
    ];
    const sorted = sortTasks(tasks, "manual");
    expect(sorted).not.toBe(tasks);
    expect(titles(tasks)).toEqual(["b", "a"]);
  });
});

describe("buildBoardColumns", () => {
  it("filters, groups by status, and reports the visible count", () => {
    const tasks = [
      task({ title: "A", status: "todo", priority: "high" }),
      task({ title: "B", status: "done", priority: "high" }),
      task({ title: "C", status: "todo", priority: "low" }),
    ];
    const { columns, visibleCount } = buildBoardColumns(
      tasks,
      filters({ priority: "high" }),
      ctx,
    );
    expect(visibleCount).toBe(2);
    expect(titles(columns.todo)).toEqual(["A"]);
    expect(titles(columns.done)).toEqual(["B"]);
  });
});
