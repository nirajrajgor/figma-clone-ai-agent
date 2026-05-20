import { expect, test } from "@playwright/test";
import {
  createSession,
  deleteTestProject,
  fetchSessionDocument,
  pngDimensions,
  setupProject,
} from "./helpers";

const ws = "e2e-v3";
const project = "export-formats";

function jpegMagic(buf: Buffer): boolean {
  return buf.length >= 3 && buf.subarray(0, 3).toString("hex") === "ffd8ff";
}

function contentDispositionFilename(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/filename="([^"]+)"/);
  return match?.[1] ?? null;
}

test.describe("v3 export scale and formats", () => {
  test.beforeAll(async ({ request }) => {
    await setupProject(request, ws, project);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });

  test("2× PNG doubles pixel dimensions and filename suffix", async ({ request }) => {
    const sessionId = await createSession(request, ws, project, "scale export");
    const session = await fetchSessionDocument(request, ws, project, sessionId);
    const artboard = session.document.artboards[0]!;

    const export1x = await request.get(
      `/api/workspaces/${encodeURIComponent(ws)}/projects/${encodeURIComponent(project)}/sessions/${sessionId}/export`,
    );
    expect(export1x.ok()).toBeTruthy();
    const buf1x = Buffer.from(await export1x.body());
    const dims1x = pngDimensions(buf1x);

    const export2x = await request.get(
      `/api/workspaces/${encodeURIComponent(ws)}/projects/${encodeURIComponent(project)}/sessions/${sessionId}/export?scale=2`,
    );
    expect(export2x.ok()).toBeTruthy();
    const buf2x = Buffer.from(await export2x.body());
    const dims2x = pngDimensions(buf2x);
    expect(dims2x.width).toBe(dims1x.width * 2);
    expect(dims2x.height).toBe(dims1x.height * 2);
    expect(dims1x.width).toBe(Math.round(artboard.artboardWidth));
    expect(dims1x.height).toBe(Math.round(artboard.artboardHeight));

    const filename = contentDispositionFilename(export2x.headers()["content-disposition"]);
    expect(filename).toBe("scale export@2x.png");
  });

  test("JPG export works without transparency", async ({ request }) => {
    const sessionId = await createSession(request, ws, project, "jpg export");

    const exportRes = await request.get(
      `/api/workspaces/${encodeURIComponent(ws)}/projects/${encodeURIComponent(project)}/sessions/${sessionId}/export?format=jpg&quality=85`,
    );
    expect(exportRes.ok()).toBeTruthy();
    expect(exportRes.headers()["content-type"]).toContain("image/jpeg");
    const buf = Buffer.from(await exportRes.body());
    expect(jpegMagic(buf)).toBeTruthy();

    const filename = contentDispositionFilename(exportRes.headers()["content-disposition"]);
    expect(filename).toBe("jpg export.jpg");
  });

  test("POST body accepts export options", async ({ request }) => {
    const sessionId = await createSession(request, ws, project, "post export");

    const exportRes = await request.post(
      `/api/workspaces/${encodeURIComponent(ws)}/projects/${encodeURIComponent(project)}/sessions/${sessionId}/export`,
      { data: { format: "jpg", scale: 2, quality: 80 } },
    );
    expect(exportRes.ok()).toBeTruthy();
    expect(exportRes.headers()["content-type"]).toContain("image/jpeg");
    const buf = Buffer.from(await exportRes.body());
    expect(jpegMagic(buf)).toBeTruthy();

    const filename = contentDispositionFilename(exportRes.headers()["content-disposition"]);
    expect(filename).toBe("post export@2x.jpg");
  });
});
