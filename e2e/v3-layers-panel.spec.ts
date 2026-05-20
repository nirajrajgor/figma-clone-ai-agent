import { expect, test } from "@playwright/test";
import {
  createSession,
  deleteTestProject,
  dragFrameContent,
  drawRectangle,
  markupShapes,
  openSession,
  setupProject,
} from "./helpers";

const ws = "e2e-v3";
const project = "layers-panel";

test.describe("Issue #022 — layers tree (left sidebar)", () => {
  test.beforeAll(async ({ request }) => {
    await setupProject(request, ws, project);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });

  test("layers tree lives in left sidebar with frame, image, and markup rows", async ({
    page,
    request,
  }) => {
    const sessionId = await createSession(request, ws, project, "layers-tree");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);

    const sidebar = page.getByTestId("app-sidebar");
    const inspector = page.getByTestId("markup-properties-panel");

    await expect(sidebar.getByTestId("layers-panel")).toBeVisible();
    await expect(sidebar.getByTestId("layer-artboard")).toHaveCount(1);
    await expect(sidebar.getByTestId("layer-frame")).toBeVisible();
    await expect(sidebar.getByTestId("layer-image")).toBeVisible();
    await expect(sidebar.getByTestId("layer-item")).toHaveCount(1);
    await expect(sidebar.getByTestId("layer-item")).toContainText("Rectangle");

    await expect(inspector.getByTestId("layers-panel")).toHaveCount(0);
    await expect(inspector.getByTestId("layers-list")).toHaveCount(0);
  });

  test("click markup layer selects object on canvas", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "layer-select");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await page.getByTestId("tool-line").click();
    await dragFrameContent(page, 0.2, 0.6, 0.5, 0.75);
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });

    const sidebar = page.getByTestId("app-sidebar");
    const lineLayer = sidebar.getByTestId("layer-item").filter({ hasText: "Line" });
    await lineLayer.click();

    await expect(lineLayer).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("tool-select")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(markupShapes)).toHaveCount(2);
  });

  test("shift-click layers multi-selects markup objects", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "layer-multi");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await page.getByTestId("tool-line").click();
    await dragFrameContent(page, 0.2, 0.6, 0.5, 0.75);
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });

    const sidebar = page.getByTestId("app-sidebar");
    const rectLayer = sidebar.getByTestId("layer-item").filter({ hasText: "Rectangle" });
    const lineLayer = sidebar.getByTestId("layer-item").filter({ hasText: "Line" });

    await lineLayer.click();
    await rectLayer.click({ modifiers: ["Shift"] });

    await expect(lineLayer).toHaveAttribute("aria-pressed", "true");
    await expect(rectLayer).toHaveAttribute("aria-pressed", "true");
  });

  test("list order matches z-order front-to-back", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "layer-zorder");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await page.getByTestId("tool-line").click();
    await dragFrameContent(page, 0.2, 0.6, 0.5, 0.75);
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });

    const labels = await page
      .getByTestId("app-sidebar")
      .getByTestId("layer-item")
      .allTextContents();

    expect(labels).toEqual(["Line", "Rectangle"]);
  });

  test("click frame and image rows select frame or base image", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "frame-image-select");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);

    const sidebar = page.getByTestId("app-sidebar");
    const frameRow = sidebar.getByTestId("layer-frame");
    const imageRow = sidebar.getByTestId("layer-image");

    await frameRow.click();
    await expect(frameRow).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("frame-properties")).toBeVisible();

    await imageRow.click();
    await expect(imageRow).toHaveAttribute("aria-pressed", "true");
    await expect(frameRow).toHaveAttribute("aria-pressed", "false");
  });

  test("artboard frame row collapses and expands nested layers", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "layer-collapse");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);

    const sidebar = page.getByTestId("app-sidebar");
    const toggle = sidebar.getByTestId("layer-artboard-toggle").first();

    await expect(sidebar.getByTestId("layer-item")).toBeVisible();
    await toggle.click();
    await expect(sidebar.getByTestId("layer-item")).toHaveCount(0);
    await expect(sidebar.getByTestId("layer-image")).toHaveCount(0);

    await toggle.click();
    await expect(sidebar.getByTestId("layer-item")).toHaveCount(1);
    await expect(sidebar.getByTestId("layer-image")).toBeVisible();
  });

  test("each artboard appears as its own frame root in the tree", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "multi-artboard-layers");
    await openSession(page, ws, project, sessionId);

    await page.getByTestId("add-artboard").click();
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });

    const sidebar = page.getByTestId("app-sidebar");
    await expect(sidebar.getByTestId("layer-artboard")).toHaveCount(2);
    await expect(sidebar.getByTestId("layer-frame")).toHaveCount(2);
  });
});
