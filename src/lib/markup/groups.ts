import { sortByZIndex, syncMarkupZOrder } from "./document";
import { newMarkupId } from "./ids";
import { objectBounds, unionBounds, type Bounds } from "./bounds";
import type { GroupMarkup, MarkupObject } from "./types";
import { DEFAULT_STROKE, DEFAULT_STROKE_WIDTH } from "./types";

export function isGroup(o: MarkupObject): o is GroupMarkup {
  return o.type === "group";
}

export function groupMembers(objects: MarkupObject[], groupId: string): MarkupObject[] {
  return objects.filter((o) => o.type !== "group" && o.groupId === groupId);
}

/** Direct children of a group (nested subgroups and shape layers). */
export function directGroupChildren(objects: MarkupObject[], groupId: string): MarkupObject[] {
  return objects.filter((o) => o.groupId === groupId);
}

export function descendantLeafIds(objects: MarkupObject[], groupId: string): string[] {
  const ids: string[] = [];
  const walk = (gid: string) => {
    for (const child of directGroupChildren(objects, gid)) {
      if (child.type === "group") walk(child.id);
      else ids.push(child.id);
    }
  };
  walk(groupId);
  return ids;
}

export function descendantLeaves(objects: MarkupObject[], groupId: string): MarkupObject[] {
  return descendantLeafIds(objects, groupId)
    .map((id) => objects.find((o) => o.id === id))
    .filter((o): o is MarkupObject => !!o && o.type !== "group");
}

export function rootGroupId(objects: MarkupObject[], groupId: string): string {
  let current = groupId;
  while (true) {
    const group = objects.find((o) => o.id === current && o.type === "group");
    if (!group?.groupId) return current;
    current = group.groupId;
  }
}

export function groupBounds(objects: MarkupObject[], groupId: string): Bounds | null {
  const boxes = descendantLeaves(objects, groupId)
    .map(objectBounds)
    .filter((b): b is Bounds => b !== null);
  return unionBounds(boxes);
}

/** Top-level group rows or ungrouped shape ids selected for grouping. */
export function collectGroupUnits(objects: MarkupObject[], ids: Set<string>): Set<string> {
  const units = new Set<string>();
  for (const id of ids) {
    const o = objects.find((x) => x.id === id);
    if (!o) continue;
    if (o.type === "group") units.add(o.id);
    else if (!o.groupId) units.add(o.id);
  }
  return units;
}

/** Expand selection to whole group(s) when a group row/id is included. Direct child picks stay leaf-only. */
export function expandSelectionIds(objects: MarkupObject[], ids: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const id of ids) {
    const o = objects.find((x) => x.id === id);
    if (!o) continue;
    if (o.type === "group") {
      result.add(o.id);
      for (const child of directGroupChildren(objects, o.id)) {
        if (child.type === "group") result.add(child.id);
      }
      for (const leafId of descendantLeafIds(objects, o.id)) result.add(leafId);
    } else {
      result.add(o.id);
    }
  }
  return result;
}

export function leafSelectionIds(objects: MarkupObject[], ids: Set<string>): Set<string> {
  return new Set(
    [...expandSelectionIds(objects, ids)].filter((id) => {
      const o = objects.find((x) => x.id === id);
      return o && o.type !== "group";
    }),
  );
}

export function drawableObjects(objects: MarkupObject[]): MarkupObject[] {
  return sortByZIndex(objects.filter((o) => o.type !== "group"));
}

export function canGroup(objects: MarkupObject[], ids: Set<string>): boolean {
  const units = collectGroupUnits(objects, ids);
  if (units.size < 2) return false;
  for (const unitId of units) {
    const o = objects.find((x) => x.id === unitId);
    if (o?.groupId) return false;
  }
  return true;
}

export function canUngroup(objects: MarkupObject[], ids: Set<string>): boolean {
  return groupIdsInSelection(objects, ids).size > 0;
}

export function groupIdsInSelection(objects: MarkupObject[], ids: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const id of ids) {
    const o = objects.find((x) => x.id === id);
    if (!o) continue;
    if (o.type === "group") result.add(o.id);
    else if (o.groupId) result.add(o.groupId);
  }
  return result;
}

