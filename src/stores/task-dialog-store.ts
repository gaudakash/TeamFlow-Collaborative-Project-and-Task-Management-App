import { create } from "zustand";
import type { TaskStatus } from "@/lib/task-config";

// A discriminated union: TypeScript knows `status` exists only in "create" mode
type TaskDialogState =
  | { mode: "closed" }
  | { mode: "create"; status: TaskStatus }
  | { mode: "edit"; taskId: string };

type TaskDialogStore = {
  dialog: TaskDialogState;
  openCreate: (status: TaskStatus) => void;
  openEdit: (taskId: string) => void;
  close: () => void;
};

export const useTaskDialogStore = create<TaskDialogStore>()((set) => ({
  dialog: { mode: "closed" },
  openCreate: (status) => set({ dialog: { mode: "create", status } }),
  openEdit: (taskId) => set({ dialog: { mode: "edit", taskId } }),
  close: () => set({ dialog: { mode: "closed" } }),
}));
