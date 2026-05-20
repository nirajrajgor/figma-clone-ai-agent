import { describe, expect, it } from "vitest";
import { boxHandles, cursorForHandle, hitBoxHandle, objectBounds, selectionBounds, unionBounds } from "./bounds";
import type { RectangleMarkup } from "./types";

describe("bounds", () => {
  const rect: RectangleMarkup = {
    id: "r1",
    zIndex: 0,
    type: "rectangle",
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    strokeColor: "#000",
    strokeWidth: 2,
    fillColor: "#fff",
    fillEnabled: true,
  };

  it("computes object bounds for rectangles", () => {
    expect(objectBounds(rect)).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it("unions multiple bounds", () => {
    expect(
      unionBounds([
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 5, y: 5, width: 20, height: 20 },
      ]),
    ).toEqual({ x: 0, y: 0, width: 25, height: 25 });
  });

  it("returns selection bounds for selected ids", () => {
    expect(selectionBounds([rect], new Set(["r1"]))).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
  });

  it("places eight handles on a box", () => {
    expect(boxHandles({ x: 0, y: 0, width: 20, height: 10 })).toHaveLength(8);
  });

  it("maps resize handles to CSS cursors", () => {
    expect(cursorForHandle("se")).toBe("nwse-resize");
    expect(cursorForHandle("e")).toBe("ew-resize");
  });

  it("uses a larger hit radius for artboard handles", () => {
    expect(hitBoxHandle(29, 0, { x: 0, y: 0, width: 20, height: 10 }, 1, 12)).toBe("ne");
    expect(hitBoxHandle(29, 0, { x: 0, y: 0, width: 20, height: 10 }, 1, 8)).toBeNull();
  });
});
