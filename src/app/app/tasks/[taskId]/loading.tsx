import { Skeleton } from "@/components/ui/skeleton";
import { TaskDetailSkeleton } from "@/components/tasks/task-detail-skeleton";

// Shown instantly while the server page loads (Next.js streaming)
export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-48" />
      <TaskDetailSkeleton />
    </div>
  );
}
