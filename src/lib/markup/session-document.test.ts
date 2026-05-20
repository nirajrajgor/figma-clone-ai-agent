import { describe, expect, it } from "vitest";
import {
  createBlankInitialSessionDocument,
  createEmptyArtboard,
  createInitialSessionDocument,
  documentBounds,
  findArtboardAt,
  migrateArtboardFillMode,
  normalizeSessionDocument,
  resolveImageDropTarget,
  moveImageBetweenArtboards,
  placementForNewArtboard,
  placementOffsetFromActiveArtboard,
  PRESET_ARTBOARD_OFFSET_X,
} from "./session-document";

describe("session-document", () => {
  it("creates a blank initial session document with one empty artboard", () => {
    const doc = createBlankInitialSessionDocument("Login v2");
    expect(doc.artboards).toHaveLength(1);
    expect(doc.artboards[0].title).toBe("Login v2");
    expect(doc.artboards[0].imageId).toBeNull();
    expect(doc.artboards[0].markupStack).toEqual([]);
    expect(Object.keys(doc.images)).toHaveLength(0);
    expect(doc.activeArtboardId).toBe(doc.artboards[0].id);
    expect(doc.artboards[0].artboardWidth).toBe(640);
    expect(doc.artboards[0].artboardHeight).toBe(480);
  });

  it("creates a blank document with a custom frame size", () => {
    const doc = createBlankInitialSessionDocument("Phone", { width: 390, height: 844 });
    expect(doc.artboards[0].artboardWidth).toBe(390);
    expect(doc.artboards[0].artboardHeight).toBe(844);
  });

  it("creates an initial session document from an image asset", () => {
    const doc = createInitialSessionDocument("Screen", {
      id: "img-1",
      path: "/data/uploads/s1/base.png",
      mime: "image/png",
      width: 100,
      height: 80,
    });
    expect(doc.artboards).toHaveLength(1);
    expect(doc.artboards[0].title).toBe("Screen");
    expect(doc.artboards[0].imageId).toBe("img-1");
    expect(Object.keys(doc.images)).toHaveLength(1);
  });

  it("places new artboards to the right of existing ones", () => {
    const first = createEmptyArtboard([], 0, 0);
    const spot = placementForNewArtboard([first]);
    expect(spot.x).toBeGreaterThan(first.artboardWidth);
  });

  it("places preset frames offset to the right of the active artboard", () => {
    const phone = createEmptyArtboard([], 100, 50, { width: 390, height: 844 });
    const tablet = createEmptyArtboard([phone], 600, 50, { width: 768, height: 1024 });
    const spot = placementOffsetFromActiveArtboard(phone, [phone, tablet]);
    expect(spot).toEqual({
      x: phone.x + phone.artboardWidth + PRESET_ARTBOARD_OFFSET_X,
      y: phone.y,
    });
  });

  it("falls back to placementForNewArtboard when no active artboard", () => {
    const first = createEmptyArtboard([], 0, 0);
    expect(placementOffsetFromActiveArtboard(null, [first])).toEqual(
      placementForNewArtboard([first]),
    );
  });

  it("finds artboards in canvas coordinates", () => {
    const a = createEmptyArtboard([], 0, 0);
    const b = createEmptyArtboard([a], 700, 0);
    const doc = {
      version: 1 as const,
      activeArtboardId: a.id,
      images: {},
      artboards: [a, b],
    };
    expect(findArtboardAt(doc, 10, 10)?.id).toBe(a.id);
    expect(findArtboardAt(doc, 710, 10)?.id).toBe(b.id);
  });

  it("resolves image drop target from pointer or hover", () => {
    const source = createEmptyArtboard([], 0, 0);
    const target = createEmptyArtboard([source], 700, 0);
    const doc = { artboards: [source, target] };
    expect(resolveImageDropTarget(doc, 10, 10, source.id, null)).toBeNull();
    expect(
      resolveImageDropTarget(doc, 710, 10, source.id, null)?.id,
    ).toBe(target.id);
    expect(
      resolveImageDropTarget(doc, 10, 10, source.id, target.id)?.id,
    ).toBe(target.id);
  });

  it("moves an image from one artboard to another", () => {
    const imageId = "img-1";
    const source = createEmptyArtboard([], 0, 0);
    source.imageId = imageId;
    const target = createEmptyArtboard([source], 700, 0);
    const doc = {
      version: 1 as const,
      activeArtboardId: source.id,
      images: {
        [imageId]: {
          id: imageId,
          path: "/data/uploads/s1/base.png",
          mime: "image/png",
          width: 100,
          height: 80,
        },
      },
      artboards: [source, target],
    };
    const next = moveImageBetweenArtboards(doc, source.id, target.id);
    expect(next.artboards.find((a) => a.id === source.id)?.imageId).toBeNull();
    expect(next.artboards.find((a) => a.id === target.id)?.imageId).toBe(imageId);
    expect(next.activeArtboardId).toBe(target.id);
  });

  it("computes bounds for all artboards", () => {
    const a = createEmptyArtboard([], 0, 0, { width: 200, height: 100 });
    const b = createEmptyArtboard([a], 300, 50, { width: 100, height: 200 });
    const bounds = documentBounds({ artboards: [a, b] });
    expect(bounds).toEqual({ x: 0, y: 0, width: 400, height: 250 });
  });

  it("defaults new sessions to fit fill mode", () => {
    const doc = createInitialSessionDocument("Screen", {
      id: "img-1",
      path: "/data/uploads/s1/base.png",
      mime: "image/png",
      width: 100,
      height: 80,
    });
    expect(doc.artboards[0].imageFillMode).toBe("fit");
  });

  it("migrates legacy artboards to fit when layout matches 100% fit", () => {
    const doc = createInitialSessionDocument("Screen", {
      id: "img-1",
      path: "/data/uploads/s1/base.png",
      mime: "image/png",
      width: 100,
      height: 80,
    });
    const legacy = {
      ...doc,
      artboards: [{ ...doc.artboards[0], imageFillMode: undefined }],
    };
    const migrated = normalizeSessionDocument(legacy);
    expect(migrated.artboards[0].imageFillMode).toBe("fit");
  });

  it("migrates legacy manual layouts to crop mode", () => {
    const doc = createInitialSessionDocument("Screen", {
      id: "img-1",
      path: "/data/uploads/s1/base.png",
      mime: "image/png",
      width: 100,
      height: 80,
    });
    const artboard = {
      ...doc.artboards[0],
      imageFillMode: undefined,
      imageDisplayWidth: 60,
      imageDisplayHeight: 40,
    };
    expect(
      migrateArtboardFillMode(artboard, { width: 100, height: 80 }),
    ).toBe("crop");
  });
});
