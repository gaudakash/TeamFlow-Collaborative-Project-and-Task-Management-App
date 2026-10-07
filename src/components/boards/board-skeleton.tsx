import { Skeleton } from "@/components/ui/skeleton";
import { TASK_STATUSES } from "@/lib/task-config";
import { cn } from "@/lib/utils";

export const BOARD_SCROLL_CLASS =
  "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:snap-none";

export const COLUMN_WIDTH_CLASS =
  "w-[85vw] max-w-xs shrink-0 snap-start sm:w-72 xl:w-auto xl:min-w-0 xl:max-w-none xl:flex-1";

export function BoardSkeleton() {
  return (
    <div
      className={BOARD_SCROLL_CLASS}
      aria-busy="true"
      aria-label="Loading board"
    >
      {TASK_STATUSES.map((status) => (
        <div
          key={status}
          className={cn(
            COLUMN_WIDTH_CLASS,
            "space-y-2 rounded-xl bg-muted/60 p-3",
          )}
        >
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ))}
    </div>
  );
}
