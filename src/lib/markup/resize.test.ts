import { describe, expect, it } from "vitest";
import { sortByZIndex } from "./document";
import { groupBounds, groupObjects } from "./groups";
import { applyResize } from "./resize";
import type { LineMarkup, RectangleMarkup } from "./types";

describe("group resize", () => {
  it("scales all members when resizing group bounds", () => {
    const rect: RectangleMarkup = {
      type: "rectangle",
      id: "r",
      zIndex: 0,
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      strokeColor: "#000",
      strokeWidth: 1,
      fillColor: "",
      fillEnabled: false,
    };
    const line: LineMarkup = {
      type: "line",
      id: "l",
      zIndex: 1,
      x1: 10,
      y1: 10,
      x2: 30,
      y2: 30,
      strokeColor: "#000",
      strokeWidth: 1,
    };
    const { stack: grouped, groupId } = groupObjects(sortByZIndex([rect, line]), new Set(["r", "l"]));
    const start = groupBounds(grouped, groupId!)!;
    const next = applyResize(grouped, new Set([groupId!]), "se", start, {
      x: start.x + start.width * 2,
      y: start.y + start.height * 2,
    });
    const resizedRect = next.find((o) => o.id === "r")!;
    expect(resizedRect.type).toBe("rectangle");
    if (resizedRect.type === "rectangle") {
      expect(resizedRect.width).toBeGreaterThan(20);
      expect(resizedRect.height).toBeGreaterThan(20);
    }
  });
});
