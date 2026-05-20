import { expect, test } from "@playwright/test";
import {
  clickFrameContent,
  createSession,
  deleteTestProject,
  dragFrameContent,
  drawRectangle,
  markupShapes,
  openSession,
  setupProject,
  undoMod,
} from "./helpers";

const ws = "e2e-v2";
const project = "markup-polish";

test.describe("v2 markup and polish", () => {
  test.beforeAll(async ({ request }) => {
    await setupProject(request, ws, project);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });

  test("ellipse, line, and redact tools persist", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "v2 tools");
    await openSession(page, ws, project, sessionId);

    await page.getByTestId("tool-ellipse").click();
    await dragFrameContent(page, 0.2, 0.2, 0.45, 0.45);
    await page.waitForTimeout(600);

    await page.getByTestId("tool-line").click();
    await dragFrameContent(page, 0.5, 0.2, 0.7, 0.35);
    await page.waitForTimeout(600);

    await page.getByTestId("tool-redact").click();
    await dragFrameContent(page, 0.1, 0.55, 0.3, 0.7);
    await page.waitForTimeout(800);

    await expect(page.locator(markupShapes)).toHaveCount(3);

    await page.reload();
    await page.getByTestId("base-image").waitFor();
    await expect(page.locator(markupShapes)).toHaveCount(3);
  });

  test("keyboard shortcut switches tool and duplicate works", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "shortcuts");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await page.getByTestId("tool-select").click();
    await clickFrameContent(page, 0.4, 0.4);
    await page.getByTestId("annotation-editor").focus();
    await page.keyboard.press(`${undoMod}+d`);
    await page.waitForTimeout(400);
    await expect(page.locator(markupShapes)).toHaveCount(2);
    await page.keyboard.press("l");
    await expect(page.getByTestId("tool-line")).toHaveAttribute("aria-pressed", "true");
  });

  test("save status shows saved after edit", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "save status");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await expect(page.getByTestId("save-status")).toContainText(/Saved|Saving/, {
      timeout: 5000,
    });
  });
});
