import { expect, test } from "@playwright/test";
import {
  activateToolbarTool,
  clickViewport,
  createSession,
  deleteTestProject,
  dragViewport,
  frameContentBox,
  fetchMarkupStack,
  markupShapes,
  openSession,
  placeTextLabel,
  expectTextOnCanvas,
  setupProject,
} from "./helpers";

const WS = `e2e-toolbar-${Date.now()}`;
const PROJECT = "toolbar-proj";

const TOOL_IDS = ["select", "rectangle", "arrow", "freehand", "text"] as const;

test.describe("Top toolbar", () => {
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    await setupProject(request, WS, PROJECT);
    sessionId = await createSession(request, WS, PROJECT, "Toolbar actions");
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, WS, PROJECT);
  });

  test("every top bar action works", async ({ page, request }) => {
    await openSession(page, WS, PROJECT, sessionId);
    await expect(page.getByTestId("tool-toolbar")).toBeVisible();

    await test.step("history buttons start disabled", async () => {
      await expect(page.getByTestId("undo")).toBeDisabled();
      await expect(page.getByTestId("redo")).toBeDisabled();
    });

    await test.step("each drawing tool can be activated", async () => {
      for (const tool of TOOL_IDS) {
        await activateToolbarTool(page, tool);
      }
    });

    await test.step("rectangle tool draws a shape", async () => {
      await activateToolbarTool(page, "rectangle");
      await dragViewport(page, 0.2, 0.2, 0.45, 0.45);
      await page.waitForTimeout(700);
      await expect(page.locator(markupShapes)).toHaveCount(1);
      await expect(page.getByTestId("undo")).toBeEnabled();
      await expect(page.getByTestId("redo")).toBeDisabled();
    });

    await test.step("undo button removes the last shape", async () => {
      await page.getByTestId("undo").click();
      await expect(page.locator(markupShapes)).toHaveCount(0);
      await expect(page.getByTestId("undo")).toBeDisabled();
      await expect(page.getByTestId("redo")).toBeEnabled();
    });

    await test.step("redo button restores the shape", async () => {
      await page.getByTestId("redo").click();
      await expect(page.locator(markupShapes)).toHaveCount(1);
      await expect(page.getByTestId("undo")).toBeEnabled();
      await expect(page.getByTestId("redo")).toBeDisabled();
    });

    await test.step("arrow tool draws an arrow", async () => {
      await activateToolbarTool(page, "arrow");
      await dragViewport(page, 0.15, 0.55, 0.4, 0.75);
      await page.waitForTimeout(700);
      await expect(page.locator('[data-testid="markup-layer"] line')).toHaveCount(1);
    });

    await test.step("freehand tool draws a path", async () => {
      await activateToolbarTool(page, "freehand");
      const box = await frameContentBox(page);
      await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.55);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.6);
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.58);
      await page.mouse.up();
      await page.waitForTimeout(700);
      await expect(page.locator('[data-testid="markup-layer"] path')).toHaveCount(1);
    });

    await test.step("text tool places a label", async () => {
      await placeTextLabel(page, 0.3, 0.3, "Toolbar label");
      await expectTextOnCanvas(page, "Toolbar label");
    });

    await test.step("bring forward raises selected shape z-order", async () => {
      await activateToolbarTool(page, "rectangle");
      await dragViewport(page, 0.08, 0.55, 0.28, 0.85);
      await page.waitForTimeout(700);
      await dragViewport(page, 0.72, 0.55, 0.92, 0.85);
      await page.waitForTimeout(700);

      let stack = await fetchMarkupStack(request, WS, PROJECT, sessionId);
      const rects = stack
        .filter((o) => o.type === "rectangle")
        .sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
      expect(rects.length).toBeGreaterThanOrEqual(2);
      const leftRect = rects[0];
      const rightRect = rects[rects.length - 1];
      expect(leftRect!.zIndex).toBeLessThan(rightRect!.zIndex);

      await activateToolbarTool(page, "select");
      await clickViewport(page, 0.18, 0.7);
      await page.getByTestId("bring-forward").click();
      await page.waitForTimeout(700);

      stack = await fetchMarkupStack(request, WS, PROJECT, sessionId);
      const leftAfter = stack.find((o) => o.id === leftRect.id)!;
      const rightAfter = stack.find((o) => o.id === rightRect.id)!;
      expect(leftAfter.zIndex).toBeGreaterThan(rightAfter!.zIndex);
    });

    await test.step("send backward restores z-order", async () => {
      let stack = await fetchMarkupStack(request, WS, PROJECT, sessionId);
      const rects = stack
        .filter((o) => o.type === "rectangle")
        .sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
      const leftRect = rects[0];
      const rightRect = rects[rects.length - 1];

      await activateToolbarTool(page, "select");
      await clickViewport(page, 0.18, 0.7);
      await page.getByTestId("send-back").click();
      await page.waitForTimeout(700);

      stack = await fetchMarkupStack(request, WS, PROJECT, sessionId);
      const leftAfter = stack.find((o) => o.id === leftRect.id)!;
      const rightAfter = stack.find((o) => o.id === rightRect.id)!;
      expect(leftAfter.zIndex).toBeLessThan(rightAfter!.zIndex);
    });
  });
});
