"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/shared/error-state";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: Props) {
  const router = useRouter();

  useEffect(() => {
    // In production, send this to an error tracker (e.g. Sentry)
    console.error(error);
  }, [error]);

  // router.refresh() re-runs Server Components; reset() re-renders the boundary
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <ErrorState
      digest={error.digest}
      onRetry={retry}
      homeHref="/app/workspaces"
      homeLabel="Back to workspaces"
    />
  );
}
