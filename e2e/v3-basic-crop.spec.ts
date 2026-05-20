import { expect, test } from "@playwright/test";
import {
  createSession,
  deleteTestProject,
  doubleClickFrameContent,
  fetchSessionDocument,
  frameContentBox,
  openSession,
  pngDimensions,
  setupProject,
} from "./helpers";

const ws = "e2e-v3";
const project = "basic-crop";

test.describe("v3 non-destructive crop", () => {
  test.beforeAll(async ({ request }) => {
    await setupProject(request, ws, project);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });

  test("enter crop via double-click, cancel with Escape", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "crop cancel");
    await openSession(page, ws, project, sessionId);

    await doubleClickFrameContent(page, 0.5, 0.5);
    await expect(page.getByTestId("image-crop-overlay")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("image-crop-overlay")).toHaveCount(0);

    const doc = await fetchSessionDocument(request, ws, project, sessionId);
    const artboard = doc.document.artboards[0]!;
    expect(artboard.imageCropWidth ?? null).toBeNull();
  });

  test("crop via inspector, commit, and export respects crop", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "crop commit");
    await openSession(page, ws, project, sessionId);

    await page.getByTestId("tool-select").click();
    await page.getByTestId("frame-content").click({ position: { x: 16, y: 16 } });
    const box = await frameContentBox(page);
    await page.getByTestId("enter-crop").click();
    await expect(page.getByTestId("image-crop-overlay")).toBeVisible();

    const startX = box.x + box.width * 0.92;
    const startY = box.y + box.height * 0.92;
    const endX = box.x + box.width * 0.55;
    const endY = box.y + box.height * 0.55;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(150);

    await page.getByTestId("apply-crop").click();
    await expect(page.getByTestId("image-crop-overlay")).toHaveCount(0);
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });

    const doc = await fetchSessionDocument(request, ws, project, sessionId);
    const artboard = doc.document.artboards[0]!;
    expect(artboard.imageCropWidth).toBeTruthy();
    expect(artboard.imageCropWidth!).toBeLessThan(32);

    const exportRes = await request.get(
      `/api/workspaces/${encodeURIComponent(ws)}/projects/${encodeURIComponent(project)}/sessions/${sessionId}/export`,
    );
    expect(exportRes.ok()).toBeTruthy();
    const buf = Buffer.from(await exportRes.body());
    const { width, height } = pngDimensions(buf);
    expect(width).toBe(Math.round(artboard.artboardWidth));
    expect(height).toBe(Math.round(artboard.artboardHeight));
  });
});
