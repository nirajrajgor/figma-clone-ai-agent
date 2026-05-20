import { describe, expect, it } from "vitest";
import { sortByZIndex } from "./document";
import {
  clipboardGroupMembers,
  clipboardHasGroups,
  copyToClipboard,
  pasteFromClipboard,
} from "./clipboard";
import { groupObjects } from "./groups";
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

describe("markup clipboard", () => {
  it("copy and paste preserves group structure", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: grouped, groupId } = groupObjects(stack, new Set(["a", "b"]));
    expect(groupId).toBeTruthy();

    const clip = copyToClipboard(grouped, new Set([groupId!]));
    expect(clipboardHasGroups(clip)).toBe(true);
    expect(clipboardGroupMembers(clip, groupId!)).toBe(2);

    const { stack: pasted, newIds } = pasteFromClipboard(grouped, clip);
    expect(newIds).toHaveLength(1);
    const newGroupId = newIds[0]!;
    expect(pasted.some((o) => o.type === "group" && o.id === newGroupId)).toBe(true);
    expect(pasted.filter((o) => o.groupId === newGroupId)).toHaveLength(2);
  });

  it("paste offsets grouped members", () => {
    const stack = sortByZIndex([rect("a", 0), line("b", 1)]);
    const { stack: grouped, groupId } = groupObjects(stack, new Set(["a", "b"]));
    const clip = copyToClipboard(grouped, new Set([groupId!]));
    const { stack: pasted } = pasteFromClipboard(grouped, clip);
    const newGroupId = pasted.find((o) => o.type === "group" && o.id !== groupId)!.id;
    const originalIds = new Set(grouped.map((o) => o.id));
    const member = pasted.find(
      (o) => o.groupId === newGroupId && !originalIds.has(o.id),
    )!;
    const original = grouped.find((o) => o.type === "rectangle")!;
    if (member.type === "rectangle" && original.type === "rectangle") {
      expect(member.x).toBe(original.x + 12);
      expect(member.y).toBe(original.y + 12);
    }
  });
});
