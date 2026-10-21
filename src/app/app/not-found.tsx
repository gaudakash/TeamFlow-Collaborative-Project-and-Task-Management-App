import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Button asChild className="mt-6">
        <Link href="/app/workspaces">Back to workspaces</Link>
      </Button>
    </div>
  );
}
