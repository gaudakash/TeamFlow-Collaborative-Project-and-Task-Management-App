"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  DEFAULT_FILTERS,
  countActiveFilters,
  parseTaskFilters,
  serializeTaskFilters,
  type TaskFilters,
} from "@/lib/task-filters";

function writeUrl(pathname: string, filters: TaskFilters) {
  const qs = serializeTaskFilters(filters).toString();
  // Shallow update: Next.js keeps useSearchParams in sync, but there is
  // no server round trip and no new history entry for every keystroke.
  window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
}

/** The URL is the single source of truth for board filters. */
export function useTaskFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const filters = useMemo(() => parseTaskFilters(searchParams), [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<TaskFilters>) => {
      // Read the CURRENT url (not the value from the last render),
      // so two quick updates in a row don't overwrite each other.
      const current = parseTaskFilters(
        new URLSearchParams(window.location.search),
      );
      writeUrl(pathname, { ...current, ...patch });
    },
    [pathname],
  );

  /** Clears all filters but keeps the chosen sort. */
  const clearFilters = useCallback(() => {
    const current = parseTaskFilters(
      new URLSearchParams(window.location.search),
    );
    writeUrl(pathname, { ...DEFAULT_FILTERS, sort: current.sort });
  }, [pathname]);

  return {
    filters,
    setFilters,
    clearFilters,
    activeCount: countActiveFilters(filters),
  };
}
