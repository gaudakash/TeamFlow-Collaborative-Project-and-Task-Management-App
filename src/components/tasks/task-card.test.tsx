import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDueDate } from "@/lib/format";
import { makeAssignee, makeTask } from "@/test/factories";
import { TaskCard } from "./task-card";

describe("TaskCard", () => {
  // Freeze "today" so overdue checks give the same result on any day.
  // Only Date is faked, so user-event's internal timers keep working.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2025, 2, 14, 12, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the title, priority, and tags", () => {
    render(
      <TaskCard
        task={makeTask({ priority: "high", tags: ["design", "ui"] })}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByText("Design homepage hero")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();

    const tags = screen.getByRole("list", { name: "Tags" });
    expect(tags).toHaveTextContent("#design");
    expect(tags).toHaveTextContent("#ui");
  });

  it("hides the tag list when there are no tags", () => {
    render(<TaskCard task={makeTask({ tags: [] })} onOpen={vi.fn()} />);
    expect(
      screen.queryByRole("list", { name: "Tags" }),
    ).not.toBeInTheDocument();
  });

  it("shows the due date without an overdue warning when it is in the future", () => {
    render(
      <TaskCard task={makeTask({ due_date: "2025-03-20" })} onOpen={vi.fn()} />,
    );
    expect(screen.getByText(formatDueDate("2025-03-20"))).toBeInTheDocument();
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });

  it("announces overdue tasks to screen readers", () => {
    render(
      <TaskCard task={makeTask({ due_date: "2025-03-10" })} onOpen={vi.fn()} />,
    );
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it("does not mark Done tasks as overdue", () => {
    render(
      <TaskCard
        task={makeTask({ due_date: "2025-03-10", status: "done" })}
        onOpen={vi.fn()}
      />,
    );
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });

  it("shows the assignee initials and an accessible name", () => {
    render(
      <TaskCard
        task={makeTask({ assignee: makeAssignee() })}
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByText("Assigned to Jane Doe")).toBeInTheDocument();
  });

  it("calls onOpen with the task id when clicked", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<TaskCard task={makeTask({ id: "task-99" })} onOpen={onOpen} />);

    await user.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledExactlyOnceWith("task-99");
  });

  it("can be opened with the keyboard", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<TaskCard task={makeTask()} onOpen={onOpen} />);

    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
