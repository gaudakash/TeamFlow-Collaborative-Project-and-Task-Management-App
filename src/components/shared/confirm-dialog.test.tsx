import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

function setup() {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      trigger={<button type="button">Delete board</button>}
      title="Delete board?"
      description="This cannot be undone."
      confirmLabel="Delete"
      onConfirm={onConfirm}
    />,
  );
  const trigger = screen.getByRole("button", { name: "Delete board" });
  return { user, onConfirm, trigger };
}

describe("ConfirmDialog", () => {
  it("opens an accessible alert dialog with a title and description", async () => {
    const { user, trigger } = setup();
    await user.click(trigger);

    const dialog = screen.getByRole("alertdialog", { name: "Delete board?" });
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
  });

  it("moves focus to Cancel first, so pressing Enter by accident is safe", async () => {
    const { user, trigger, onConfirm } = setup();
    await user.click(trigger);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus(),
    );
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const { user, trigger, onConfirm } = setup();
    await user.click(trigger);
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("traps focus inside the dialog while open", async () => {
    const { user, trigger } = setup();
    await user.click(trigger);

    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Delete" });
    await waitFor(() => expect(cancel).toHaveFocus());

    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus(); // wrapped around, never escaped to the page behind
  });

  it("calls onConfirm once when confirmed", async () => {
    const { user, trigger, onConfirm } = setup();
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });
});
