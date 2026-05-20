import {
  descendantLeafIds,
  descendantLeaves,
  expandSelectionIds,
  groupIdsInSelection,
  isGroup,
  leafSelectionIds,
  rootGroupId,
} from "./groups";
import { newMarkupId } from "./ids";
import type { MarkupObject } from "./types";

export { newMarkupId } from "./ids";

export function sortByZIndex(objects: MarkupObject[]): MarkupObject[] {
  return [...objects].sort((a, b) => a.zIndex - b.zIndex);
}

function nextZIndex(objects: MarkupObject[]): number {
  if (objects.length === 0) return 0;
  return Math.max(...objects.map((o) => o.zIndex)) + 1;
}

export function addObject(
  objects: MarkupObject[],
  object: Omit<MarkupObject, "id" | "zIndex"> & { id?: string; zIndex?: number },
): MarkupObject[] {
  const item = {
    ...object,
    id: object.id ?? newMarkupId(),
    zIndex: object.zIndex ?? nextZIndex(objects),
  } as MarkupObject;
  return [...objects, item];
}

export function addObjects(
  objects: MarkupObject[],
  items: Omit<MarkupObject, "id" | "zIndex">[],
): MarkupObject[] {
  let stack = objects;
  for (const item of items) {
    stack = addObject(stack, item);
  }
  return stack;
}

export function updateObject(
  objects: MarkupObject[],
  id: string,
  patch: Partial<MarkupObject>,
): MarkupObject[] {
  return objects.map((o) => (o.id === id ? ({ ...o, ...patch, id: o.id } as MarkupObject) : o));
}

export function updateObjects(
  objects: MarkupObject[],
  ids: Set<string>,
  patch: Partial<MarkupObject>,
  predicate?: (o: MarkupObject) => boolean,
): MarkupObject[] {
  return objects.map((o) => {
    if (!ids.has(o.id)) return o;
    if (predicate && !predicate(o)) return o;
    return { ...o, ...patch, id: o.id, type: o.type } as MarkupObject;
  });
}

export function removeObjects(objects: MarkupObject[], ids: Set<string>): MarkupObject[] {
  const expanded = expandSelectionIds(objects, ids);
  const drop = new Set(expanded);
  for (const id of expanded) {
    if (isGroup(objects.find((o) => o.id === id)!)) {
      for (const leafId of descendantLeafIds(objects, id)) drop.add(leafId);
      const walkGroups = (gid: string) => {
        drop.add(gid);
        for (const child of objects) {
          if (child.type === "group" && child.groupId === gid) walkGroups(child.id);
        }
      };
      walkGroups(id);
    }
  }
  return objects.filter((o) => !drop.has(o.id));
}

export function moveObjects(
  objects: MarkupObject[],
  ids: Set<string>,
  dx: number,
  dy: number,
): MarkupObject[] {
  const leaves = leafSelectionIds(objects, ids);
  return objects.map((o) => {
    if (!leaves.has(o.id)) return o;
    switch (o.type) {
      case "rectangle":
      case "ellipse":
      case "redact":
        return { ...o, x: o.x + dx, y: o.y + dy };
      case "arrow":
      case "line":
        return {
          ...o,
          x1: o.x1 + dx,
          y1: o.y1 + dy,
          x2: o.x2 + dx,
          y2: o.y2 + dy,
        };
      case "freehand":
        return {
          ...o,
          points: o.points.map(([x, y]) => [x + dx, y + dy] as [number, number]),
        };
      case "text":
        return { ...o, x: o.x + dx, y: o.y + dy };
      case "group":
        return o;
      default:
        return o;
    }
  });
}

export function duplicateObjects(
  objects: MarkupObject[],
  ids: Set<string>,
  offset = 12,
): { stack: MarkupObject[]; newIds: string[] } {
  const expanded = expandSelectionIds(objects, ids);
  const groupIds = groupIdsInSelection(objects, expanded);
  const newIds: string[] = [];
  let stack = objects;

  for (const gid of groupIds) {
    const members = descendantLeaves(stack, gid);
    const idMap = new Map<string, string>();
    for (const m of members) idMap.set(m.id, newMarkupId());

    const newGroupId = newMarkupId();
    const group = stack.find((o) => o.id === gid);
    if (!group || !isGroup(group)) continue;

    const cloneMembers: MarkupObject[] = members.map((m) => {
      const moved = moveObjects([m], new Set([m.id]), offset, offset)[0];
      const { id, zIndex, groupId: _g, ...rest } = moved;
      void id;
      void zIndex;
      void _g;
      const newId = idMap.get(m.id)!;
      newIds.push(newId);
      return {
        ...rest,
        id: newId,
        zIndex: m.zIndex,
        groupId: newGroupId,
      } as MarkupObject;
    });

    const { id, zIndex, ...groupRest } = group;
    void id;
    void zIndex;
    const newGroup: MarkupObject = {
      ...groupRest,
      id: newGroupId,
      zIndex: group.zIndex,
    } as MarkupObject;
    newIds.push(newGroupId);

    stack = [...stack, ...cloneMembers, newGroup];
  }

  const groupedLeaves = new Set<string>();
  for (const gid of groupIds) {
    for (const id of descendantLeafIds(objects, gid)) groupedLeaves.add(id);
  }

  for (const id of leafSelectionIds(objects, expanded)) {
    if (groupedLeaves.has(id)) continue;
    const o = objects.find((x) => x.id === id);
    if (!o || o.groupId) continue;
    const moved = moveObjects([o], new Set([o.id]), offset, offset)[0];
    const { id: _id, zIndex, ...rest } = moved;
    void _id;
    void zIndex;
    const added = addObject(stack, rest as Omit<MarkupObject, "id" | "zIndex">);
    const newId = added[added.length - 1]!.id;
    newIds.push(newId);
    stack = added;
  }

  return { stack, newIds };
}

