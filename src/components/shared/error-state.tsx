import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  digest?: string;
  onRetry: () => void;
  homeHref: string;
  homeLabel: string;
};

export function ErrorState({ digest, onRetry, homeHref, homeLabel }: Props) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center py-16 text-center"
    >
      <AlertTriangle className="size-10 text-destructive" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        An unexpected error occurred. Try again, and if it keeps happening,
        refresh the page.
      </p>
      {/* The digest lets you match this screen to server logs, without exposing internal details */}
      {digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Error ID: {digest}
        </p>
      )}
      <div className="mt-6 flex gap-2">
        <Button onClick={onRetry}>
          <RotateCcw aria-hidden /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href={homeHref}>{homeLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
