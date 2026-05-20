import path from "path";
import { expect, test } from "@playwright/test";
import {
  createSession,
  deleteTestProject,
  drawRectangle,
  fetchMarkupStack,
  markupShapes,
  openSession,
  setupProject,
} from "./helpers";

const ws = "e2e-v3";
const project = "replace-image";
const FIXTURE = path.join(__dirname, "fixtures", "test.png");
const FIXTURE_64 = path.join(__dirname, "fixtures", "test-64.png");

test.describe("v3 replace image", () => {
  test.beforeAll(async ({ request }) => {
    await setupProject(request, ws, project);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });

  test("same-size replace keeps markup", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "same-size");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await page.getByTestId("tool-select").click();
    await expect(page.getByTestId("session-maintenance")).toBeVisible();
    await expect(page.locator(markupShapes)).toHaveCount(1);

    const before = await fetchMarkupStack(request, ws, project, sessionId);
    expect(before).toHaveLength(1);

    await page.locator('[data-testid="replace-base-image-input"]').setInputFiles(FIXTURE);
    await expect(page.getByTestId("replace-base-image-cancel")).toHaveCount(0);
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });
    await expect(page.locator(markupShapes)).toHaveCount(1);

    const after = await fetchMarkupStack(request, ws, project, sessionId);
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe(before[0].id);
  });

  test("different-size replace shows confirm with options", async ({ page, request }) => {
    const sessionId = await createSession(request, ws, project, "different-size");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await page.getByTestId("tool-select").click();
    await expect(page.getByTestId("session-maintenance")).toBeVisible();

    await page.locator('[data-testid="replace-base-image-input"]').setInputFiles(FIXTURE_64);
    await expect(page.getByTestId("replace-base-image-keep-markup")).toBeVisible();
    await expect(page.getByTestId("replace-base-image-clear-markup")).toBeVisible();
  });
});
