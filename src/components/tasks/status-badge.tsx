import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG, type TaskStatus } from "@/lib/task-config";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, dotClass } = STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className="gap-1.5">
      <span className={cn("size-2 rounded-full", dotClass)} aria-hidden />
      {label}
    </Badge>
  );
}
