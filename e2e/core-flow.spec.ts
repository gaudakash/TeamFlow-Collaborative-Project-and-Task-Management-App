import { expect, test } from "@playwright/test";
import {
  column,
  createBoard,
  createTask,
  createWorkspace,
  makeUser,
  signUp,
} from "./helpers";

test("signup → create workspace → create board → create task", async ({
  page,
}) => {
  await signUp(page, makeUser("owner"));
  await createWorkspace(page, "Acme Inc.");
  await createBoard(page, "Website Redesign");
  await createTask(page, {
    title: "Design homepage hero",
    column: "In Progress",
    priority: "High",
  });

  const inProgress = column(page, "In Progress");
  await expect(inProgress.getByText("High", { exact: true })).toBeVisible();

  // Saved in the database, not just in the cache
  await page.reload();
  await expect(
    column(page, "In Progress").getByText("Design homepage hero", {
      exact: true,
    }),
  ).toBeVisible();
});
