import { expect, test } from "@playwright/test";
import {
  clickFrameContent,
  createSession,
  deleteTestProject,
  openSession,
  setupProject,
} from "./helpers";

const WS = `e2e-text-${Date.now()}`;
const PROJECT = "text-tool-proj";

test.describe("Text tool", () => {
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    await setupProject(request, WS, PROJECT);
    sessionId = await createSession(request, WS, PROJECT, "Text tool session");
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, WS, PROJECT);
  });

  test("selects text tool from top toolbar", async ({ page }) => {
    await openSession(page, WS, PROJECT, sessionId);
    await page.getByTestId("tool-select").click();
    await page.getByTestId("tool-text").click();
    await expect(page.getByTestId("tool-text")).toHaveAttribute("aria-pressed", "true");
  });

  test("opens inline editor after canvas click", async ({ page }) => {
    await openSession(page, WS, PROJECT, sessionId);
    await page.getByTestId("tool-text").click();
    await clickFrameContent(page, 0.35, 0.35);
    await expect(page.getByTestId("text-inline-input")).toBeVisible();
    await expect(page.getByTestId("text-inline-input")).toBeFocused();
  });

  test("adds label via Enter and persists after reload", async ({ page }) => {
    await openSession(page, WS, PROJECT, sessionId);
    await page.getByTestId("tool-text").click();
    await clickFrameContent(page, 0.4, 0.4);
    await page.getByTestId("text-inline-input").fill("Bug report");
    await page.getByTestId("text-inline-input").press("Enter");
    await expect(page.getByTestId("text-inline-input")).toHaveCount(0);
    await expect(page.getByTestId("markup-layer").getByText("Bug report")).toBeVisible();
    await page.waitForTimeout(700);
    await page.reload();
    await page.getByTestId("base-image").waitFor();
    await expect(page.getByTestId("markup-layer").getByText("Bug report")).toBeVisible();
  });

  test("escape does not add a label", async ({ page, request }) => {
    const sid = await createSession(request, WS, PROJECT, "Cancel text");
    await openSession(page, WS, PROJECT, sid);
    await page.getByTestId("tool-text").click();
    await clickFrameContent(page, 0.2, 0.2);
    await page.getByTestId("text-inline-input").fill("Should not appear");
    await page.getByTestId("text-inline-input").press("Escape");
    await expect(page.getByText("Should not appear")).toHaveCount(0);
  });
});
