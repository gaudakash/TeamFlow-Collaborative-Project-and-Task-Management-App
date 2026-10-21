import { expect, test } from "@playwright/test";
import {
  createBoard,
  createTask,
  createWorkspace,
  makeUser,
  pickOption,
  signUp,
} from "./helpers";

test.describe("search and filters", () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page, makeUser("filter"));
    await createWorkspace(page, "Filter Workspace");
    await createBoard(page, "Q3 Roadmap");
    await createTask(page, { title: "Fix login bug", priority: "High" });
    await createTask(page, { title: "Update docs", priority: "Low" });
    await createTask(page, {
      title: "Refactor API client",
      column: "In Progress",
      priority: "High",
    });
  });

  test("filter by priority shows only matching tasks and survives a reload", async ({
    page,
  }) => {
    await pickOption(page, page.getByLabel("Filter by priority"), "High");

    await expect(page).toHaveURL(/[?&]priority=high/);
    await expect(page.getByText("Showing 2 of 3 tasks")).toBeVisible();
    await expect(
      page.getByText("Fix login bug", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Refactor API client", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Update docs", { exact: true })).toHaveCount(0);

    await page.reload();
    // Wait for data first, otherwise "0 Update docs" would pass trivially while loading
    await expect(
      page.getByText("Fix login bug", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Update docs", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Filter by priority")).toHaveText("High");
  });

  test("debounced search filters by text and can be cleared", async ({
    page,
  }) => {
    await page.getByLabel("Search tasks").fill("docs");

    await expect(page).toHaveURL(/[?&]q=docs/);
    await expect(page.getByText("Update docs", { exact: true })).toBeVisible();
    await expect(page.getByText("Fix login bug", { exact: true })).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: /Clear filters/ }).click();
    await expect(page).not.toHaveURL(/q=/);
    await expect(
      page.getByText("Fix login bug", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Showing", { exact: false })).toHaveCount(0);
  });
});
