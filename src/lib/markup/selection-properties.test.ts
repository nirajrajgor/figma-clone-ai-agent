import { describe, expect, it } from "vitest";
import { addObject, updateObjects } from "./document";
import {
  commonProperty,
  fillShape,
  hasFillShape,
  hasStrokeCapable,
  strokeCapable,
} from "./selection-properties";
import type { LineMarkup, RectangleMarkup } from "./types";

describe("selection-properties", () => {
  const rect: Omit<RectangleMarkup, "id" | "zIndex"> = {
    type: "rectangle",
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    strokeColor: "#ff0000",
    strokeWidth: 4,
    fillColor: "rgba(255,0,0,0.2)",
    fillEnabled: true,
  };

  const line: Omit<LineMarkup, "id" | "zIndex"> = {
    type: "line",
    x1: 0,
    y1: 0,
    x2: 5,
    y2: 5,
    strokeColor: "#00ff00",
    strokeWidth: 2,
  };

  it("commonProperty returns shared value when unanimous", () => {
    const stack = addObject(addObject([], rect), { ...rect, strokeColor: "#ff0000" });
    expect(commonProperty(stack, (o) => (strokeCapable(o) ? o.strokeColor : undefined))).toBe(
      "#ff0000",
    );
  });

  it("commonProperty returns undefined when mixed", () => {
    const stack = addObject(addObject([], rect), line);
    expect(commonProperty(stack, (o) => (strokeCapable(o) ? o.strokeColor : undefined))).toBe(
      undefined,
    );
  });

  it("hasStrokeCapable and hasFillShape detect selection types", () => {
    const stack = addObject([], rect);
    expect(hasStrokeCapable(stack)).toBe(true);
    expect(hasFillShape(stack)).toBe(true);
    expect(hasFillShape(addObject([], line))).toBe(false);
  });

  it("updateObjects patches only matching types", () => {
    const stack = addObject(addObject([], rect), line);
    const ids = new Set(stack.map((o) => o.id));
    const next = updateObjects(stack, ids, { strokeColor: "#0000ff" }, strokeCapable);
    expect(next.find((o) => o.type === "rectangle")!.strokeColor).toBe("#0000ff");
    expect(next.find((o) => o.type === "line")!.strokeColor).toBe("#0000ff");
  });

  it("updateObjects skips non-matching types with fillShape predicate", () => {
    const stack = addObject(addObject([], rect), line);
    const ids = new Set(stack.map((o) => o.id));
    const next = updateObjects(stack, ids, { fillEnabled: false }, fillShape);
    expect(next.find((o) => o.type === "rectangle")!.fillEnabled).toBe(false);
    expect(next.find((o) => o.type === "line")).toBeDefined();
  });
});