type LayerUnit = { ids: string[] };

function drawableStack(objects: MarkupObject[]): MarkupObject[] {
  return sortByZIndex(objects.filter((o) => o.type !== "group"));
}

/** Layer units in bottom-to-top paint order (matches canvas rendering). */
function buildLayerUnits(objects: MarkupObject[]): LayerUnit[] {
  const units: LayerUnit[] = [];
  const groupUnits = new Map<string, LayerUnit>();

  for (const o of drawableStack(objects)) {
    if (o.groupId) {
      const root = rootGroupId(objects, o.groupId);
      let unit = groupUnits.get(root);
      if (!unit) {
        unit = { ids: [] };
        groupUnits.set(root, unit);
        units.push(unit);
      }
      unit.ids.push(o.id);
    } else {
      units.push({ ids: [o.id] });
    }
  }
  return units;
}

function unitMatchesSelection(
  unit: LayerUnit,
  objects: MarkupObject[],
  ids: Set<string>,
): boolean {
  const leaves = leafSelectionIds(objects, ids);
  return unit.ids.some((id) => leaves.has(id) || ids.has(id));
}

/** Assign unique global zIndex in paint order; sync group rows to top member z. */
function applyLayerUnits(objects: MarkupObject[], units: LayerUnit[]): MarkupObject[] {
  const zById = new Map<string, number>();
  let z = 0;
  for (const unit of units) {
    for (const id of unit.ids) {
      zById.set(id, z++);
    }
  }
  let stack = objects.map((o) => {
    const nextZ = zById.get(o.id);
    return nextZ !== undefined ? ({ ...o, zIndex: nextZ } as MarkupObject) : o;
  });
  for (const o of stack) {
    if (!isGroup(o)) continue;
    const leaves = descendantLeafIds(stack, o.id)
      .map((id) => stack.find((x) => x.id === id))
      .filter((m): m is MarkupObject => !!m);
    if (leaves.length === 0) continue;
    const maxZ = Math.max(...leaves.map((m) => m.zIndex));
    stack = updateObject(stack, o.id, { zIndex: maxZ });
  }
  return stack;
}

function tryReorderWithinUnit(
  objects: MarkupObject[],
  units: LayerUnit[],
  ids: Set<string>,
  direction: "forward" | "backward",
): MarkupObject[] | null {
  const leaves = leafSelectionIds(objects, ids);
  for (let u = 0; u < units.length; u++) {
    const unit = units[u]!;
    if (unit.ids.length < 2) continue;
    const picked = unit.ids.filter((id) => leaves.has(id) || ids.has(id));
    if (picked.length !== 1) continue;
    const idx = unit.ids.indexOf(picked[0]!);
    if (idx < 0) continue;
    if (direction === "forward" && idx < unit.ids.length - 1) {
      const next = units.map((x) => ({ ids: [...x.ids] }));
      [next[u]!.ids[idx], next[u]!.ids[idx + 1]] = [next[u]!.ids[idx + 1]!, next[u]!.ids[idx]!];
      return applyLayerUnits(objects, next);
    }
    if (direction === "backward" && idx > 0) {
      const next = units.map((x) => ({ ids: [...x.ids] }));
      [next[u]!.ids[idx], next[u]!.ids[idx - 1]] = [next[u]!.ids[idx - 1]!, next[u]!.ids[idx]!];
      return applyLayerUnits(objects, next);
    }
  }
  return null;
}

export function bringForward(objects: MarkupObject[], ids: Set<string>): MarkupObject[] {
  const units = buildLayerUnits(objects);
  if (units.length < 2 && !units.some((u) => u.ids.length > 1)) return objects;

  const within = tryReorderWithinUnit(objects, units, ids, "forward");
  if (within) return within;

  let moveIndex = -1;
  for (let i = 0; i < units.length; i++) {
    if (unitMatchesSelection(units[i], objects, ids)) moveIndex = i;
  }
  if (moveIndex < 0 || moveIndex >= units.length - 1) return objects;

  const next = units.map((u) => ({ ids: [...u.ids] }));
  [next[moveIndex], next[moveIndex + 1]] = [next[moveIndex + 1]!, next[moveIndex]!];
  return applyLayerUnits(objects, next);
}

export function sendBackward(objects: MarkupObject[], ids: Set<string>): MarkupObject[] {
  const units = buildLayerUnits(objects);
  if (units.length < 2 && !units.some((u) => u.ids.length > 1)) return objects;

  const within = tryReorderWithinUnit(objects, units, ids, "backward");
  if (within) return within;

  let moveIndex = -1;
  for (let i = 0; i < units.length; i++) {
    if (unitMatchesSelection(units[i], objects, ids)) moveIndex = i;
  }
  if (moveIndex <= 0) return objects;

  const next = units.map((u) => ({ ids: [...u.ids] }));
  [next[moveIndex], next[moveIndex - 1]] = [next[moveIndex - 1]!, next[moveIndex]!];
  return applyLayerUnits(objects, next);
}

/** Reassign zIndex to match current canvas paint order (unique, consecutive). */
export function syncMarkupZOrder(objects: MarkupObject[]): MarkupObject[] {
  return applyLayerUnits(objects, buildLayerUnits(objects));
}
