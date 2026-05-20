import path from "path";
import { expect, test } from "@playwright/test";
import { deleteTestProject } from "./helpers";

const WS = `e2e-ws-sessions-${Date.now()}`;
const PROJECT = `e2e-proj-sessions-${Date.now()}`;
const FIXTURE = path.join(__dirname, "fixtures", "test.png");

test.describe("Issue #004 — markup session list and create", () => {
  test.beforeAll(async ({ request }) => {
    await request.post("/api/workspaces", { data: { name: WS } });
    await request.post(`/api/workspaces/${encodeURIComponent(WS)}/projects`, {
      data: { name: PROJECT },
    });
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, WS, PROJECT);
  });

  test("create session and open editor", async ({ page }) => {
    await page.goto(`/${encodeURIComponent(WS)}/${encodeURIComponent(PROJECT)}`);
    await page.getByTestId("create-session-open").click();
    await page.getByTestId("session-title-input").fill("Login 500 error");
    await page.getByTestId("session-image-input").setInputFiles(FIXTURE);
    await page.getByTestId("create-session-submit").click();
    await expect(page).toHaveURL(/\/sessions\//);
    await expect(page.getByTestId("session-editor-title")).toHaveValue("Login 500 error");
  });

  test("session appears in list with thumbnail", async ({ page }) => {
    await page.goto(`/${encodeURIComponent(WS)}/${encodeURIComponent(PROJECT)}`);
    await expect(page.getByTestId("session-list-item").first()).toBeVisible();
    await expect(page.getByTestId("session-list-title").first()).toHaveText("Login 500 error");
    await expect(page.getByTestId("session-thumbnail").first()).toBeVisible();
  });
});
