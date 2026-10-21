import { expect, test } from "@playwright/test";
import { makeUser, signUp } from "./helpers";

test.describe("route protection", () => {
  const protectedPaths = [
    "/app",
    "/app/workspaces",
    "/app/settings",
    "/app/boards/00000000-0000-0000-0000-000000000000",
  ];

  for (const path of protectedPaths) {
    test(`logged-out visit to ${path} redirects to /login`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByLabel("Password")).toBeVisible();
    });
  }

  test("logged-in user visiting /login is sent to their workspaces", async ({
    page,
  }) => {
    await signUp(page, makeUser("redirect"));
    await page.goto("/login");
    await expect(page).toHaveURL(/\/app\/workspaces$/);
  });

  test("logging out ends the session", async ({ page }) => {
    await signUp(page, makeUser("logout"));
    await page.getByRole("button", { name: "Open user menu" }).click();
    await page.getByRole("menuitem", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);

    // The old session must be gone, not just hidden
    await page.goto("/app/workspaces");
    await expect(page).toHaveURL(/\/login$/);
  });
});
