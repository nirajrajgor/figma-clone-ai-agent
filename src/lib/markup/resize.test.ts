import { describe, expect, it } from "vitest";
import { applyResize } from "./resize";
import type { RectangleMarkup } from "./types";

describe("resize", () => {
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

  it("resizes a rectangle from the south-east handle", () => {
    const next = applyResize([rect], new Set(["r1"]), "se", { x: 10, y: 20, width: 100, height: 50 }, {
      x: 130,
      y: 90,
    });
    expect(next[0]).toMatchObject({ x: 10, y: 20, width: 120, height: 70 });
  });
});
