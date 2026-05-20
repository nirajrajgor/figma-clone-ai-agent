import { describe, expect, it } from "vitest";
import { sortByZIndex } from "./document";
import {
  buildLayerTree,
  canGroup,
  canUngroup,
  expandSelectionIds,
  groupObjects,
  resolveCanvasSelection,
  ungroupObjects,
} from "./groups";
import type { LineMarkup, RectangleMarkup } from "./types";

function rect(id: string, z: number, groupId?: string): RectangleMarkup {
  return {
    type: "rectangle",
    id,
    zIndex: z,
    x: 10,
    y: 10,
    width: 40,
    height: 40,
    strokeColor: "#000",
    strokeWidth: 2,
    fillColor: "transparent",
    fillEnabled: false,
    groupId,
  };
}

function line(id: string, z: number, groupId?: string): LineMarkup {
  return {
    type: "line",
    id,
    zIndex: z,
    x1: 0,
    y1: 0,
    x2: 50,
    y2: 50,
    strokeColor: "#000",
    strokeWidth: 2,
    groupId,
  };
}

describe("groups", () => {
  it("groups two ungrouped shapes", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: next, groupId } = groupObjects(stack, new Set(["a", "b"]));
    expect(groupId).toBeTruthy();
    expect(next.find((o) => o.id === "a")?.groupId).toBe(groupId);
    expect(next.find((o) => o.id === "b")?.groupId).toBe(groupId);
    expect(next.some((o) => o.type === "group")).toBe(true);
  });

  it("ungroup removes group and clears child groupId", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: grouped, groupId } = groupObjects(stack, new Set(["a", "b"]));
    const ungrouped = ungroupObjects(grouped, new Set([groupId!]));
    expect(ungrouped.some((o) => o.type === "group")).toBe(false);
    expect(ungrouped.find((o) => o.id === "a")?.groupId).toBeUndefined();
  });

  it("expandSelectionIds includes all group members when group id is selected", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: grouped, groupId } = groupObjects(stack, new Set(["a", "b"]));
    const expanded = expandSelectionIds(grouped, new Set([groupId!]));
    expect(expanded.has("a")).toBe(true);
    expect(expanded.has("b")).toBe(true);
    expect(expanded.has(groupId!)).toBe(true);
  });

  it("expandSelectionIds keeps a single grouped child without sibling members", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: grouped } = groupObjects(stack, new Set(["a", "b"]));
    const expanded = expandSelectionIds(grouped, new Set(["a"]));
    expect(expanded.has("a")).toBe(true);
    expect(expanded.has("b")).toBe(false);
  });

  it("resolveCanvasSelection keeps child selected when dragging same leaf", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: grouped } = groupObjects(stack, new Set(["a", "b"]));
    const next = resolveCanvasSelection(grouped, new Set(["a"]), "a", false);
    expect(next).toEqual(new Set(["a"]));
  });

  it("canGroup requires two ungrouped leaves", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    expect(canGroup(stack, new Set(["a", "b"]))).toBe(true);
    expect(canGroup(stack, new Set(["a"]))).toBe(false);
  });

  it("canUngroup when a grouped child is selected", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: grouped } = groupObjects(stack, new Set(["a", "b"]));
    expect(canUngroup(grouped, new Set(["a"]))).toBe(true);
  });

  it("canGroup is false for already-grouped members", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: grouped } = groupObjects(stack, new Set(["a", "b"]));
    expect(canGroup(grouped, new Set(["a", "b"]))).toBe(false);
  });

  it("resolveCanvasSelection picks group on new canvas click", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: grouped } = groupObjects(stack, new Set(["a", "b"]));
    const next = resolveCanvasSelection(grouped, new Set(), "b", false);
    expect(next).toEqual(new Set([grouped.find((o) => o.type === "group")!.id]));
  });

  it("buildLayerTree nests group children", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: grouped } = groupObjects(stack, new Set(["a", "b"]));
    const tree = buildLayerTree(grouped);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.kind).toBe("group");
    if (tree[0]?.kind === "group") {
      expect(tree[0].children).toHaveLength(2);
    }
  });

  it("groups two top-level groups into a nested parent", () => {
    let stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: g1, groupId: group1 } = groupObjects(stack, new Set(["a", "b"]));
    stack = sortByZIndex([...g1, rect("c", 2), line("d", 3)]);
    const { stack: g2, groupId: group2 } = groupObjects(stack, new Set(["c", "d"]));
    const { stack: nested, groupId: parentId } = groupObjects(g2, new Set([group1!, group2!]));
    expect(parentId).toBeTruthy();
    expect(nested.find((o) => o.id === group1!)?.groupId).toBe(parentId);
    expect(nested.find((o) => o.id === group2!)?.groupId).toBe(parentId);
    expect(nested.filter((o) => o.type === "group" && !o.groupId)).toHaveLength(1);
  });

  it("canGroup allows selecting two top-level group rows", () => {
    let stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: g1, groupId: group1 } = groupObjects(stack, new Set(["a", "b"]));
    stack = sortByZIndex([...g1, rect("c", 2), line("d", 3)]);
    const { stack: g2, groupId: group2 } = groupObjects(stack, new Set(["c", "d"]));
    expect(canGroup(g2, new Set([group1!, group2!]))).toBe(true);
  });
});
