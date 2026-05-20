import { expect, test } from "@playwright/test";
import {
  createSession,
  deleteTestProject,
  fetchSessionDocument,
  pngDimensions,
  setupProject,
} from "./helpers";

const ws = "e2e-v3";
const project = "export-artboard";

test.describe("v3 export matches artboard", () => {
  test.beforeAll(async ({ request }) => {
    await setupProject(request, ws, project);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });

  test("export PNG dimensions follow artboard layout", async ({ request }) => {
    const sessionId = await createSession(request, ws, project, "export layout");
    const session = await fetchSessionDocument(request, ws, project, sessionId);
    const artboard = session.document.artboards[0]!;

    const scaledDocument = {
      version: session.document.version,
      activeArtboardId: session.document.activeArtboardId,
      artboards: [
        {
          ...artboard,
          imageDisplayWidth: 16,
          imageDisplayHeight: 16,
          imageOffsetX: 56,
          imageOffsetY: 56,
        },
      ],
      images: {},
    };

    const putRes = await request.put(
      `/api/workspaces/${encodeURIComponent(ws)}/projects/${encodeURIComponent(project)}/sessions/${sessionId}`,
      { data: { document: scaledDocument } },
    );
    expect(putRes.ok()).toBeTruthy();

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
