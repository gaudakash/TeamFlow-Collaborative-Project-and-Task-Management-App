import { Skeleton } from "@/components/ui/skeleton";
import { BoardSkeleton } from "@/components/boards/board-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
      </div>
      <BoardSkeleton />
    </div>
  );
}
