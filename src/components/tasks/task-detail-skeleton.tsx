import { Skeleton } from "@/components/ui/skeleton";

export function TaskDetailSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[1fr_300px]"
      aria-busy="true"
      aria-label="Loading task"
    >
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
