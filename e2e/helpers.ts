import path from "path";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const FIXTURE = path.join(__dirname, "fixtures", "test.png");

export const undoMod = process.platform === "darwin" ? "Meta" : "Control";

export const markupShapes = '[data-markup-shape]';

export function pngDimensions(buf: Buffer): { width: number; height: number } {
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

export async function setupProject(
  request: APIRequestContext,
  ws: string,
  project: string,
) {
  await request.post("/api/workspaces", { data: { name: ws } });
  await request.post(`/api/workspaces/${encodeURIComponent(ws)}/projects`, {
    data: { name: project },
  });
}

/** Deletes a project created by E2E tests. Only runs when workspace name starts with `e2e-`. */
export async function deleteTestProject(
  request: APIRequestContext,
  ws: string,
  project: string,
) {
  if (!ws.startsWith("e2e-")) {
    throw new Error(
      `Refusing cleanup: workspace "${ws}" is not test data (must start with e2e-)`,
    );
  }
  const res = await request.delete(
    `/api/workspaces/${encodeURIComponent(ws)}/projects/${encodeURIComponent(project)}`,
    { data: { confirmName: project } },
  );
  if (!res.ok() && res.status() !== 404) {
    throw new Error(`Failed to delete test project ${ws}/${project}: ${res.status()}`);
  }
}

export type CreateSessionOptions = {
  /** phone | tablet | desktop — sent when creating a blank file */
  preset?: "phone" | "tablet" | "desktop";
  /** Include test fixture image (default true) */
  withImage?: boolean;
};

export async function createSession(
  request: APIRequestContext,
  ws: string,
  project: string,
  title: string,
  options?: CreateSessionOptions,
) {
  const { preset = "phone", withImage = true } = options ?? {};
  const form = new FormData();
  form.set("title", title);
  if (!withImage) {
    form.set("preset", preset);
  } else {
    const fs = await import("fs");
    form.set(
      "image",
      new Blob([fs.readFileSync(FIXTURE)], { type: "image/png" }),
      "test.png",
    );
  }
  const res = await request.post(
    `/api/workspaces/${encodeURIComponent(ws)}/projects/${encodeURIComponent(project)}/sessions`,
    { multipart: form },
  );
  const body = await res.json();
  return body.sessionId as string;
}

export async function openSession(
  page: Page,
  ws: string,
  project: string,
  sessionId: string,
) {
  await page.goto(
    `/${encodeURIComponent(ws)}/${encodeURIComponent(project)}/sessions/${sessionId}`,
  );
  await page.getByTestId("annotation-editor-loading").waitFor({ state: "hidden" });
  await page.getByTestId("base-image").waitFor();
}

export async function drawRectangle(page: Page) {
  await page.getByTestId("tool-rectangle").click();
  await dragViewport(page, 0.25, 0.25, 0.55, 0.55);
  await expect(page.getByTestId("save-status")).toHaveText("Saved", { timeout: 5000 });
}

export async function frameContentBox(page: Page) {
  const box = await page.getByTestId("frame-content").boundingBox();
  if (!box) throw new Error("no frame-content");
  return box;
}

export async function viewportBox(page: Page) {
  const box = await page.getByTestId("canvas-viewport").boundingBox();
  if (!box) throw new Error("no viewport");
  return box;
}

/** Drag within the image area using fractional coordinates (0–1). */
export async function dragFrameContent(
  page: Page,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const box = await frameContentBox(page);
  const startX = box.x + box.width * x1;
  const startY = box.y + box.height * y1;
  const endX = box.x + box.width * x2;
  const endY = box.y + box.height * y2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY);
  await page.mouse.up();
}

/** Click within the image area using fractional coordinates (0–1). */
export async function clickFrameContent(page: Page, x: number, y: number) {
  const box = await frameContentBox(page);
  await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
}

/** Double-click within the image area using fractional coordinates (0–1). */
export async function doubleClickFrameContent(page: Page, x: number, y: number) {
  const box = await frameContentBox(page);
  await page.mouse.dblclick(box.x + box.width * x, box.y + box.height * y);
}

