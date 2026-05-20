import type { MarkupObject } from "./types";

export function newMarkupId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

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
  return objects.filter((o) => !ids.has(o.id));
}

export function moveObjects(
  objects: MarkupObject[],
  ids: Set<string>,
  dx: number,
  dy: number,
): MarkupObject[] {
  return objects.map((o) => {
    if (!ids.has(o.id)) return o;
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
  const clones: Omit<MarkupObject, "id" | "zIndex">[] = [];
  for (const o of objects) {
    if (!ids.has(o.id)) continue;
    const moved = moveObjects([o], new Set([o.id]), offset, offset)[0];
    const { id, zIndex, ...rest } = moved;
    void id;
    void zIndex;
    clones.push(rest as Omit<MarkupObject, "id" | "zIndex">);
  }
  const stack = addObjects(objects, clones);
  const newIds = stack.slice(-clones.length).map((o) => o.id);
  return { stack, newIds };
}

function reindex(objects: MarkupObject[]): MarkupObject[] {
  return objects.map((o, i) => ({ ...o, zIndex: i }));
}

export function bringForward(objects: MarkupObject[], ids: Set<string>): MarkupObject[] {
  const sorted = sortByZIndex(objects);
  const next = [...sorted];
  for (let i = next.length - 2; i >= 0; i--) {
    if (ids.has(next[i].id) && !ids.has(next[i + 1].id)) {
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      break;
    }
  }
  return reindex(next);
}

export function sendBackward(objects: MarkupObject[], ids: Set<string>): MarkupObject[] {
  const sorted = sortByZIndex(objects);
  const next = [...sorted];
  for (let i = 1; i < next.length; i++) {
    if (ids.has(next[i].id) && !ids.has(next[i - 1].id)) {
      [next[i], next[i - 1]] = [next[i - 1], next[i]];
      break;
    }
  }
  return reindex(next);
}
