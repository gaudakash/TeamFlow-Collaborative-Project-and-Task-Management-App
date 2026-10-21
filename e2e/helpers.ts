import { expect, type Locator, type Page } from "@playwright/test";

export type TestUser = { name: string; email: string; password: string };
export type Priority = "Low" | "Medium" | "High" | "Urgent";

/** A brand-new user for every test → tests never depend on each other. */
export function makeUser(label: string): TestUser {
  const base = process.env.E2E_EMAIL_BASE;
  if (!base?.includes("@")) {
    throw new Error(
      "Set E2E_EMAIL_BASE (e.g. you@gmail.com) in .env.local or CI secrets",
    );
  }
  const [local, domain] = base.split("@");
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    name: `E2E ${label} ${id}`,
    email: `${local}+e2e-${label}-${id}@${domain}`.toLowerCase(),
    password: "E2e-test-password-123!",
  };
}

/** A Kanban column, found by its accessible name (the <section> heading). */
export const column = (page: Page, label: string) =>
  page.getByRole("region", { name: label, exact: true });

/** Opens a Radix Select and picks an option. Options render in a portal, so search the whole page. */
export async function pickOption(page: Page, trigger: Locator, option: string) {
  await trigger.click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

export async function signUp(page: Page, user: TestUser) {
  await page.goto("/signup");
  await page.getByLabel("Full name").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/app\/workspaces$/);
  // Only appears after the client-side query finishes → React has hydrated and buttons work.
  // (Clicking a button before hydration does nothing, a classic cause of flaky E2E tests.)
  await expect(page.getByText("No workspaces yet")).toBeVisible();
}

export async function createWorkspace(page: Page, name: string) {
  await page
    .getByRole("button", { name: "New workspace", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Create workspace" });
  await dialog.getByLabel("Name", { exact: true }).fill(name);
  await dialog.getByRole("button", { name: "Create workspace" }).click();

  await expect(page).toHaveURL(/\/app\/workspaces\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText("No boards yet")).toBeVisible(); // hydrated
}

export async function createBoard(page: Page, name: string) {
  await page.getByRole("button", { name: "New board", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Create board" });
  await dialog.getByLabel("Name", { exact: true }).fill(name);
  await dialog.getByRole("button", { name: "Create board" }).click();

  await expect(page).toHaveURL(/\/app\/boards\/[0-9a-f-]{36}/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(column(page, "To Do")).toBeVisible(); // board is client-only, so visible = loaded
}

type NewTask = {
  title: string;
  column?: string;
  priority?: Priority;
  assignee?: string;
};

export async function createTask(
  page: Page,
  { title, column: col = "To Do", priority, assignee }: NewTask,
) {
  await page.getByRole("button", { name: `Add task to ${col}` }).click();
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.getByLabel("Title", { exact: true }).fill(title);
  if (priority)
    await pickOption(
      page,
      dialog.getByLabel("Priority", { exact: true }),
      priority,
    );
  if (assignee)
    await pickOption(
      page,
      dialog.getByLabel("Assignee", { exact: true }),
      assignee,
    );
  await dialog.getByRole("button", { name: "Create task" }).click();

  await expect(dialog).toBeHidden();
  await expect(
    column(page, col).getByText(title, { exact: true }),
  ).toBeVisible();
}
