import { describe, expect, it } from "vitest";
import {
  addObject,
  bringForward,
  duplicateObjects,
  moveObjects,
  removeObjects,
  sendBackward,
  sortByZIndex,
} from "./document";
import { groupObjects } from "./groups";
import type { LineMarkup, MarkupObject, RectangleMarkup } from "./types";

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

  it("bringForward works for a grouped child selection", () => {
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
    const line: Omit<LineMarkup, "id" | "zIndex"> = {
      type: "line",
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
      strokeColor: "#000",
      strokeWidth: 1,
    };
    let stack = addObject([], box);
    stack = addObject(stack, line);
    stack = addObject(stack, box);
    const bottom = stack[0]!;
    const { stack: grouped, groupId } = groupObjects(stack, new Set([stack[1]!.id, stack[2]!.id]));
    const groupMember = grouped.find((o) => o.id === stack[1]!.id)!;

    const next = bringForward(grouped, new Set([groupMember.id]));
    expect(next.find((o) => o.id === bottom.id)!.zIndex).toBeLessThan(
      next.find((o) => o.id === groupMember.id)!.zIndex,
    );
    expect(groupId).toBeTruthy();
  });

  it("sendBackward lowers z-order for a group", () => {
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
    const line: Omit<LineMarkup, "id" | "zIndex"> = {
      type: "line",
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
      strokeColor: "#000",
      strokeWidth: 1,
    };
    let stack = addObject([], box);
    stack = addObject(stack, line);
    stack = addObject(stack, box);
    const { stack: grouped, groupId } = groupObjects(
      stack,
      new Set([stack[1]!.id, stack[2]!.id]),
    );
    const member = grouped.find((o) => o.id === stack[2]!.id)!;
    const beforeZ = member.zIndex;

    const next = sendBackward(grouped, new Set([groupId!]));
    const memberAfter = next.find((o) => o.id === member.id)!;
    expect(memberAfter.zIndex).toBeLessThan(beforeZ);
  });

  it("bringForward reorders within a group before moving the whole group", () => {
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
    const line: Omit<LineMarkup, "id" | "zIndex"> = {
      type: "line",
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
      strokeColor: "#000",
      strokeWidth: 1,
    };
    const stack = sortByZIndex([
      { ...box, id: "rect", zIndex: 0 },
      { ...line, id: "line", zIndex: 1 },
    ] as MarkupObject[]);
    const { stack: grouped } = groupObjects(stack, new Set(["rect", "line"]));
    const rectZ = grouped.find((o) => o.id === "rect")!.zIndex;
    const lineZ = grouped.find((o) => o.id === "line")!.zIndex;
    expect(rectZ).toBeLessThan(lineZ);

    const next = bringForward(grouped, new Set(["rect"]));
    const rectAfter = next.find((o) => o.id === "rect")!.zIndex;
    const lineAfter = next.find((o) => o.id === "line")!.zIndex;
    expect(rectAfter).toBeGreaterThan(lineAfter);
  });

  it("sendBackward reorders within a group before moving the whole group", () => {
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
    const line: Omit<LineMarkup, "id" | "zIndex"> = {
      type: "line",
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
      strokeColor: "#000",
      strokeWidth: 1,
    };
    const stack = sortByZIndex([
      { ...box, id: "rect", zIndex: 0 },
      { ...line, id: "line", zIndex: 1 },
    ] as MarkupObject[]);
    const { stack: grouped } = groupObjects(stack, new Set(["rect", "line"]));
    const lineZ = grouped.find((o) => o.id === "line")!.zIndex;
    const rectZ = grouped.find((o) => o.id === "rect")!.zIndex;
    expect(rectZ).toBeLessThan(lineZ);

    const next = sendBackward(grouped, new Set(["line"]));
    const lineAfter = next.find((o) => o.id === "line")!.zIndex;
    const rectAfter = next.find((o) => o.id === "rect")!.zIndex;
    expect(lineAfter).toBeLessThan(rectAfter);
  });

  it("moveObjects moves only the selected grouped child", () => {
    const box: Omit<RectangleMarkup, "id" | "zIndex"> = {
      type: "rectangle",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      strokeColor: "#000",
      strokeWidth: 1,
      fillColor: "",
      fillEnabled: false,
    };
    const line: Omit<LineMarkup, "id" | "zIndex"> = {
      type: "line",
      x1: 20,
      y1: 20,
      x2: 30,
      y2: 30,
      strokeColor: "#000",
      strokeWidth: 1,
    };
    let stack = addObject([], box);
    stack = addObject(stack, line);
    const { stack: grouped } = groupObjects(stack, new Set([stack[0]!.id, stack[1]!.id]));
    const rectId = stack[0]!.id;

    const next = moveObjects(grouped, new Set([rectId]), 5, 10);
    const rect = next.find((o) => o.id === rectId)!;
    const lineObj = next.find((o) => o.id === stack[1]!.id)!;
    if (rect.type === "rectangle" && lineObj.type === "line") {
      expect(rect.x).toBe(5);
      expect(rect.y).toBe(10);
      expect(lineObj.x1).toBe(20);
      expect(lineObj.y1).toBe(20);
    }
  });

  it("removeObjects deletes entire group when group id selected", () => {
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
    let stack = addObject([], box);
    stack = addObject(stack, { ...box, type: "rectangle" });
    const { stack: grouped, groupId } = groupObjects(
      stack,
      new Set([stack[0]!.id, stack[1]!.id]),
    );
    const next = removeObjects(grouped, new Set([groupId!]));
    expect(next.filter((o) => o.type !== "group")).toHaveLength(0);
  });

  it("duplicateObjects duplicates a group with members", () => {
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
    let stack = addObject([], box);
    stack = addObject(stack, { ...box, type: "rectangle" });
    const { stack: grouped, groupId } = groupObjects(
      stack,
      new Set([stack[0]!.id, stack[1]!.id]),
    );
    const { stack: next, newIds } = duplicateObjects(grouped, new Set([groupId!]));
    expect(newIds).toHaveLength(3);
    expect(next.filter((o) => o.type === "group")).toHaveLength(2);
    expect(next.filter((o) => o.type === "rectangle")).toHaveLength(4);
    const newGroupId = next.find((o) => o.type === "group" && o.id !== groupId)!.id;
    expect(next.filter((o) => o.groupId === newGroupId)).toHaveLength(2);
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
