"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/shared/error-state";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: Props) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <main className="px-4">
      <ErrorState
        digest={error.digest}
        onRetry={retry}
        homeHref="/"
        homeLabel="Go home"
      />
    </main>
  );
}
