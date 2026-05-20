import { describe, expect, it } from "vitest";
import {
  clampImageCrop,
  cropImageStyles,
  cropToPreviewBounds,
  previewBoundsToCrop,
  resolveImageCrop,
} from "./image-crop";

describe("image-crop", () => {
  it("defaults to full intrinsic image when crop is unset", () => {
    expect(resolveImageCrop({}, 32, 32)).toEqual({ x: 0, y: 0, width: 32, height: 32 });
  });

  it("clamps crop inside intrinsic bounds", () => {
    expect(
      clampImageCrop({ x: 20, y: 20, width: 32, height: 32 }, 32, 32),
    ).toEqual({ x: 0, y: 0, width: 32, height: 32 });
  });

  it("maps crop to image styles for display", () => {
    const styles = cropImageStyles({ x: 8, y: 8, width: 16, height: 16 }, 32, 32, 64, 64);
    expect(styles.width).toBe(128);
    expect(styles.marginLeft).toBe(-32);
  });

  it("round-trips preview bounds", () => {
    const crop = { x: 4, y: 4, width: 24, height: 24 };
    const bounds = cropToPreviewBounds(crop, 32, 32, 64, 64);
    const next = previewBoundsToCrop(bounds, 32, 32, 64, 64);
    expect(next.x).toBeCloseTo(4, 0);
    expect(next.width).toBeCloseTo(24, 0);
  });
});
