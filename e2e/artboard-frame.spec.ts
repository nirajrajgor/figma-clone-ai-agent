import { expect, test } from "@playwright/test";
import {
  clickFrameContent,
  createSession,
  deleteTestProject,
  dragCanvas,
  dragFrameContent,
  drawRectangle,
  fetchSessionDocument,
  markupShapes,
  openSession,
  selectArtboard,
  selectBaseImage,
  setupProject,
  viewportBox,
} from "./helpers";

const WS = `e2e-artboard-${Date.now()}`;
const PROJECT = `e2e-artboard-proj-${Date.now()}`;

test.describe("Artboard frame", () => {
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    await setupProject(request, WS, PROJECT);
    sessionId = await createSession(request, WS, PROJECT, "Frame test");
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, WS, PROJECT);
  });

  test("renders artboard chrome around the base image", async ({ page }) => {
    await openSession(page, WS, PROJECT, sessionId);
    await expect(page.getByTestId("canvas-artboard")).toBeVisible();
    await expect(page.getByTestId("frame-content")).toBeVisible();
    await expect(page.getByTestId("base-image")).toBeVisible();
    await expect(page.getByTestId("frame-label").first()).toBeVisible();
    await expect(page.getByTestId("canvas-zoom-bar")).toBeVisible();
  });

  test("select tool selects the image when clicking the base image", async ({ page }) => {
    await openSession(page, WS, PROJECT, sessionId);
    await selectBaseImage(page);
    await expect(page.getByTestId("frame-properties")).toBeVisible();
  });

  test("select tool selects markup drawn on the image", async ({ page }) => {
    await openSession(page, WS, PROJECT, sessionId);
    await drawRectangle(page);
    await page.getByTestId("tool-select").click();
    await clickFrameContent(page, 0.4, 0.4);
    await expect(page.getByTestId("selection-overlay")).toBeVisible();
    await expect(page.getByTestId("frame-selection-overlay")).toHaveCount(0);
  });

  test("frame tool is available in the toolbar", async ({ page }) => {
    await openSession(page, WS, PROJECT, sessionId);
    await expect(page.getByTestId("tool-frame")).toBeVisible();
    await page.getByTestId("tool-frame").click();
    await expect(page.getByTestId("tool-frame")).toHaveAttribute("aria-pressed", "true");
  });

  test("select tool moves the image within the artboard", async ({ page, request }) => {
    const moveSessionId = await createSession(request, WS, PROJECT, "Move image test");
    await openSession(page, WS, PROJECT, moveSessionId);
    await page.getByTestId("annotation-editor").click();
    await selectBaseImage(page);
    await dragFrameContent(page, 0.1, 0.1, 0.25, 0.25);
    await expect(page.getByTestId("image-offset-x")).not.toHaveText("48");
    await page.waitForTimeout(700);
    const res = await request.get(
      `/api/workspaces/${encodeURIComponent(WS)}/projects/${encodeURIComponent(PROJECT)}/sessions/${moveSessionId}`,
    );
    const data = (await res.json()) as {
      document: { artboards: Array<{ imageOffsetX: number; imageOffsetY: number }> };
    };
    const active = data.document.artboards[0];
    expect(active.imageOffsetX).toBeGreaterThan(48);
    expect(active.imageOffsetY).toBeGreaterThan(48);
  });

  test("select tool resizes the artboard by dragging frame handles", async ({ page, request }) => {
    const handleSessionId = await createSession(request, WS, PROJECT, "Handle resize test");
    await openSession(page, WS, PROJECT, handleSessionId);
    const before = (await (
      await request.get(
        `/api/workspaces/${encodeURIComponent(WS)}/projects/${encodeURIComponent(PROJECT)}/sessions/${handleSessionId}`,
      )
    ).json()) as {
      document: { artboards: Array<{ artboardWidth: number; artboardHeight: number }> };
    };
    const beforeBoard = before.document.artboards[0];
    const artboard = page.getByTestId("canvas-artboard");
    const box = await artboard.boundingBox();
    if (!box) throw new Error("no artboard");
    await page.getByTestId("annotation-editor").click();
    await page.getByTestId("tool-select").click();
    await page.mouse.move(box.x + box.width - 4, box.y + box.height - 4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 40, box.y + box.height + 40, { steps: 10 });
    await page.mouse.up();
    await expect(page.getByTestId("frame-selection-overlay")).toBeVisible();
    await page.waitForTimeout(700);
    const res = await request.get(
      `/api/workspaces/${encodeURIComponent(WS)}/projects/${encodeURIComponent(PROJECT)}/sessions/${handleSessionId}`,
    );
    const data = (await res.json()) as {
      document: { artboards: Array<{ artboardWidth: number; artboardHeight: number }> };
    };
    const afterBoard = data.document.artboards[0];
    expect(afterBoard.artboardWidth).toBeGreaterThan(beforeBoard.artboardWidth);
    expect(afterBoard.artboardHeight).toBeGreaterThan(beforeBoard.artboardHeight);
  });

  test("select tool drags image from one artboard to another", async ({ page, request }) => {
    const transferSessionId = await createSession(request, WS, PROJECT, "Transfer image test");
    await openSession(page, WS, PROJECT, transferSessionId);
    await page.getByTestId("tool-select").click();
    await page.getByTestId("add-artboard").click();
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });
    const layoutRes = await request.get(
      `/api/workspaces/${encodeURIComponent(WS)}/projects/${encodeURIComponent(PROJECT)}/sessions/${transferSessionId}`,
    );
    const layoutData = (await layoutRes.json()) as {
      document: {
        artboards: Array<{
          x: number;
          y: number;
          artboardWidth: number;
          artboardHeight: number;
          imageOffsetX: number;
          imageOffsetY: number;
          imageId: string | null;
        }>;
      };
    };
    const source = layoutData.document.artboards.find((a) => a.imageId);
    const target = layoutData.document.artboards.find((a) => !a.imageId);
    if (!source || !target) {
      throw new Error("expected one artboard with an image and one without");
    }
    const vp = await viewportBox(page);
    const transform = await page.getByTestId("canvas-transform-layer").evaluate((el) => {
      const matrix = new DOMMatrix(window.getComputedStyle(el).transform);
      return { ox: matrix.e, oy: matrix.f, scale: matrix.a };
    });
    const toScreen = (canvasX: number, canvasY: number) => ({
      x: vp.x + transform.ox + canvasX * transform.scale,
      y: vp.y + transform.oy + canvasY * transform.scale,
    });
    const start = toScreen(
      source.x + source.imageOffsetX + 16,
      source.y + source.imageOffsetY + 16,
    );
    const end = toScreen(
      target.x + target.artboardWidth / 2,
      target.y + target.artboardHeight / 2,
    );
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 24 });
    await page.mouse.up();
    await page.waitForTimeout(700);
    const res = await request.get(
      `/api/workspaces/${encodeURIComponent(WS)}/projects/${encodeURIComponent(PROJECT)}/sessions/${transferSessionId}`,
    );
    const data = (await res.json()) as {
      document: { artboards: Array<{ imageId: string | null }> };
    };
    const boards = data.document.artboards;
    expect(boards).toHaveLength(2);
    expect(boards.filter((a) => a.imageId).length).toBe(1);
    expect(boards.find((a) => !a.imageId)?.imageId ?? null).toBeNull();
  });

  test("add artboard button creates a second artboard", async ({ page, request }) => {
    const multiSessionId = await createSession(request, WS, PROJECT, "Multi artboard test");
    await openSession(page, WS, PROJECT, multiSessionId);
    await page.getByTestId("tool-select").click();
    await page.getByTestId("add-artboard").click();
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });
    await expect(page.getByTestId("artboard-select")).toContainText("Frame 2");
    const data = await fetchSessionDocument(request, WS, PROJECT, multiSessionId);
    expect(data.document.artboards.length).toBe(2);
  });

  test("session GET returns document payload", async ({ request }) => {
    const apiSessionId = await createSession(request, WS, PROJECT, "Document API test");
    const data = await fetchSessionDocument(request, WS, PROJECT, apiSessionId);
    expect(data.id).toBeTruthy();
    expect(data.title).toBe("Document API test");
    expect(data.document.activeArtboardId).toBeTruthy();
    expect(data.document.artboards.length).toBeGreaterThan(0);
  });

  test("markup stays on artboard when switching frames", async ({ page, request }) => {
    const sessionTitle = "Artboard switch test";
    const switchSessionId = await createSession(request, WS, PROJECT, sessionTitle);
    await openSession(page, WS, PROJECT, switchSessionId);
    await drawRectangle(page);
    await expect(page.getByTestId("markup-layer").locator(markupShapes)).toHaveCount(1);

    await page.getByTestId("tool-select").click();
    await page.getByTestId("add-artboard").click();
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });
    await expect(page.getByTestId("artboard-select")).toContainText("Frame 2");
    await expect(page.getByTestId("markup-layer").locator(markupShapes)).toHaveCount(0);

    await selectArtboard(page, sessionTitle);
    await expect(page.getByTestId("markup-layer").locator(markupShapes)).toHaveCount(1);

    const data = await fetchSessionDocument(request, WS, PROJECT, switchSessionId);
    const withMarkup = data.document.artboards.find((a) => a.markupStack.length === 1);
    const empty = data.document.artboards.find((a) => a.markupStack.length === 0);
    expect(withMarkup?.title).toBe(sessionTitle);
    expect(empty?.title).toBe("Frame 2");
  });

  test("frame tool drag creates a new artboard on empty canvas", async ({ page, request }) => {
    const dragSessionId = await createSession(request, WS, PROJECT, "Frame drag create test");
    await openSession(page, WS, PROJECT, dragSessionId);
    const before = await fetchSessionDocument(request, WS, PROJECT, dragSessionId);
    const board = before.document.artboards[0];

    await page.getByTestId("annotation-editor").click();
    await page.getByTestId("tool-frame").click();
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("-");
    }
    const startX = board.x + board.artboardWidth + 120;
    const startY = board.y + 40;
    await dragCanvas(page, startX, startY, startX + 240, startY + 180);
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });

    const after = await fetchSessionDocument(request, WS, PROJECT, dragSessionId);
    expect(after.document.artboards).toHaveLength(2);
    expect(after.document.artboards[1]?.title).toBe("Frame 2");
    expect(after.document.artboards[1]?.artboardWidth).toBeGreaterThanOrEqual(120);
    expect(after.document.activeArtboardId).toBe(after.document.artboards[1]?.id);
  });
});
