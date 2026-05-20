import { describe, expect, it } from "vitest";
import {
  applyArtboardResize,
  applyFillModeLayout,
  applyImageResize,
  artboardLayoutFromDrag,
  computeFillImageLayout,
  computeFitImageLayout,
  defaultArtboardLayout,
  fitArtboardToImage,
  layoutFromArtboard,
  layoutFromBlankArtboard,
  minArtboardSize,
  normalizeArtboardLayout,
  resolveArtboardLayout,
} from "./artboard-layout";

describe("artboard-layout", () => {
  it("blank artboard layout uses full frame as drawable area", () => {
    expect(
      layoutFromBlankArtboard({ artboardWidth: 390, artboardHeight: 844 }),
    ).toEqual({
      artboardWidth: 390,
      artboardHeight: 844,
      imageOffsetX: 0,
      imageOffsetY: 0,
      imageDisplayWidth: 390,
      imageDisplayHeight: 844,
    });
  });

  it("defaults layout from image size", () => {
    expect(defaultArtboardLayout(800, 600)).toEqual({
      artboardWidth: 896,
      artboardHeight: 696,
      imageOffsetX: 48,
      imageOffsetY: 48,
      imageDisplayWidth: 800,
      imageDisplayHeight: 600,
    });
  });

  it("resolves stored layout", () => {
    expect(
      resolveArtboardLayout(100, 80, {
        artboardWidth: 400,
        artboardHeight: 300,
        imageOffsetX: 50,
        imageOffsetY: 40,
        imageDisplayWidth: 120,
        imageDisplayHeight: 90,
      }),
    ).toMatchObject({
      artboardWidth: 400,
      artboardHeight: 300,
      imageOffsetX: 50,
      imageOffsetY: 40,
      imageDisplayWidth: 120,
      imageDisplayHeight: 90,
    });
  });

  it("creates artboard from drag with centered image", () => {
    const layout = artboardLayoutFromDrag(0, 0, 500, 400, 100, 80);
    expect(layout.artboardWidth).toBe(500);
    expect(layout.artboardHeight).toBe(400);
    expect(layout.imageDisplayWidth).toBe(100);
    expect(layout.imageDisplayHeight).toBe(80);
    expect(layout.imageOffsetX).toBeGreaterThan(0);
    expect(minArtboardSize().width).toBe(120);
  });

  it("resizes artboard without changing image display size in crop mode", () => {
    const layout = layoutFromArtboard(
      {
        artboardWidth: 500,
        artboardHeight: 400,
        imageOffsetX: 40,
        imageOffsetY: 30,
        imageDisplayWidth: 200,
        imageDisplayHeight: 150,
        imageFillMode: "crop",
      },
      800,
      600,
    );
    const next = applyArtboardResize(layout, "e", { x: 300, y: 0 }, "crop");
    expect(next.artboardWidth).toBe(300);
    expect(next.artboardHeight).toBe(400);
    expect(next.imageDisplayWidth).toBe(200);
    expect(next.imageDisplayHeight).toBe(150);
    expect(next.imageOffsetX).toBe(40);
  });

  it("resizes artboard and recalculates image display in fit mode", () => {
    const layout = layoutFromArtboard(
      {
        artboardWidth: 896,
        artboardHeight: 696,
        imageOffsetX: 48,
        imageOffsetY: 48,
        imageDisplayWidth: 800,
        imageDisplayHeight: 600,
        imageFillMode: "fit",
      },
      800,
      600,
    );
    const next = applyArtboardResize(layout, "e", { x: 500, y: 696 }, "fit", 800, 600);
    const expected = computeFitImageLayout(500, 696, 800, 600);
    expect(next.artboardWidth).toBe(500);
    expect(next.imageDisplayWidth).toBeCloseTo(expected.imageDisplayWidth, 4);
    expect(next.imageDisplayHeight).toBeCloseTo(expected.imageDisplayHeight, 4);
    expect(next.imageOffsetX).toBeCloseTo(expected.imageOffsetX, 4);
    expect(next.imageOffsetY).toBeCloseTo(expected.imageOffsetY, 4);
  });

  it("resizes artboard and recalculates image display in fill mode", () => {
    const layout = layoutFromArtboard(
      {
        artboardWidth: 896,
        artboardHeight: 696,
        imageOffsetX: 48,
        imageOffsetY: 48,
        imageDisplayWidth: 800,
        imageDisplayHeight: 600,
        imageFillMode: "fill",
      },
      800,
      600,
    );
    const next = applyArtboardResize(layout, "s", { x: 896, y: 500 }, "fill", 800, 600);
    const expected = computeFillImageLayout(896, 500, 800, 600);
    expect(next.artboardHeight).toBe(500);
    expect(next.imageDisplayWidth).toBeCloseTo(expected.imageDisplayWidth, 4);
    expect(next.imageDisplayHeight).toBeCloseTo(expected.imageDisplayHeight, 4);
  });

  it("computes fit layout at 100% for default frame sizing", () => {
    const fit = computeFitImageLayout(896, 696, 800, 600);
    expect(fit.imageDisplayWidth).toBe(800);
    expect(fit.imageDisplayHeight).toBe(600);
    expect(fit.imageOffsetX).toBe(48);
    expect(fit.imageOffsetY).toBe(48);
  });

  it("computes fill layout to cover padded content area", () => {
    const fill = computeFillImageLayout(500, 400, 800, 600);
    expect(fill.imageDisplayWidth).toBeGreaterThanOrEqual(404);
    expect(fill.imageDisplayHeight).toBeGreaterThanOrEqual(304);
    expect(fill.imageDisplayWidth / fill.imageDisplayHeight).toBeCloseTo(800 / 600, 4);
  });

  it("resolves fit mode layout from stored artboard", () => {
    const layout = layoutFromArtboard(
      {
        artboardWidth: 500,
        artboardHeight: 400,
        imageOffsetX: 0,
        imageOffsetY: 0,
        imageFillMode: "fit",
      },
      800,
      600,
      800,
      600,
    );
    const expected = computeFitImageLayout(500, 400, 800, 600);
    expect(layout.imageDisplayWidth).toBeCloseTo(expected.imageDisplayWidth, 4);
    expect(layout.imageDisplayHeight).toBeCloseTo(expected.imageDisplayHeight, 4);
  });

  it("uses stored manual layout in crop mode", () => {
    const layout = layoutFromArtboard(
      {
        artboardWidth: 500,
        artboardHeight: 400,
        imageOffsetX: 12,
        imageOffsetY: 18,
        imageDisplayWidth: 220,
        imageDisplayHeight: 140,
        imageFillMode: "crop",
      },
      800,
      600,
    );
    expect(layout.imageOffsetX).toBe(12);
    expect(layout.imageDisplayWidth).toBe(220);
  });

  it("switches fill mode via applyFillModeLayout", () => {
    const manual = {
      imageOffsetX: 12,
      imageOffsetY: 18,
      imageDisplayWidth: 220,
      imageDisplayHeight: 140,
    };
    const fit = applyFillModeLayout("fit", 500, 400, 800, 600, manual);
    expect(fit.imageDisplayWidth).not.toBe(220);
    const crop = applyFillModeLayout("crop", 500, 400, 800, 600, manual);
    expect(crop).toEqual(manual);
  });

  it("resizes image display size without changing artboard size", () => {
    const layout = layoutFromArtboard(
      {
        artboardWidth: 500,
        artboardHeight: 400,
        imageOffsetX: 40,
        imageOffsetY: 30,
        imageDisplayWidth: 200,
        imageDisplayHeight: 150,
        imageFillMode: "crop",
      },
      800,
      600,
    );
    const next = applyImageResize(layout, "se", { x: 280, y: 220 });
    expect(next.artboardWidth).toBe(500);
    expect(next.artboardHeight).toBe(400);
    expect(next.imageDisplayWidth).toBe(240);
    expect(next.imageDisplayHeight).toBe(190);
  });

  it("fits frame around current image display size", () => {
    const layout = layoutFromArtboard(
      {
        artboardWidth: 900,
        artboardHeight: 700,
        imageOffsetX: 10,
        imageOffsetY: 20,
        imageDisplayWidth: 200,
        imageDisplayHeight: 150,
        imageFillMode: "crop",
      },
      800,
      600,
    );
    const next = fitArtboardToImage(layout);
    expect(next).toEqual(
      normalizeArtboardLayout({
        ...layout,
        artboardWidth: 296,
        artboardHeight: 246,
        imageOffsetX: 48,
        imageOffsetY: 48,
      }),
    );
  });

  it("falls back when crop mode has null stored offsets", () => {
    const layout = layoutFromArtboard(
      {
        artboardWidth: 128,
        artboardHeight: 128,
        imageOffsetX: null as unknown as number,
        imageOffsetY: null as unknown as number,
        imageDisplayWidth: null as unknown as number,
        imageDisplayHeight: null as unknown as number,
        imageFillMode: "crop",
      },
      32,
      32,
    );
    expect(Number.isFinite(layout.imageOffsetX)).toBe(true);
    expect(Number.isFinite(layout.imageOffsetY)).toBe(true);
    expect(layout.imageDisplayWidth).toBeGreaterThan(0);
  });

  it("handles zero crop dimensions without NaN", () => {
    const layout = computeFitImageLayout(128, 128, 0, 0);
    expect(Number.isFinite(layout.imageOffsetX)).toBe(true);
    expect(Number.isFinite(layout.imageOffsetY)).toBe(true);
  });
});
