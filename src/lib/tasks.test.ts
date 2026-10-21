import { describe, expect, it } from "vitest";
import { TASK_STATUSES } from "./task-config";
import {
  applyTaskMove,
  getNextPosition,
  getPositionBetween,
  groupTasksByStatus,
} from "./tasks";

describe("getPositionBetween", () => {
  it("returns the midpoint between two neighbors", () => {
    expect(getPositionBetween(1000, 2000)).toBe(1500);
  });

  it("goes below the last task when dropped at the bottom", () => {
    expect(getPositionBetween(3000, undefined)).toBe(4000);
  });

  it("goes above the first task when dropped at the top", () => {
    expect(getPositionBetween(undefined, 1000)).toBe(0);
  });

  it("uses a default position for an empty column", () => {
    expect(getPositionBetween()).toBe(1000);
  });

  it("keeps working after repeated drops in the same spot", () => {
    let after = 2000;
    for (let i = 0; i < 20; i++) after = getPositionBetween(1000, after);
    expect(after).toBeGreaterThan(1000);
    expect(after).toBeLessThan(2000);
  });
});

describe("groupTasksByStatus", () => {
  it("creates all 5 columns, even empty ones", () => {
    expect(Object.keys(groupTasksByStatus([]))).toEqual([...TASK_STATUSES]);
  });

  it("groups tasks and sorts each column by position", () => {
    const groups = groupTasksByStatus([
      { id: "b", status: "todo" as const, position: 2000 },
      { id: "c", status: "done" as const, position: 1000 },
      { id: "a", status: "todo" as const, position: 1000 },
    ]);
    expect(groups.todo.map((t) => t.id)).toEqual(["a", "b"]);
    expect(groups.done.map((t) => t.id)).toEqual(["c"]);
    expect(groups.backlog).toEqual([]);
  });
});

describe("getNextPosition", () => {
  it("places a new task 1000 below the lowest task in that column", () => {
    const tasks = [
      { status: "todo" as const, position: 1000 },
      { status: "todo" as const, position: 3500 },
      { status: "done" as const, position: 9000 },
    ];
    expect(getNextPosition(tasks, "todo")).toBe(4500);
  });

  it("starts at 1000 for an empty column", () => {
    expect(getNextPosition([], "review")).toBe(1000);
  });
});

describe("applyTaskMove", () => {
  const tasks = [
    { id: "1", status: "todo" as const, position: 1000 },
    { id: "2", status: "todo" as const, position: 2000 },
  ];

  it("updates only the moved task", () => {
    const result = applyTaskMove(tasks, {
      id: "1",
      status: "done",
      position: 500,
    });
    expect(result[0]).toEqual({ id: "1", status: "done", position: 500 });
    expect(result[1]).toBe(tasks[1]); // same object → React can skip re-rendering it
  });

  it("never mutates the original array (the TanStack cache must stay immutable)", () => {
    applyTaskMove(tasks, { id: "1", status: "done", position: 500 });
    expect(tasks[0]).toEqual({ id: "1", status: "todo", position: 1000 });
  });
});
