import path from "path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { FRAME_PADDING } from "@/lib/markup/artboard";
import { defaultArtboardLayout } from "@/lib/markup/artboard-layout";
import type { ImageCrop } from "@/lib/markup/image-crop";
import { composeExport, composeExportPng, exportFrameDimensions } from "./compositor";
import { DEFAULT_EXPORT_OPTIONS } from "./export-options";
import type { EllipseMarkup, RedactMarkup, RectangleMarkup } from "@/lib/markup/types";
import { DEFAULT_REDACT_FILL } from "@/lib/markup/types";

const fixture = path.join(process.cwd(), "e2e/fixtures/test.png");
const INTRINSIC = 32;
const FULL_CROP: ImageCrop = { x: 0, y: 0, width: INTRINSIC, height: INTRINSIC };

describe("export compositor", () => {
  it("outputs PNG matching artboard frame dimensions by default", async () => {
    const layout = defaultArtboardLayout(INTRINSIC, INTRINSIC);
    const rect: RectangleMarkup = {
      id: "1",
      zIndex: 0,
      type: "rectangle",
      x: 2,
      y: 2,
      width: 6,
      height: 6,
      strokeColor: "#ff0000",
      strokeWidth: 2,
      fillColor: "rgba(255,0,0,0.3)",
      fillEnabled: true,
    };
    const buf = await composeExportPng(fixture, [rect], INTRINSIC, INTRINSIC, layout, FULL_CROP);
    expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    const meta = await sharp(buf).metadata();
    expect(meta.width).toBe(INTRINSIC + FRAME_PADDING * 2);
    expect(meta.height).toBe(INTRINSIC + FRAME_PADDING * 2);
  });

  it("respects scaled image layout within the artboard frame", async () => {
    const layout = {
      artboardWidth: 128,
      artboardHeight: 128,
      imageOffsetX: 56,
      imageOffsetY: 56,
      imageDisplayWidth: 16,
      imageDisplayHeight: 16,
    };
    const buf = await composeExportPng(fixture, [], INTRINSIC, INTRINSIC, layout, FULL_CROP);
    const meta = await sharp(buf).metadata();
    expect(meta.width).toBe(exportFrameDimensions(layout).width);
    expect(meta.height).toBe(exportFrameDimensions(layout).height);
  });

  it("renders ellipse and redact markup", async () => {
    const layout = defaultArtboardLayout(INTRINSIC, INTRINSIC);
    const ellipse: EllipseMarkup = {
      id: "2",
      zIndex: 1,
      type: "ellipse",
      x: 4,
      y: 4,
      width: 12,
      height: 8,
      strokeColor: "#00ff00",
      strokeWidth: 2,
      fillColor: "rgba(0,255,0,0.2)",
      fillEnabled: true,
    };
    const redact: RedactMarkup = {
      id: "3",
      zIndex: 2,
      type: "redact",
      x: 0,
      y: 0,
      width: 6,
      height: 6,
      fillColor: DEFAULT_REDACT_FILL,
      strokeColor: DEFAULT_REDACT_FILL,
      strokeWidth: 0,
    };
    const buf = await composeExportPng(fixture, [ellipse, redact], INTRINSIC, INTRINSIC, layout, FULL_CROP);
    expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  it("extracts cropped region before compositing", async () => {
    const layout = defaultArtboardLayout(16, 16);
    const crop: ImageCrop = { x: 8, y: 8, width: 16, height: 16 };
    const buf = await composeExportPng(fixture, [], INTRINSIC, INTRINSIC, layout, crop);
    const meta = await sharp(buf).metadata();
    expect(meta.width).toBe(exportFrameDimensions(layout).width);
    expect(meta.height).toBe(exportFrameDimensions(layout).height);
  });

  it("doubles pixel dimensions at 2× scale", async () => {
    const layout = defaultArtboardLayout(INTRINSIC, INTRINSIC);
    const buf = await composeExport(fixture, [], INTRINSIC, INTRINSIC, layout, FULL_CROP, {
      ...DEFAULT_EXPORT_OPTIONS,
      scale: 2,
    });
    const meta = await sharp(buf).metadata();
    const base = exportFrameDimensions(layout);
    expect(meta.width).toBe(base.width * 2);
    expect(meta.height).toBe(base.height * 2);
  });

  it("exports JPG without alpha channel", async () => {
    const layout = defaultArtboardLayout(INTRINSIC, INTRINSIC);
    const buf = await composeExport(fixture, [], INTRINSIC, INTRINSIC, layout, FULL_CROP, {
      ...DEFAULT_EXPORT_OPTIONS,
      format: "jpg",
      quality: 85,
    });
    expect(buf.subarray(0, 3).toString("hex")).toBe("ffd8ff");
    const meta = await sharp(buf).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.hasAlpha).toBeFalsy();
  });

  it("applies image opacity on export", async () => {
    const layout = {
      artboardWidth: 32,
      artboardHeight: 32,
      imageOffsetX: 0,
      imageOffsetY: 0,
      imageDisplayWidth: 32,
      imageDisplayHeight: 32,
    };
    const opaque = await composeExportPng(fixture, [], INTRINSIC, INTRINSIC, layout, FULL_CROP, {
      imageOpacity: 100,
    });
    const faded = await composeExportPng(fixture, [], INTRINSIC, INTRINSIC, layout, FULL_CROP, {
      imageOpacity: 50,
    });
    const centerOpaque = await sharp(opaque).raw().toBuffer({ resolveWithObject: true });
    const centerFaded = await sharp(faded).raw().toBuffer({ resolveWithObject: true });
    const idx = (16 * 32 + 16) * centerOpaque.info.channels;
    expect(centerFaded.data[idx]).toBeGreaterThan(centerOpaque.data[idx]!);
  });

  it("clips frame content to rounded corners on export", async () => {
    const layout = {
      artboardWidth: 32,
      artboardHeight: 32,
      imageOffsetX: 0,
      imageOffsetY: 0,
      imageDisplayWidth: 32,
      imageDisplayHeight: 32,
    };
    const square = await composeExportPng(fixture, [], INTRINSIC, INTRINSIC, layout, FULL_CROP);
    const rounded = await composeExportPng(fixture, [], INTRINSIC, INTRINSIC, layout, FULL_CROP, {
      frameCornerRadius: 12,
    });
    const squareCorner = await sharp(square).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
    const roundedCorner = await sharp(rounded).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
    expect(squareCorner[0]).toBeLessThan(250);
    expect(roundedCorner[0]).toBe(255);
    expect(roundedCorner[1]).toBe(255);
    expect(roundedCorner[2]).toBe(255);
  });
});