export function groupObjects(
  objects: MarkupObject[],
  ids: Set<string>,
): { stack: MarkupObject[]; groupId: string | null } {
  const units = collectGroupUnits(objects, ids);
  if (!canGroup(objects, ids)) return { stack: objects, groupId: null };

  const unitObjects = [...units]
    .map((id) => objects.find((o) => o.id === id))
    .filter((o): o is MarkupObject => !!o);
  const zIndex = Math.max(...unitObjects.map((m) => m.zIndex));
  const groupId = newMarkupId();
  const group: GroupMarkup = {
    type: "group",
    id: groupId,
    zIndex,
    name: "Group",
    strokeColor: DEFAULT_STROKE,
    strokeWidth: DEFAULT_STROKE_WIDTH,
  };
  const stack = objects
    .map((o) => (units.has(o.id) ? ({ ...o, groupId } as MarkupObject) : o))
    .concat(group);
  return { stack: syncMarkupZOrder(stack), groupId };
}

export function ungroupObjects(objects: MarkupObject[], ids: Set<string>): MarkupObject[] {
  const toUngroup = groupIdsInSelection(objects, ids);
  if (toUngroup.size === 0) return objects;

  return objects
    .filter((o) => !toUngroup.has(o.id))
    .map((o) => {
      if (o.type === "group" || !o.groupId || !toUngroup.has(o.groupId)) return o;
      const { groupId: _removed, ...rest } = o;
      void _removed;
      return rest as MarkupObject;
    });
}

export type LayerTreeNode =
  | { kind: "leaf"; object: MarkupObject }
  | { kind: "group"; group: GroupMarkup; children: MarkupObject[] };

/** Top-level layers (groups + ungrouped leaves) front-to-back for the panel. */
export function buildLayerTree(objects: MarkupObject[]): LayerTreeNode[] {
  const groups = objects.filter(isGroup).filter((g) => !g.groupId);
  const ungrouped = objects.filter((o) => o.type !== "group" && !o.groupId);
  const nodes: { z: number; node: LayerTreeNode }[] = [];

  for (const g of groups) {
    const children = sortByZIndex(directGroupChildren(objects, g.id)).reverse();
    nodes.push({ z: g.zIndex, node: { kind: "group", group: g, children } });
  }
  for (const o of ungrouped) {
    nodes.push({ z: o.zIndex, node: { kind: "leaf", object: o } });
  }
  return nodes.sort((a, b) => b.z - a.z).map((n) => n.node);
}

export function resolveHitTarget(objects: MarkupObject[], leafId: string): string {
  const o = objects.find((x) => x.id === leafId);
  if (o?.groupId) return o.groupId;
  return leafId;
}

/** Canvas click/drag selection: keep a lone child pick when dragging it; otherwise select the group. */
export function resolveCanvasSelection(
  objects: MarkupObject[],
  prev: Set<string>,
  leafId: string,
  shiftKey: boolean,
): Set<string> {
  const groupTarget = resolveHitTarget(objects, leafId);
  if (shiftKey) {
    const next = new Set(prev);
    if (next.has(groupTarget)) {
      next.delete(groupTarget);
      for (const id of expandSelectionIds(objects, new Set([groupTarget]))) next.delete(id);
    } else {
      next.add(groupTarget);
    }
    return next;
  }
  if (prev.size === 1 && prev.has(leafId)) return prev;
  const expanded = expandSelectionIds(objects, prev);
  if (expanded.has(leafId) || expanded.has(groupTarget)) return prev;
  return new Set([groupTarget]);
}

/** Collapse fully-selected groups to group ids for the selection set. */
export function selectionFromLeafHits(objects: MarkupObject[], leafIds: string[]): Set<string> {
  const hits = new Set(leafIds);
  const result = new Set<string>();
  const consumed = new Set<string>();

  for (const o of objects) {
    if (!isGroup(o)) continue;
    const leafIds = descendantLeafIds(objects, o.id);
    if (leafIds.length > 0 && leafIds.every((id) => hits.has(id))) {
      result.add(o.id);
      leafIds.forEach((id) => consumed.add(id));
    }
  }
  for (const id of leafIds) {
    if (!consumed.has(id)) {
      const o = objects.find((x) => x.id === id);
      result.add(o?.groupId ?? id);
    }
  }
  return result;
}
