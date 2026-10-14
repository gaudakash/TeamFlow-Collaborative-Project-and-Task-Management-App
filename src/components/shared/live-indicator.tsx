import { cn } from "@/lib/utils";
import type { RealtimeStatus } from "@/hooks/use-realtime-channel";

const CONFIG: Record<RealtimeStatus, { label: string; dotClass: string }> = {
  connecting: { label: "Connecting…", dotClass: "bg-amber-500" },
  live: { label: "Live", dotClass: "bg-emerald-500 motion-safe:animate-pulse" },
  offline: { label: "Offline, reconnecting…", dotClass: "bg-destructive" },
};

export function LiveIndicator({ status }: { status: RealtimeStatus }) {
  const { label, dotClass } = CONFIG[status];

  return (
    // role="status" → screen readers announce when the connection changes
    <span
      role="status"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <span className={cn("size-2 rounded-full", dotClass)} aria-hidden />
      {label}
    </span>
  );
}
