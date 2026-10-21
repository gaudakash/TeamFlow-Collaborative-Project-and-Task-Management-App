import { beforeEach, describe, expect, it } from "vitest";
import { useTaskDialogStore } from "./task-dialog-store";

describe("useTaskDialogStore", () => {
  // Zustand stores are global, so reset between tests
  beforeEach(() => {
    useTaskDialogStore.setState({ dialog: { mode: "closed" } });
  });

  it("starts closed", () => {
    expect(useTaskDialogStore.getState().dialog).toEqual({ mode: "closed" });
  });

  it("opens in create mode with a column status", () => {
    useTaskDialogStore.getState().openCreate("review");
    expect(useTaskDialogStore.getState().dialog).toEqual({
      mode: "create",
      status: "review",
    });
  });

  it("opens in edit mode with only the task id (no duplicated server data)", () => {
    useTaskDialogStore.getState().openEdit("task-42");
    expect(useTaskDialogStore.getState().dialog).toEqual({
      mode: "edit",
      taskId: "task-42",
    });
  });

  it("closes", () => {
    useTaskDialogStore.getState().openEdit("task-42");
    useTaskDialogStore.getState().close();
    expect(useTaskDialogStore.getState().dialog).toEqual({ mode: "closed" });
  });
});
