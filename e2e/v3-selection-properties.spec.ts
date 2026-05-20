import { expect, test } from "@playwright/test";
import {
  clickFrameContent,
  createSession,
  deleteTestProject,
  drawRectangle,
  fetchSessionDocument,
  markupShapes,
  openSession,
  setupProject,
} from "./helpers";

const ws = "e2e-v3";
const project = "selection-props";

test.describe("v3 selection properties", () => {
  test.beforeAll(async ({ request }) => {
    await setupProject(request, ws, project);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });

  test("changing stroke on selected shape updates canvas and persists", async ({
    page,
    request,
  }) => {
    const sessionId = await createSession(request, ws, project, "stroke edit");
    await openSession(page, ws, project, sessionId);
    await drawRectangle(page);
    await expect(page.locator(markupShapes)).toHaveCount(1);

    await page.getByTestId("tool-select").click();
    await clickFrameContent(page, 0.4, 0.4);
    await expect(
      page.getByTestId("markup-properties-panel").getByText("Selection", { exact: true }),
    ).toBeVisible();

    await page.getByTestId("stroke-color").fill("#0000ff");
    await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });
    await expect(page.locator(markupShapes).first()).toHaveAttribute("stroke", "#0000ff");

    const doc = await fetchSessionDocument(request, ws, project, sessionId);
    const active =
      doc.document.artboards.find((a) => a.id === doc.document.activeArtboardId) ??
      doc.document.artboards[0];
    const rect = active?.markupStack.find((o) => o.type === "rectangle") as
      | { strokeColor: string }
      | undefined;
    expect(rect?.strokeColor).toBe("#0000ff");
  });
});
