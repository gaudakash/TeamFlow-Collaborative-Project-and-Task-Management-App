import { expect, test, type Page } from "@playwright/test";
import {
  column,
  createBoard,
  createTask,
  createWorkspace,
  makeUser,
  signUp,
} from "./helpers";

const COLUMNS = ["Backlog", "To Do", "In Progress", "Review", "Done"];

/** Returns the name of the column that contains the task (for clear failure messages). */
async function columnOf(page: Page, title: string) {
  for (const name of COLUMNS) {
    if (
      (await column(page, name).getByText(title, { exact: true }).count()) > 0
    )
      return name;
  }
  return "not found";
}

test("move a task with the keyboard and verify its status is saved", async ({
  page,
}) => {
  await signUp(page, makeUser("mover"));
  await createWorkspace(page, "Move Test");
  await createBoard(page, "Sprint 1");

  const title = "Write release notes";
  await createTask(page, { title, column: "To Do" });

  const handle = page.getByRole("button", { name: `Move task: ${title}` });

  // Start listening BEFORE dropping, so we can wait for the save to finish
  const saved = page.waitForResponse(
    (res) =>
      res.url().includes("/rest/v1/tasks") &&
      res.request().method() === "PATCH",
  );

  // 1. Pick up with the keyboard
  await handle.focus();
  await page.keyboard.press("Space");
  await expect(handle).toHaveAttribute("aria-pressed", "true");

  // 2. Move exactly one column to the right
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => columnOf(page, title), {
      message: "Column containing the task after ArrowRight",
    })
    .toBe("In Progress");

  // 3. Drop
  await page.keyboard.press("Space");
  await expect(
    page.getByText(`Task "${title}" was dropped in In Progress.`),
  ).toBeAttached();
  expect((await saved).ok()).toBe(true);

  // 4. After a reload, the task must still be in the new column
  await page.reload();
  await expect(
    column(page, "In Progress").getByText(title, { exact: true }),
  ).toBeVisible();
  await expect(
    column(page, "To Do").getByText(title, { exact: true }),
  ).toHaveCount(0);

  // 5. And the status field agrees
  await column(page, "In Progress").getByText(title, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit task" });
  await expect(dialog.getByLabel("Status", { exact: true })).toHaveText(
    "In Progress",
  );
});
