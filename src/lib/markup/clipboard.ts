import { addObject, moveObjects } from "./document";
import { expandSelectionIds, isGroup } from "./groups";
import { newMarkupId } from "./ids";
import type { MarkupObject } from "./types";

export type MarkupClipboardItem = {
  /** Stable key from the source object id (for remapping group membership). */
  clipKey: string;
  /** Source group id when this item belongs to a copied group. */
  clipGroupKey?: string;
  data: Omit<MarkupObject, "id" | "zIndex">;
};

export type MarkupClipboard = {
  items: MarkupClipboardItem[];
};

function stripIdentity(o: MarkupObject): Omit<MarkupObject, "id" | "zIndex"> {
  const { id, zIndex, ...rest } = o;
  void id;
  void zIndex;
  return rest as Omit<MarkupObject, "id" | "zIndex">;
}

/** Snapshot selection (including groups) for in-session paste. */
export function copyToClipboard(objects: MarkupObject[], ids: Set<string>): MarkupClipboard {
  const expanded = expandSelectionIds(objects, ids);
  const items: MarkupClipboardItem[] = [];

  for (const o of objects) {
    if (!expanded.has(o.id)) continue;
    if (o.type === "group") {
      items.push({ clipKey: o.id, data: stripIdentity(o) });
      continue;
    }
    const clipGroupKey =
      o.groupId && expanded.has(o.groupId) ? o.groupId : undefined;
    const { groupId: _g, ...rest } = stripIdentity(o) as Omit<MarkupObject, "id" | "zIndex"> & {
      groupId?: string;
    };
    void _g;
    items.push({
      clipKey: o.id,
      clipGroupKey,
      data: rest as Omit<MarkupObject, "id" | "zIndex">,
    });
  }

  return { items };
}

function offsetMarkupData(
  data: Omit<MarkupObject, "id" | "zIndex">,
  dx: number,
  dy: number,
): Omit<MarkupObject, "id" | "zIndex"> {
  const temp = { ...data, id: "__paste__", zIndex: 0 } as MarkupObject;
  const [next] = moveObjects([temp], new Set(["__paste__"]), dx, dy);
  const { id, zIndex, ...rest } = next!;
  void id;
  void zIndex;
  return rest as Omit<MarkupObject, "id" | "zIndex">;
}

export function pasteFromClipboard(
  objects: MarkupObject[],
  clipboard: MarkupClipboard,
  offset = 12,
): { stack: MarkupObject[]; newIds: string[] } {
  if (clipboard.items.length === 0) {
    return { stack: objects, newIds: [] };
  }

  const idMap = new Map<string, string>();
  for (const item of clipboard.items) {
    idMap.set(item.clipKey, newMarkupId());
  }

  let stack = objects;
  const newIds: string[] = [];

  for (const item of clipboard.items) {
    if (item.data.type !== "group") continue;
    const newId = idMap.get(item.clipKey)!;
    stack = addObject(stack, { ...item.data, id: newId } as Omit<MarkupObject, "zIndex">);
    newIds.push(newId);
  }

  for (const item of clipboard.items) {
    if (item.data.type === "group") continue;
    const newGroupId = item.clipGroupKey ? idMap.get(item.clipGroupKey) : undefined;
    const offsetData = offsetMarkupData(item.data, offset, offset);
    stack = addObject(stack, {
      ...offsetData,
      ...(newGroupId ? { groupId: newGroupId } : {}),
    });
    const newId = stack[stack.length - 1]!.id;
    if (newGroupId) {
      if (!newIds.includes(newGroupId)) newIds.push(newGroupId);
    } else {
      newIds.push(newId);
    }
  }

  return { stack, newIds: [...new Set(newIds)] };
}

/** Whether clipboard contains at least one group layer. */
export function clipboardHasGroups(clipboard: MarkupClipboard): boolean {
  return clipboard.items.some((i) => i.data.type === "group");
}

/** Member count for a group key inside a clipboard snapshot. */
export function clipboardGroupMembers(clipboard: MarkupClipboard, groupKey: string): number {
  return clipboard.items.filter((i) => i.clipGroupKey === groupKey).length;
}
