import { expect, test } from "@playwright/test";
import {
  createSession,
  deleteTestProject,
  drawRectangle,
  markupShapes,
  openCanvasContextMenu,
  openLayerContextMenu,
  openSession,
  placeTextLabel,
  setupProject,
} from "./helpers";

const ws = "e2e-context-menu";
const project = "markup-context-menu";

test.describe("Markup context menu", () => {
  test.beforeAll(async ({ request }) => {
    await setupProject(request, ws, project);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });

  test("duplicate via canvas right-click", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "canvas-duplicate");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await page.getByTestId("tool-select").click();
    await openCanvasContextMenu(page, 0.4, 0.4);
    await page.getByTestId("context-menu-duplicate").click();
    await page.waitForTimeout(400);
    await expect(page.locator(markupShapes)).toHaveCount(2);
  });

  test("copy and paste via canvas right-click", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "canvas-copy-paste");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await page.getByTestId("tool-select").click();
    await openCanvasContextMenu(page, 0.4, 0.4);
    await page.getByTestId("context-menu-copy").click();
    await openCanvasContextMenu(page, 0.7, 0.7);
    await page.getByTestId("context-menu-paste").click();
    await page.waitForTimeout(400);
    await expect(page.locator(markupShapes)).toHaveCount(2);
  });

  test("delete via canvas right-click", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "canvas-delete");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await page.getByTestId("tool-select").click();
    await openCanvasContextMenu(page, 0.4, 0.4);
    await page.getByTestId("context-menu-delete").click();
    await page.waitForTimeout(400);
    await expect(page.locator(markupShapes)).toHaveCount(0);
  });

  test("duplicate via layers panel right-click", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "layers-duplicate");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await openLayerContextMenu(page, "rectangle");
    await page.getByTestId("context-menu-duplicate").click();
    await page.waitForTimeout(400);
    await expect(page.locator(markupShapes)).toHaveCount(2);
  });

  test("edit text via context menu", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "edit-text");
    await openSession(page, ws, project, sessionId);
    await placeTextLabel(page, 0.4, 0.4, "Logo");
    await page.getByTestId("tool-select").click();
    await openLayerContextMenu(page, "text");
    await page.getByTestId("context-menu-edit-text").click();
    const input = page.getByTestId("text-inline-input");
    await expect(input).toBeVisible();
    await input.fill("Brand");
    await input.press("Enter");
    await expect(page.getByTestId("markup-layer").getByText("Brand")).toBeVisible();
  });
});
