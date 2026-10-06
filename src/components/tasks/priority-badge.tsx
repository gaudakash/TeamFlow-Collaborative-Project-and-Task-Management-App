import { ArrowDown, ArrowUp, Flame, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_CONFIG, type TaskPriority } from "@/lib/task-config";
import { cn } from "@/lib/utils";

const ICONS = {
  low: ArrowDown,
  medium: Minus,
  high: ArrowUp,
  urgent: Flame,
} as const;

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, className } = PRIORITY_CONFIG[priority];
  const Icon = ICONS[priority];

  return (
    // Text label + icon, not color only, so it's accessible to color-blind users
    <Badge
      variant="outline"
      className={cn("gap-1 border-transparent", className)}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}
