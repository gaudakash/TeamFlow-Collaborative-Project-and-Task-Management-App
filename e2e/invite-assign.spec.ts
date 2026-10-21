import { expect, test } from "@playwright/test";
import {
  column,
  createBoard,
  createTask,
  createWorkspace,
  makeUser,
  signUp,
} from "./helpers";

test("invite a member and assign them a task", async ({
  page,
  browser,
  baseURL,
}) => {
  const owner = makeUser("owner");
  const teammate = makeUser("mate");

  // The teammate needs an account first. A separate browser context = a separate person.
  const mateContext = await browser.newContext({ baseURL });
  const matePage = await mateContext.newPage();
  await signUp(matePage, teammate);

  // Owner creates a workspace and invites the teammate
  await signUp(page, owner);
  await createWorkspace(page, "Team Workspace");

  const members = page.getByRole("complementary", {
    name: "Workspace members",
  });
  await expect(members.getByText("(you)")).toBeVisible(); // members loaded → hydrated
  await members.getByRole("button", { name: "Invite", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Invite a teammate" });
  await dialog.getByLabel("Email").fill(teammate.email);
  await dialog.getByRole("button", { name: "Send invite" }).click();
  await expect(dialog).toBeHidden();
  await expect(members.getByText(teammate.name)).toBeVisible();

  // Owner assigns a task to the teammate
  await createBoard(page, "Launch");
  await createTask(page, { title: "Prepare demo", assignee: teammate.name });
  await expect(
    column(page, "To Do").getByText(`Assigned to ${teammate.name}`),
  ).toBeAttached();

  // The teammate can now see the workspace...
  await matePage.goto("/app/workspaces");
  await expect(
    matePage.getByRole("link", { name: /Team Workspace/ }),
  ).toBeVisible();

  // ...and the task appears under "Assigned to me" (also proves shareable filter URLs work)
  await matePage.goto(`${page.url()}?assignee=me`);
  await expect(
    column(matePage, "To Do").getByText("Prepare demo", { exact: true }),
  ).toBeVisible();

  await mateContext.close();
});
