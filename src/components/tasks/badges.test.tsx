import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/task-config";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";

describe("PriorityBadge", () => {
  it.each(TASK_PRIORITIES)('renders the "%s" label', (priority) => {
    render(<PriorityBadge priority={priority} />);
    expect(
      screen.getByText(PRIORITY_CONFIG[priority].label),
    ).toBeInTheDocument();
  });

  it("does not rely on color alone: the icon is decorative, the text carries the meaning", () => {
    const { container } = render(<PriorityBadge priority="urgent" />);
    expect(screen.getByText("Urgent")).toBeVisible();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

describe("StatusBadge", () => {
  it.each(TASK_STATUSES)('renders the "%s" label', (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(STATUS_CONFIG[status].label)).toBeInTheDocument();
  });

  it("renders human-readable labels, not raw database values", () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.queryByText("in_progress")).not.toBeInTheDocument();
  });
});
