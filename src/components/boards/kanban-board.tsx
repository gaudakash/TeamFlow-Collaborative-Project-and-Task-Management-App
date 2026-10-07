"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type Active,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Over,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useMoveTask, useTasks, type Task } from "@/hooks/use-tasks";
import {
  STATUS_CONFIG,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/task-config";
import { getPositionBetween, groupTasksByStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { BoardColumn } from "./board-column";
import { BOARD_SCROLL_CLASS, BoardSkeleton } from "./board-skeleton";

type Columns = Record<TaskStatus, Task[]>;

/**
 * While dragging, we show a LOCAL copy of the columns (so cards can move between
 * columns smoothly). `base` remembers which cache data it was built from: as soon as
 * the cache changes (optimistic update or refetch), we fall back to the cache.
 */
type DragState = { base: Task[]; columns: Columns };

function isStatus(id: string): id is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(id);
}

/** Which column contains this id? (id can be a column id or a task id) */
function findColumn(columns: Columns, id: string): TaskStatus | undefined {
  if (isStatus(id)) return id;
  return TASK_STATUSES.find((s) => columns[s].some((t) => t.id === id));
}

// ---------- Screen reader announcements ----------
const taskTitle = (active: Active) =>
  `"${active.data.current?.title ?? "task"}"`;
const columnLabel = (over: Over) => {
  const status = over.data.current?.status as TaskStatus | undefined;
  return status ? STATUS_CONFIG[status].label : "a column";
};

const announcements: Announcements = {
  onDragStart: ({ active }) => `Picked up task ${taskTitle(active)}.`,
  onDragOver: ({ active, over }) =>
    over
      ? `Task ${taskTitle(active)} is over ${columnLabel(over)}.`
      : `Task ${taskTitle(active)} is no longer over a column.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `Task ${taskTitle(active)} was dropped in ${columnLabel(over)}.`
      : `Task ${taskTitle(active)} was dropped.`,
  onDragCancel: ({ active }) =>
    `Moving cancelled. Task ${taskTitle(active)} returned to its original position.`,
};

const screenReaderInstructions = {
  draggable:
    "To pick up a task, press Space or Enter. Use the arrow keys to move it within or between columns. Press Space or Enter again to drop, or Escape to cancel.",
};

type Props = {
  boardId: string;
  workspaceId: string;
};

export function KanbanBoard({ boardId, workspaceId }: Props) {
  const { data: tasks, isPending, isError, error, refetch } = useTasks(boardId);
  const moveTask = useMoveTask(boardId);

  const openCreate = useTaskDialogStore((s) => s.openCreate);
  const openEdit = useTaskDialogStore((s) => s.openEdit);
  const close = useTaskDialogStore((s) => s.close);
  useEffect(() => () => close(), [close]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const grouped = useMemo(() => groupTasksByStatus(tasks ?? []), [tasks]);
  const columns = drag && drag.base === tasks ? drag.columns : grouped;
  const activeTask = activeId
    ? tasks?.find((t) => t.id === activeId)
    : undefined;

  const sensors = useSensors(
    // Mouse: must move 8px before a drag starts, so normal clicks still open the task
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // Touch: long-press 250ms to drag, so normal swipes still scroll the board
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    // Keyboard: arrow keys move between positions and columns
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const resetDrag = () => {
    setActiveId(null);
    setDrag(null);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (!tasks) return;
    setActiveId(String(active.id));
    setDrag({ base: tasks, columns: grouped });
  };

  // Fires while hovering. Moves the card into another column in LOCAL state.
  // (Reordering within the same column is animated by SortableContext.)
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;

    setDrag((prev) => {
      if (!prev) return prev;
      const activeTaskId = String(active.id);
      const from = findColumn(prev.columns, activeTaskId);
      const to = findColumn(prev.columns, String(over.id));
      if (!from || !to || from === to) return prev;

      const fromItems = prev.columns[from];
      const toItems = prev.columns[to];
      const moving = fromItems.find((t) => t.id === activeTaskId);
      if (!moving) return prev;

      const overIndex = toItems.findIndex((t) => t.id === over.id);
      const insertAt = overIndex === -1 ? toItems.length : overIndex;

      return {
        ...prev,
        columns: {
          ...prev.columns,
          [from]: fromItems.filter((t) => t.id !== activeTaskId),
          [to]: [
            ...toItems.slice(0, insertAt),
            { ...moving, status: to },
            ...toItems.slice(insertAt),
          ],
        },
      };
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || !drag) {
      resetDrag();
      return;
    }

    const taskId = String(active.id);
    const status = findColumn(drag.columns, taskId);
    const original = tasks?.find((t) => t.id === taskId);
    if (!status || !original) {
      resetDrag();
      return;
    }

    // Final order inside the destination column
    const items = drag.columns[status];
    const oldIndex = items.findIndex((t) => t.id === taskId);
    const overIndex = items.findIndex((t) => t.id === over.id);
    const newIndex =
      overIndex !== -1
        ? overIndex
        : isStatus(String(over.id))
          ? items.length - 1
          : oldIndex;
    const ordered = arrayMove(items, oldIndex, newIndex);

    // Nothing changed? Don't hit the server.
    const sameOrder =
      ordered.map((t) => t.id).join() ===
      grouped[status].map((t) => t.id).join();
    if (original.status === status && sameOrder) {
      resetDrag();
      return;
    }

    // Only the moved task gets a new position (midpoint of its new neighbors)
    const position = getPositionBetween(
      ordered[newIndex - 1]?.position,
      ordered[newIndex + 1]?.position,
    );

    // Keep showing the final order until the optimistic cache update takes over
    setDrag({
      base: drag.base,
      columns: { ...drag.columns, [status]: ordered },
    });

    moveTask.mutate(
      { id: taskId, status, position },
      {
        onError: (err) => toast.error(`Couldn't move task: ${err.message}`),
        onSettled: () => setDrag(null),
      },
    );
  };

  if (isPending) return <BoardSkeleton />;

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center"
      >
        <p className="font-medium text-destructive">Couldn&apos;t load tasks</p>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={resetDrag}
        accessibility={{ announcements, screenReaderInstructions }}
      >
        {/* Disable scroll-snap while dragging so auto-scroll isn't fighting it */}
        <div className={cn(BOARD_SCROLL_CLASS, activeId && "snap-none")}>
          {TASK_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              tasks={columns[status]}
              onAddTask={openCreate}
              onOpenTask={openEdit}
            />
          ))}
        </div>

        {/* The "floating" card that follows the cursor */}
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 cursor-grabbing rounded-lg shadow-xl">
              <TaskCard task={activeTask} onOpen={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog boardId={boardId} workspaceId={workspaceId} tasks={tasks} />
    </>
  );
}
