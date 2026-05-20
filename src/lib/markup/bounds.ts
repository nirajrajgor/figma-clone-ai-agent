import type { MarkupObject, TextMarkup } from "./types";

export type Bounds = { x: number; y: number; width: number; height: number };

export type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "start"
  | "end";

export type HandlePoint = { id: ResizeHandle; x: number; y: number };

/** Screen-space hit radius for artboard frame handles (larger than markup handles). */
export const ARTBOARD_HANDLE_HIT_RADIUS = 12;

export function cursorForHandle(handle: ResizeHandle): string {
  switch (handle) {
    case "nw":
    case "se":
      return "nwse-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    default:
      return "default";
  }
}

export function textBounds(o: TextMarkup): Bounds {
  const w = Math.max(40, o.content.length * o.fontSize * 0.55);
  const h = o.fontSize * 1.4;
  return { x: o.x, y: o.y, width: w, height: h };
}

export function objectBounds(o: MarkupObject): Bounds | null {
  switch (o.type) {
    case "rectangle":
    case "ellipse":
    case "redact":
      return { x: o.x, y: o.y, width: o.width, height: o.height };
    case "arrow":
    case "line": {
      const x = Math.min(o.x1, o.x2);
      const y = Math.min(o.y1, o.y2);
      return {
        x,
        y,
        width: Math.max(Math.abs(o.x2 - o.x1), 1),
        height: Math.max(Math.abs(o.y2 - o.y1), 1),
      };
    }
    case "freehand": {
      if (o.points.length === 0) return null;
      const xs = o.points.map(([x]) => x);
      const ys = o.points.map(([, y]) => y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      return {
        x: minX,
        y: minY,
        width: Math.max(Math.max(...xs) - minX, 1),
        height: Math.max(Math.max(...ys) - minY, 1),
      };
    }
    case "text":
      return textBounds(o);
    default:
      return null;
  }
}

export function unionBounds(items: Bounds[]): Bounds | null {
  if (items.length === 0) return null;
  const x = Math.min(...items.map((b) => b.x));
  const y = Math.min(...items.map((b) => b.y));
  const maxX = Math.max(...items.map((b) => b.x + b.width));
  const maxY = Math.max(...items.map((b) => b.y + b.height));
  return { x, y, width: maxX - x, height: maxY - y };
}

export function selectionBounds(objects: MarkupObject[], ids: Set<string>): Bounds | null {
  const bounds = objects
    .filter((o) => ids.has(o.id))
    .map(objectBounds)
    .filter((b): b is Bounds => b !== null);
  return unionBounds(bounds);
}

export function boxHandles(bounds: Bounds): HandlePoint[] {
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const right = x + width;
  const bottom = y + height;
  return [
    { id: "nw", x, y },
    { id: "n", x: cx, y },
    { id: "ne", x: right, y },
    { id: "e", x: right, y: cy },
    { id: "se", x: right, y: bottom },
    { id: "s", x: cx, y: bottom },
    { id: "sw", x, y: bottom },
    { id: "w", x, y: cy },
  ];
}

export function selectionHandles(objects: MarkupObject[], ids: Set<string>): HandlePoint[] {
  if (ids.size !== 1) return [];
  const o = objects.find((item) => ids.has(item.id));
  if (!o) return [];
  if (o.type === "arrow" || o.type === "line") {
    return [
      { id: "start", x: o.x1, y: o.y1 },
      { id: "end", x: o.x2, y: o.y2 },
    ];
  }
  const bounds = objectBounds(o);
  return bounds ? boxHandles(bounds) : [];
}

export function hitSelectionHandle(
  x: number,
  y: number,
  objects: MarkupObject[],
  ids: Set<string>,
  scale: number,
): ResizeHandle | null {
  const radius = 8 / scale;
  let best: { id: ResizeHandle; dist: number } | null = null;
  for (const handle of selectionHandles(objects, ids)) {
    const dist = Math.hypot(x - handle.x, y - handle.y);
    if (dist <= radius && (!best || dist < best.dist)) {
      best = { id: handle.id, dist };
    }
  }
  return best?.id ?? null;
}

export function hitBoxHandle(
  x: number,
  y: number,
  bounds: Bounds,
  scale: number,
  hitRadius = 8,
): ResizeHandle | null {
  const radius = hitRadius / scale;
  let best: { id: ResizeHandle; dist: number } | null = null;
  for (const handle of boxHandles(bounds)) {
    const dist = Math.hypot(x - handle.x, y - handle.y);
    if (dist <= radius && (!best || dist < best.dist)) {
      best = { id: handle.id, dist };
    }
  }
  return best?.id ?? null;
}
