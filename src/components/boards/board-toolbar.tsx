"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMembers } from "@/hooks/use-members";
import { useTaskFilters } from "@/hooks/use-task-filters";
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/task-config";
import {
  ASSIGNEE_ME,
  ASSIGNEE_NONE,
  DUE_FILTERS,
  DUE_FILTER_LABELS,
  SORT_LABELS,
  TASK_SORTS,
  type DueFilter,
  type TaskSort,
} from "@/lib/task-filters";

/** Radix Select doesn't allow "" as a value, so "all" means "no filter" */
const ALL = "all";

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
};

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: FilterSelectProps) {
  return (
    <div>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

type Props = {
  workspaceId: string;
  totalCount: number;
  visibleCount: number;
};

export function BoardToolbar({ workspaceId, totalCount, visibleCount }: Props) {
  const { filters, setFilters, clearFilters, activeCount } = useTaskFilters();
  const { data: members = [] } = useMembers(workspaceId);
  const inputRef = useRef<HTMLInputElement>(null);

  // ----- Search: local state for instant typing, debounced into the URL -----
  const [search, setSearch] = useState(filters.q);
  const debouncedSearch = useDebouncedValue(search, 300);

  // If the URL's q changes from OUTSIDE the input (e.g. "Clear filters"), update the input.
  // This "adjust state during render" pattern is recommended by the React docs.
  const [syncedQ, setSyncedQ] = useState(filters.q);
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    if (filters.q !== debouncedSearch.trim()) setSearch(filters.q);
  }

  // Keep the latest values in a ref, so the effect below runs ONLY when the debounced text changes
  const latest = useRef({ q: filters.q, setFilters });
  useEffect(() => {
    latest.current = { q: filters.q, setFilters };
  });

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next !== latest.current.q.trim())
      latest.current.setFilters({ q: next });
  }, [debouncedSearch]);

  // ----- Press "/" anywhere to focus search (like GitHub and Linear) -----
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey)
        return;
      const target = event.target as HTMLElement;
      if (
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      )
        return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isSorted = filters.sort !== "manual";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Label htmlFor="task-search" className="sr-only">
            Search tasks
          </Label>
          <Input
            ref={inputRef}
            id="task-search"
            type="search"
            placeholder="Search tasks…  ( / )"
            autoComplete="off"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && search) {
                e.preventDefault();
                setSearch("");
              }
            }}
            className="pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <FilterSelect
            id="filter-priority"
            label="Filter by priority"
            value={filters.priority ?? ALL}
            onChange={(v) =>
              setFilters({ priority: v === ALL ? null : (v as TaskPriority) })
            }
          >
            <SelectItem value={ALL}>All priorities</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_CONFIG[p].label}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            id="filter-status"
            label="Filter by status"
            value={filters.status ?? ALL}
            onChange={(v) =>
              setFilters({ status: v === ALL ? null : (v as TaskStatus) })
            }
          >
            <SelectItem value={ALL}>All statuses</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            id="filter-assignee"
            label="Filter by assignee"
            value={filters.assignee ?? ALL}
            onChange={(v) => setFilters({ assignee: v === ALL ? null : v })}
          >
            <SelectItem value={ALL}>Anyone</SelectItem>
            <SelectItem value={ASSIGNEE_ME}>Assigned to me</SelectItem>
            <SelectItem value={ASSIGNEE_NONE}>Unassigned</SelectItem>
            {members.length > 0 && <SelectSeparator />}
            {members.map(({ profile }) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.full_name || profile.email}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            id="filter-due"
            label="Filter by due date"
            value={filters.due ?? ALL}
            onChange={(v) =>
              setFilters({ due: v === ALL ? null : (v as DueFilter) })
            }
          >
            <SelectItem value={ALL}>Any due date</SelectItem>
            {DUE_FILTERS.map((d) => (
              <SelectItem key={d} value={d}>
                {DUE_FILTER_LABELS[d]}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            id="sort-tasks"
            label="Sort tasks"
            value={filters.sort}
            onChange={(v) => setFilters({ sort: v as TaskSort })}
          >
            {TASK_SORTS.map((s) => (
              <SelectItem key={s} value={s}>
                Sort: {SORT_LABELS[s]}
              </SelectItem>
            ))}
          </FilterSelect>
        </div>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="w-fit"
          >
            <X aria-hidden /> Clear filters ({activeCount})
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        {/* aria-live: screen readers announce the new count when filters change */}
        <p aria-live="polite">
          {activeCount > 0
            ? `Showing ${visibleCount} of ${totalCount} tasks`
            : `${totalCount} ${totalCount === 1 ? "task" : "tasks"}`}
        </p>
        {isSorted && (
          <p className="text-xs">
            Drag-and-drop is paused while sorting. Choose &ldquo;Manual
            order&rdquo; to reorder.
          </p>
        )}
      </div>
    </div>
  );
}
