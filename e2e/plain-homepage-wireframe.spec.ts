import { expect, test } from "@playwright/test";
import {
  createBlankDesignFile,
  deleteTestProject,
  fetchSessionDocument,
  openBlankDesignFile,
  pngDimensions,
  setupProject,
} from "./helpers";
import {
  PLAIN_HOMEPAGE_MARKUP_COUNT,
  plainHomepageWireframe,
} from "./fixtures/plain-homepage-wireframe";

const WS = `e2e-plain-home-${Date.now()}`;
const PROJECT = "plain-homepage-test";
const PHONE = { width: 390, height: 844 };

test.describe("Plain.com-style homepage wireframe (integration)", () => {
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    await setupProject(request, WS, PROJECT);
    sessionId = await createBlankDesignFile(
      request,
      WS,
      PROJECT,
      "Plain homepage (mobile)",
      "phone",
    );

    const session = await fetchSessionDocument(request, WS, PROJECT, sessionId);
    const artboard = session.document.artboards[0]!;
    const markupStack = plainHomepageWireframe();

    const putRes = await request.put(
      `/api/workspaces/${encodeURIComponent(WS)}/projects/${encodeURIComponent(PROJECT)}/sessions/${sessionId}`,
      {
        data: {
          document: {
            ...session.document,
            artboards: [{ ...artboard, markupStack }],
          },
        },
      },
    );
    expect(putRes.ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, WS, PROJECT);
  });

  test("editor shows full-frame wireframe with text and shapes", async ({ page }) => {
    await openBlankDesignFile(page, WS, PROJECT, sessionId);

    await expect(page.getByTestId("frame-content")).toBeVisible();
    await expect(page.getByTestId("canvas-artboard")).toBeVisible();

    await expect(page.locator("[data-markup-shape]")).toHaveCount(
      PLAIN_HOMEPAGE_MARKUP_COUNT,
    );
    await expect(page.getByTestId("markup-layer").getByText("Customer support")).toBeVisible();
    await expect(page.getByTestId("markup-layer").getByText("Start free trial")).toBeVisible();

    const sidebar = page.getByTestId("editor-left-sidebar");
    await expect(sidebar.getByTestId("layer-artboard")).toBeVisible();
    const layerRows = sidebar.getByTestId("layer-item");
    await expect(layerRows).toHaveCount(PLAIN_HOMEPAGE_MARKUP_COUNT);
  });

  test("export matches phone frame dimensions", async ({ request }) => {
    const exportRes = await request.get(
      `/api/workspaces/${encodeURIComponent(WS)}/projects/${encodeURIComponent(PROJECT)}/sessions/${sessionId}/export`,
    );
    expect(exportRes.ok()).toBeTruthy();
    const buf = Buffer.from(await exportRes.body());
    const { width, height } = pngDimensions(buf);
    expect(width).toBe(PHONE.width);
    expect(height).toBe(PHONE.height);
    expect(buf.length).toBeGreaterThan(5000);
  });

  test("undo after adding a shape keeps wireframe intact", async ({ page }) => {
    await openBlankDesignFile(page, WS, PROJECT, sessionId);
    const before = PLAIN_HOMEPAGE_MARKUP_COUNT;

    await page.getByTestId("tool-rectangle").click();
    const box = await page.getByTestId("frame-content").boundingBox();
    if (!box) throw new Error("no frame-content");
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 90);
    await page.mouse.up();
    await expect(page.locator("[data-markup-shape]")).toHaveCount(before + 1);
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });

    await page.getByTestId("undo").click();
    await expect(page.locator("[data-markup-shape]")).toHaveCount(before);
  });
});