/** Drag within the canvas using fractional coordinates (0–1). */
export async function dragViewport(
  page: Page,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  await dragFrameContent(page, x1, y1, x2, y2);
}

/** Click within the canvas using fractional coordinates (0–1). */
export async function clickViewport(page: Page, x: number, y: number) {
  await clickFrameContent(page, x, y);
}

export async function activateToolbarTool(page: Page, tool: string) {
  await page.getByTestId(`tool-${tool}`).click();
  await expect(page.getByTestId(`tool-${tool}`)).toHaveAttribute("aria-pressed", "true");
}

export async function placeTextLabel(
  page: Page,
  x: number,
  y: number,
  label: string,
) {
  await page.getByTestId("tool-text").click();
  await clickViewport(page, x, y);
  await page.getByTestId("text-inline-input").waitFor();
  await page.getByTestId("text-inline-input").fill(label);
  await page.getByTestId("text-inline-input").press("Enter");
  await page.waitForTimeout(700);
}

export async function expectTextOnCanvas(page: Page, text: string) {
  await expect(page.getByTestId("markup-layer").getByText(text)).toBeVisible();
}

/** Open frame properties and switch to Crop fill mode (manual image positioning). */
export async function switchToCropFillMode(page: Page) {
  await page.getByTestId("tool-select").click();
  await clickFrameContent(page, 0.5, 0.5);
  await expect(page.getByTestId("frame-properties")).toBeVisible();
  await page.getByTestId("image-fill-mode").click();
  await page.getByRole("option", { name: "Crop" }).click();
}

/** Select base image (requires Crop fill mode). */
export async function selectBaseImage(page: Page) {
  await switchToCropFillMode(page);
  await clickFrameContent(page, 0.5, 0.5);
  await expect(page.getByTestId("image-selection-overlay")).toBeVisible();
}

export async function fetchMarkupStack(
  request: APIRequestContext,
  ws: string,
  project: string,
  sessionId: string,
): Promise<Array<{ id: string; type: string; x?: number; zIndex: number }>> {
  const doc = await fetchSessionDocument(request, ws, project, sessionId);
  const active =
    doc.document.artboards.find((a) => a.id === doc.document.activeArtboardId) ??
    doc.document.artboards[0];
  return active?.markupStack ?? [];
}

export async function fetchSessionDocument(
  request: APIRequestContext,
  ws: string,
  project: string,
  sessionId: string,
) {
  const res = await request.get(
    `/api/workspaces/${encodeURIComponent(ws)}/projects/${encodeURIComponent(project)}/sessions/${sessionId}`,
  );
  if (!res.ok()) throw new Error(`Failed to fetch session: ${res.status()}`);
  return (await res.json()) as {
    id: string;
    title: string;
    document: {
      version: number;
      activeArtboardId: string;
      artboards: Array<{
        id: string;
        title: string;
        x: number;
        y: number;
        artboardWidth: number;
        artboardHeight: number;
        imageId: string | null;
        markupStack: Array<{ id: string; type: string; x?: number; zIndex: number }>;
      }>;
    };
  };
}

export async function canvasPointToScreen(page: Page, canvasX: number, canvasY: number) {
  const vp = await viewportBox(page);
  const transform = await page.getByTestId("canvas-transform-layer").evaluate((el) => {
    const matrix = new DOMMatrix(window.getComputedStyle(el).transform);
    return { ox: matrix.e, oy: matrix.f, scale: matrix.a };
  });
  return {
    x: vp.x + transform.ox + canvasX * transform.scale,
    y: vp.y + transform.oy + canvasY * transform.scale,
  };
}

export async function dragCanvas(
  page: Page,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const start = await canvasPointToScreen(page, x1, y1);
  const end = await canvasPointToScreen(page, x2, y2);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 12 });
  await page.mouse.up();
}

export async function selectArtboard(page: Page, title: string) {
  await page.getByTestId("artboard-select").click();
  await page.getByRole("option", { name: title }).click();
}
