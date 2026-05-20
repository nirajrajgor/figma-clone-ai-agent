import path from "path";
import { expect, test } from "@playwright/test";
import { deleteTestProject } from "./helpers";

const WS = `e2e-ws-canvas-${Date.now()}`;
const PROJECT = `e2e-proj-canvas-${Date.now()}`;
const FIXTURE = path.join(__dirname, "fixtures", "test.png");

test.describe("Issue #005 — view-only canvas", () => {
  let sessionUrl = "";

  test.beforeAll(async ({ request }) => {
    await request.post("/api/workspaces", { data: { name: WS } });
    await request.post(`/api/workspaces/${encodeURIComponent(WS)}/projects`, {
      data: { name: PROJECT },
    });
    const fs = await import("fs");
    const form = new FormData();
    form.set("title", "Canvas test");
    form.set(
      "image",
      new Blob([fs.readFileSync(FIXTURE)], { type: "image/png" }),
      "test.png",
    );
    const res = await request.post(
      `/api/workspaces/${encodeURIComponent(WS)}/projects/${encodeURIComponent(PROJECT)}/sessions`,
      { multipart: form },
    );
    const body = await res.json();
    sessionUrl = `/${encodeURIComponent(WS)}/${encodeURIComponent(PROJECT)}/sessions/${body.sessionId}`;
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, WS, PROJECT);
  });

  test("base image visible with fit viewport", async ({ page }) => {
    await page.goto(sessionUrl);
    await expect(page.getByTestId("canvas-viewport")).toBeVisible();
    await expect(page.getByTestId("canvas-artboard")).toBeVisible();
    await expect(page.getByTestId("frame-content")).toBeVisible();
    await expect(page.getByTestId("base-image")).toBeVisible();
    await expect(page.getByTestId("frame-label")).toBeVisible();
  });

  test("pan and zoom change transform", async ({ page }) => {
    await page.goto(sessionUrl);
    const layer = page.getByTestId("canvas-transform-layer");
    const before = await layer.evaluate((el) => getComputedStyle(el).transform);
    await page.getByTestId("canvas-viewport").dispatchEvent("wheel", { deltaY: -200 });
    const afterZoom = await layer.evaluate((el) => getComputedStyle(el).transform);
    expect(afterZoom).not.toBe(before);
    const box = await page.getByTestId("canvas-viewport").boundingBox();
    if (!box) throw new Error("no viewport box");
    await page.keyboard.down("Alt");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40);
    await page.mouse.up();
    await page.keyboard.up("Alt");
    const afterPan = await layer.evaluate((el) => getComputedStyle(el).transform);
    expect(afterPan).not.toBe(afterZoom);
  });
});
