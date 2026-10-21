"use client";

import "./globals.css";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Replaces the root layout entirely, so it must render its own <html> and <body>
export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground antialiased">
        <div role="alert" className="max-w-md text-center">
          <h1 className="text-xl font-semibold">
            TeamFlow hit an unexpected error
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please try again.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
