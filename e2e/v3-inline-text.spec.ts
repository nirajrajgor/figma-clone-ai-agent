import { expect, test } from "@playwright/test";
import {
  clickFrameContent,
  createSession,
  deleteTestProject,
  doubleClickFrameContent,
  openSession,
  setupProject,
} from "./helpers";

const ws = "e2e-v3";
const project = "inline-text";

test.describe("v3 inline text editing", () => {
  test.beforeAll(async ({ request }) => {
    await setupProject(request, ws, project);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });

  test("places text inline and edits on double-click", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "inline text");
    await openSession(page, ws, project, sessionId);

    await page.getByTestId("tool-text").click();
    await clickFrameContent(page, 0.35, 0.35);
    const input = page.getByTestId("text-inline-input");
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    await input.fill("Login here");
    await input.press("Enter");
    await expect(page.getByTestId("markup-layer").getByText("Login here")).toBeVisible();
    await expect(input).toHaveCount(0);

    await page.getByTestId("tool-select").click();
    await doubleClickFrameContent(page, 0.35, 0.35);
    await expect(input).toBeVisible();
    await input.fill("Sign in here");
    await input.press("Enter");
    await expect(page.getByTestId("markup-layer").getByText("Sign in here")).toBeVisible();
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });

    await page.reload();
    await page.getByTestId("base-image").waitFor();
    await expect(page.getByTestId("markup-layer").getByText("Sign in here")).toBeVisible();
  });

  test("escape cancels new text without adding label", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "cancel text");
    await openSession(page, ws, project, sessionId);
    await page.getByTestId("tool-text").click();
    await clickFrameContent(page, 0.2, 0.2);
    await page.getByTestId("text-inline-input").fill("Should not appear");
    await page.getByTestId("text-inline-input").press("Escape");
    await expect(page.getByText("Should not appear")).toHaveCount(0);
  });
});
