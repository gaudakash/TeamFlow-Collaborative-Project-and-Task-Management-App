import { KeyboardCode, type KeyboardCoordinateGetter } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { TASK_STATUSES, type TaskStatus } from "@/lib/task-config";

/**
 * Keyboard movement for a multi-column board:
 * - ArrowLeft / ArrowRight → jump exactly one column (predictable for keyboard users)
 * - ArrowUp / ArrowDown    → reorder within the column (dnd-kit's default)
 *
 * dnd-kit's built-in getter guesses the target from all nearby drop zones,
 * which is unreliable across columns (especially empty ones).
 */
export const boardKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  args,
) => {
  if (event.code !== KeyboardCode.Left && event.code !== KeyboardCode.Right) {
    return sortableKeyboardCoordinates(event, args);
  }

  const { active, collisionRect, droppableRects } = args.context;
  if (!active || !collisionRect) return undefined;

  // Only columns that are currently on screen (the status filter can hide some)
  const visible = TASK_STATUSES.filter((status) => droppableRects.has(status));

  // Which column is the dragged card over right now? Use its horizontal center.
  const centerX = collisionRect.left + collisionRect.width / 2;
  let index = visible.findIndex((status) => {
    const rect = droppableRects.get(status);
    return !!rect && centerX >= rect.left && centerX <= rect.left + rect.width;
  });

  // Fallback: the status stored on the dragged card
  if (index === -1) {
    index = visible.indexOf(active.data.current?.status as TaskStatus);
  }
  if (index === -1) return undefined;

  const target = visible[index + (event.code === KeyboardCode.Right ? 1 : -1)];
  if (!target) return undefined; // already in the first/last column

  const rect = droppableRects.get(target);
  if (!rect) return undefined;

  // Move the card to the top of the target column
  return { x: rect.left, y: rect.top };
};
