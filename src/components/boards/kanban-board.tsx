"use client";

import { useEffect, useMemo, useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
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
import { SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LiveIndicator } from "@/components/shared/live-indicator";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useRealtimeBoardTasks } from "@/hooks/use-realtime-tasks";
import { useMoveTask, useTasks, type Task } from "@/hooks/use-tasks";
import { useTaskFilters } from "@/hooks/use-task-filters";
import { mutationKeys } from "@/lib/query-keys";
import {
  STATUS_CONFIG,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/task-config";
import { buildBoardColumns } from "@/lib/task-filters";
import { getPositionBetween } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { BoardColumn } from "./board-column";
import { BOARD_SCROLL_CLASS, BoardSkeleton } from "./board-skeleton";
import { BoardToolbar } from "./board-toolbar";

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
  currentUserId: string;
};

export function KanbanBoard({ boardId, workspaceId, currentUserId }: Props) {
  const { data: tasks, isPending, isError, error, refetch } = useTasks(boardId);
  const moveTask = useMoveTask(boardId);
  const { filters, clearFilters, activeCount } = useTaskFilters();

  const openCreate = useTaskDialogStore((s) => s.openCreate);
  const openEdit = useTaskDialogStore((s) => s.openEdit);
  const close = useTaskDialogStore((s) => s.close);
  useEffect(() => () => close(), [close]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Pause live updates while the user is dragging or a move is saving,
  // so a teammate's change never yanks a card out from under the cursor.
  const isMoving =
    useIsMutating({ mutationKey: mutationKeys.moveTask(boardId) }) > 0;
  const liveStatus = useRealtimeBoardTasks(boardId, {
    paused: activeId !== null || isMoving,
  });

  // Filter → group → sort (pure function, recalculated only when inputs change)
  const { columns: filteredColumns, visibleCount } = useMemo(
    () => buildBoardColumns(tasks ?? [], filters, { currentUserId }),
    [tasks, filters, currentUserId],
  );

  const columns = drag && drag.base === tasks ? drag.columns : filteredColumns;
  const activeTask = activeId
    ? tasks?.find((t) => t.id === activeId)
    : undefined;
  const dragDisabled = filters.sort !== "manual";
  const isFiltered = activeCount > 0;
  const visibleStatuses = filters.status ? [filters.status] : TASK_STATUSES;

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
    setDrag({ base: tasks, columns: filteredColumns });
  };

  // Fires while hovering. Moves the card into another column in LOCAL state.
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
      filteredColumns[status].map((t) => t.id).join();
    if (original.status === status && sameOrder) {
      resetDrag();
      return;
    }

    // Midpoint between the VISIBLE neighbors. Hidden (filtered-out) tasks keep their positions.
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <LiveIndicator status={liveStatus} />
      </div>

      <BoardToolbar
        workspaceId={workspaceId}
        totalCount={tasks.length}
        visibleCount={visibleCount}
      />

      {isFiltered && visibleCount === 0 && tasks.length > 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-background p-6 text-center">
          <SearchX className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">No tasks match your filters</p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}

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
          {visibleStatuses.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              tasks={columns[status]}
              onAddTask={openCreate}
              onOpenTask={openEdit}
              dragDisabled={dragDisabled}
              isFiltered={isFiltered}
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
    </div>
  );
}
