import { describe, expect, it } from "vitest";
import {
  addObject,
  bringForward,
  duplicateObjects,
  removeObjects,
} from "./document";
import type { LineMarkup, RectangleMarkup } from "./types";

describe("markup document", () => {
  it("round-trips via JSON", () => {
    const rect: Omit<RectangleMarkup, "id" | "zIndex"> = {
      type: "rectangle",
      x: 1,
      y: 2,
      width: 10,
      height: 20,
      strokeColor: "#000",
      strokeWidth: 2,
      fillColor: "rgba(0,0,0,0.2)",
      fillEnabled: true,
    };
    const stack = addObject([], rect);
    const json = JSON.parse(JSON.stringify(stack)) as typeof stack;
    expect(json).toHaveLength(1);
    expect(json[0].type).toBe("rectangle");
  });

  it("bringForward raises z-order", () => {
    const box: Omit<RectangleMarkup, "id" | "zIndex"> = {
      type: "rectangle",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      strokeColor: "#000",
      strokeWidth: 1,
      fillColor: "",
      fillEnabled: false,
    };
    const a = addObject([], box);
    const b = addObject(a, box);
    const next = bringForward(b, new Set([b[0].id]));
    expect(next.find((o) => o.id === b[0].id)!.zIndex).toBeGreaterThan(
      next.find((o) => o.id === b[1].id)!.zIndex,
    );
  });

  it("duplicateObjects offsets copies", () => {
    const line: Omit<LineMarkup, "id" | "zIndex"> = {
      type: "line",
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 10,
      strokeColor: "#000",
      strokeWidth: 2,
    };
    const stack = addObject([], line);
    const { stack: next, newIds } = duplicateObjects(stack, new Set([stack[0].id]));
    expect(next).toHaveLength(2);
    expect(newIds).toHaveLength(1);
    const copy = next.find((o) => o.id === newIds[0])!;
    expect(copy.type).toBe("line");
    if (copy.type === "line") {
      expect(copy.x1).toBe(12);
    }
  });

  it("removeObjects deletes by id", () => {
    const rect: Omit<RectangleMarkup, "id" | "zIndex"> = {
      type: "rectangle",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      strokeColor: "#000",
      strokeWidth: 1,
      fillColor: "",
      fillEnabled: false,
    };
    const stack = addObject([], rect);
    const id = stack[0].id;
    expect(removeObjects(stack, new Set([id]))).toHaveLength(0);
  });
});
