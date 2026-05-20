import { describe, expect, it } from "vitest";
import {
  artboardToImage,
  displayToIntrinsic,
  imageToArtboard,
  isInImageContent,
  isOnArtboard,
} from "./artboard";

describe("artboard", () => {
  it("converts between artboard and image coordinates", () => {
    expect(artboardToImage(60, 80, 48, 48)).toEqual({ x: 12, y: 32 });
    expect(imageToArtboard(12, 32, 48, 48)).toEqual({ x: 60, y: 80 });
  });

  it("keeps display coords when intrinsic size is zero (blank frame)", () => {
    expect(displayToIntrinsic(120, 200, 0, 0, 390, 844)).toEqual({ x: 120, y: 200 });
  });

  it("detects image content hits", () => {
    expect(isInImageContent(10, 10, 800, 600)).toBe(true);
    expect(isInImageContent(-1, 0, 800, 600)).toBe(false);
    expect(isOnArtboard(10, 10, 896, 696)).toBe(true);
    expect(isOnArtboard(900, 10, 896, 696)).toBe(false);
  });
});
