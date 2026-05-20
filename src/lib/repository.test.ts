import { randomUUID } from "crypto";
import { describe, expect, it } from "vitest";
import {
  createProject,
  createSession,
  createWorkspace,
  deleteSession,
  findSession,
  sessionDocument,
} from "./repository";

describe("repository createSession", () => {
  const ws = `vitest-ws-${randomUUID()}`;
  const project = `vitest-proj-${randomUUID()}`;

  it("creates a blank session without an image", () => {
    createWorkspace(ws);
    createProject(ws, project);

    const session = createSession(ws, project, "Blank layout", undefined, {
      frameSize: { width: 390, height: 844 },
    });

    expect(session.id).toBeTruthy();
    expect(session.thumbnailPath).toBeNull();

    const loaded = findSession(ws, project, session.id);
    expect(loaded?.title).toBe("Blank layout");

    const doc = sessionDocument(loaded!);
    expect(doc.artboards).toHaveLength(1);
    expect(doc.artboards[0].imageId).toBeNull();
    expect(doc.artboards[0].markupStack).toEqual([]);
    expect(Object.keys(doc.images)).toHaveLength(0);
    expect(doc.artboards[0].artboardWidth).toBe(390);
    expect(doc.artboards[0].artboardHeight).toBe(844);

    deleteSession(ws, project, session.id);
  });

  it("uses a random session id not derived from image asset id", () => {
    const imageAssetId = randomUUID();
    const uploadSessionId = randomUUID();

    const session = createSession(
      ws,
      project,
      "With image",
      {
        path: `/data/uploads/${uploadSessionId}/base.png`,
        mime: "image/png",
        width: 100,
        height: 80,
        thumbnailPath: `/data/uploads/${uploadSessionId}/thumb.png`,
      },
      { sessionId: uploadSessionId },
    );

    expect(session.id).toBe(uploadSessionId);
    expect(session.id).not.toBe(imageAssetId);

    const doc = sessionDocument(session);
    const storedImageId = doc.artboards[0].imageId;
    expect(storedImageId).toBeTruthy();
    expect(storedImageId).not.toBe(session.id);

    deleteSession(ws, project, session.id);
  });
});
