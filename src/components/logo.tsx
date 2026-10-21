import Link from "next/link";
import { KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  hideTextOnMobile?: boolean;
};

export function Logo({ href = "/", hideTextOnMobile = false }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <KanbanSquare className="size-4" aria-hidden />
      </span>
      {/* sr-only (not hidden) keeps an accessible name for the link on mobile */}
      <span className={cn(hideTextOnMobile && "sr-only sm:not-sr-only")}>
        TeamFlow
      </span>
    </Link>
  );
}
