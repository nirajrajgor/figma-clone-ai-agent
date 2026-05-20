import { expect, test } from "@playwright/test";
import {
  activateToolbarTool,
  createBlankDesignFile,
  createBlankDesignFileViaUi,
  deleteTestProject,
  drawRectangle,
  fetchSessionDocument,
  openBlankDesignFile,
  pngDimensions,
  setupProject,
} from "./helpers";

const WS = `e2e-v4-blank-${Date.now()}`;
const PROJECT = "blank-design-proj";

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

test.describe("Issue #036 — blank design file + device preset", () => {
  test.beforeAll(async ({ request }) => {
    await setupProject(request, WS, PROJECT);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, WS, PROJECT);
  });

  test("creates design file with phone preset and no image via UI", async ({ page }) => {
    await createBlankDesignFileViaUi(page, WS, PROJECT, "Login wireframe", "phone");
    await expect(page.getByTestId("session-editor-title")).toHaveValue("Login wireframe");
    await expect(page.getByTestId("frame-content")).toBeVisible();
    await expect(page.getByTestId("base-image")).toHaveCount(0);
    await expect(page.getByTestId("empty-artboard")).toHaveCount(0);
  });

  test("draws rectangle on blank frame and exports phone-sized PNG", async ({
    page,
    request,
  }) => {
    const sessionId = await createBlankDesignFile(
      request,
      WS,
      PROJECT,
      "export wireframe",
      "phone",
    );
    await openBlankDesignFile(page, WS, PROJECT, sessionId);

    await activateToolbarTool(page, "rectangle");
    await drawRectangle(page);
    await expect(page.locator('[data-markup-shape]')).toHaveCount(1);

    const exportRes = await request.get(
      `/api/workspaces/${encodeURIComponent(WS)}/projects/${encodeURIComponent(PROJECT)}/sessions/${sessionId}/export`,
    );
    expect(exportRes.ok()).toBeTruthy();
    const buf = Buffer.from(await exportRes.body());
    const { width, height } = pngDimensions(buf);
    expect(width).toBe(PHONE_WIDTH);
    expect(height).toBe(PHONE_HEIGHT);
  });

  test("adds tablet frame alongside phone frame on one canvas", async ({ page, request }) => {
    const sessionId = await createBlankDesignFile(
      request,
      WS,
      PROJECT,
      "multi device",
      "phone",
    );
    await openBlankDesignFile(page, WS, PROJECT, sessionId);

    await page.getByTestId("add-device-frame-menu").click();
    await page.getByTestId("add-device-frame-tablet").click();
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });

    const session = await fetchSessionDocument(request, WS, PROJECT, sessionId);
    expect(session.document.artboards).toHaveLength(2);
    const sizes = session.document.artboards.map((a) => ({
      w: a.artboardWidth,
      h: a.artboardHeight,
    }));
    expect(sizes).toContainEqual({ w: PHONE_WIDTH, h: PHONE_HEIGHT });
    expect(sizes).toContainEqual({ w: 768, h: 1024 });
  });
});
