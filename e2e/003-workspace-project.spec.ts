import { expect, test } from "@playwright/test";
import { deleteTestProject } from "./helpers";

const WS = `e2e-ws-${Date.now()}`;
const PROJECT = `e2e-proj-${Date.now()}`;

test.describe.serial("Issue #003 — workspace and project entry", () => {
  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, WS, PROJECT);
  });

  test("create workspace and project via entry flow", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("workspace-input").fill(WS);
    await page.getByTestId("workspace-input").blur();
    await expect(page.getByTestId("create-workspace-prompt")).toBeVisible();
    await page.getByTestId("workspace-submit").click();
    await expect(page.getByTestId("active-workspace")).toHaveText(WS);
    await page.getByTestId("project-input").fill(PROJECT);
    await page.getByTestId("project-input").blur();
    await expect(page.getByTestId("create-project-prompt")).toBeVisible();
    await page.getByTestId("project-submit").click();
    await expect(page).toHaveURL(new RegExp(`/${encodeURIComponent(WS)}/${encodeURIComponent(PROJECT)}`));
    await expect(page.getByTestId("project-breadcrumb")).toContainText(PROJECT);
  });

  test("refresh returns to same project", async ({ page }) => {
    await page.goto(`/${encodeURIComponent(WS)}/${encodeURIComponent(PROJECT)}`);
    await expect(page.getByTestId("project-breadcrumb")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("project-breadcrumb")).toContainText(PROJECT);
  });
});
