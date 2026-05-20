import path from "path";
import { expect, test } from "@playwright/test";
import {
  FIXTURE,
  clickFrameContent,
  createSession,
  deleteTestProject,
  drawRectangle,
  dragFrameContent,
  frameContentBox,
  markupShapes,
  openSession,
  setupProject,
  undoMod,
} from "./helpers";

const WS = `e2e-annotate-${Date.now()}`;
const PROJECT = `e2e-annotate-proj`;

test.describe.serial("Issues #006–#011 — annotation tools", () => {
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    await setupProject(request, WS, PROJECT);
    sessionId = await createSession(request, WS, PROJECT, "Annotate me");
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, WS, PROJECT);
  });

  test("#006 rectangle persists after reload", async ({ page }) => {
    await openSession(page, WS, PROJECT, sessionId);
    await drawRectangle(page);
    await expect(page.locator(markupShapes)).toHaveCount(1);
    await page.reload();
    await page.getByTestId("annotation-editor-loading").waitFor({ state: "hidden" });
    await page.getByTestId("base-image").waitFor();
    await expect(page.locator(markupShapes)).toHaveCount(1);
  });

  test("#007 arrow and freehand", async ({ page }) => {
    await openSession(page, WS, PROJECT, sessionId);
    await page.getByTestId("tool-arrow").click();
    await dragFrameContent(page, 0.2, 0.2, 0.7, 0.7);
    await page.waitForTimeout(500);
    await page.getByTestId("tool-freehand").click();
    const box = await frameContentBox(page);
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.45);
    await page.mouse.up();
    await page.waitForTimeout(700);
    await expect(page.locator('[data-testid="markup-layer"] line')).toHaveCount(1);
    await expect(page.locator('[data-testid="markup-layer"] path')).toHaveCount(1);
  });

  test("#008 text markup", async ({ page }) => {
    await openSession(page, WS, PROJECT, sessionId);
    await page.getByTestId("tool-text").click();
    await clickFrameContent(page, 0.3, 0.3);
    await expect(page.getByTestId("text-inline-input")).toBeVisible();
    await page.getByTestId("text-inline-input").fill("Login here");
    await page.getByTestId("text-inline-input").press("Enter");
    await page.waitForTimeout(700);
    await expect(page.getByTestId("markup-layer").getByText("Login here")).toBeVisible();
  });

  test("#009 select and delete", async ({ page, request }) => {
    const sid = await createSession(request, WS, PROJECT, "Delete me");
    await openSession(page, WS, PROJECT, sid);
    await drawRectangle(page);
    const before = await page.locator(markupShapes).count();
    await page.getByTestId("tool-select").click();
    await clickFrameContent(page, 0.4, 0.4);
    await page.keyboard.press("Delete");
    await page.waitForTimeout(700);
    const after = await page.locator(markupShapes).count();
    expect(after).toBeLessThan(before);
  });

  test("#010 undo restores rectangle", async ({ page, request }) => {
    const sid = await createSession(request, WS, PROJECT, "Undo test");
    await openSession(page, WS, PROJECT, sid);
    await drawRectangle(page);
    await expect(page.locator(markupShapes)).toHaveCount(1);
    await page.getByTestId("canvas-viewport").click();
    await page.keyboard.press(`${undoMod}+z`);
    await expect(page.locator(markupShapes)).toHaveCount(0);
    await page.keyboard.press(`${undoMod}+Shift+z`);
    await expect(page.locator(markupShapes)).toHaveCount(1);
  });

  test("#011 export returns PNG", async ({ request }) => {
    const res = await request.get(
      `/api/workspaces/${encodeURIComponent(WS)}/projects/${encodeURIComponent(PROJECT)}/sessions/${sessionId}/export`,
    );
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"]).toContain("image/png");
    const buf = await res.body();
    expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });
});

test.describe("Issue #012 — session maintenance", () => {
  const ws = `e2e-maint-${Date.now()}`;
  const project = "maint-proj";
  let sessionId: string;

  test.beforeAll(async ({ request }) => {
    await setupProject(request, ws, project);
    sessionId = await createSession(request, ws, project, "Old title");
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });

  test("edit title and replace base image clears markup when confirmed", async ({ page }) => {
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await page.getByTestId("tool-select").click();
    await page.getByTestId("session-editor-title").fill("New title");
    await page.getByTestId("session-editor-title").blur();
    await page.waitForTimeout(300);
    await expect(page.getByTestId("session-editor-title")).toHaveValue("New title");
    const differentSize = path.join(__dirname, "fixtures", "test-64.png");
    await page.locator('[data-testid="replace-base-image-input"]').setInputFiles(differentSize);
    await page.getByTestId("replace-base-image-clear-markup").click();
    await page.waitForTimeout(800);
    await expect(page.locator(markupShapes)).toHaveCount(0);
  });

  test("delete session returns to project", async ({ page, request }) => {
    const sid = await createSession(request, ws, project, "To delete");
    await openSession(page, ws, project, sid);
    await page.getByTestId("delete-session").click();
    await page.getByTestId("delete-session-confirm").click();
    await expect(page.getByTestId("session-list")).toBeVisible();
  });
});

test.describe("Issue #013 — project deletion", () => {
  const ws = `e2e-del-${Date.now()}`;
  const project = "delete-me";

  test("delete project after typing name", async ({ page, request }) => {
    await setupProject(request, ws, project);
    await page.goto(`/${encodeURIComponent(ws)}/${encodeURIComponent(project)}`);
    await page.getByTestId("project-menu-trigger").click();
    await page.getByTestId("delete-project-toggle").click();
    await page.getByTestId("delete-project-confirm-input").fill(project);
    await page.getByTestId("delete-project-confirm").click();
    await expect(page.getByTestId("workspace-input")).toBeVisible();
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });
});
