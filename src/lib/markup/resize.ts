import type { Bounds, ResizeHandle } from "./bounds";
import { objectBounds } from "./bounds";
import { descendantLeaves } from "./groups";
import { updateObject } from "./document";
import type {
  EllipseMarkup,
  FreehandMarkup,
  MarkupObject,
  RectangleMarkup,
  RedactMarkup,
  TextMarkup,
} from "./types";

const MIN_SIZE = 4;

function resizeBounds(bounds: Bounds, handle: ResizeHandle, pt: { x: number; y: number }): Bounds {
  let { x, y, width, height } = bounds;
  const right = x + width;
  const bottom = y + height;

  switch (handle) {
    case "se":
      width = Math.max(MIN_SIZE, pt.x - x);
      height = Math.max(MIN_SIZE, pt.y - y);
      break;
    case "sw":
      width = Math.max(MIN_SIZE, right - pt.x);
      height = Math.max(MIN_SIZE, pt.y - y);
      x = right - width;
      break;
    case "ne":
      width = Math.max(MIN_SIZE, pt.x - x);
      height = Math.max(MIN_SIZE, bottom - pt.y);
      y = bottom - height;
      break;
    case "nw":
      width = Math.max(MIN_SIZE, right - pt.x);
      height = Math.max(MIN_SIZE, bottom - pt.y);
      x = right - width;
      y = bottom - height;
      break;
    case "e":
      width = Math.max(MIN_SIZE, pt.x - x);
      break;
    case "w":
      width = Math.max(MIN_SIZE, right - pt.x);
      x = right - width;
      break;
    case "s":
      height = Math.max(MIN_SIZE, pt.y - y);
      break;
    case "n":
      height = Math.max(MIN_SIZE, bottom - pt.y);
      y = bottom - height;
      break;
    default:
      break;
  }

  return { x, y, width, height };
}

function resizeBoxObject<T extends RectangleMarkup | EllipseMarkup | RedactMarkup>(
  o: T,
  handle: ResizeHandle,
  startBounds: Bounds,
  pt: { x: number; y: number },
): T {
  return { ...o, ...resizeBounds(startBounds, handle, pt) };
}

function resizeFreehand(o: FreehandMarkup, startBounds: Bounds, nextBounds: Bounds): FreehandMarkup {
  const sx = startBounds.width ? nextBounds.width / startBounds.width : 1;
  const sy = startBounds.height ? nextBounds.height / startBounds.height : 1;
  return {
    ...o,
    points: o.points.map(
      ([px, py]) =>
        [
          nextBounds.x + (px - startBounds.x) * sx,
          nextBounds.y + (py - startBounds.y) * sy,
        ] as [number, number],
    ),
  };
}

function resizeText(o: TextMarkup, startBounds: Bounds, nextBounds: Bounds): TextMarkup {
  const ratio = startBounds.height ? nextBounds.height / startBounds.height : 1;
  return {
    ...o,
    x: nextBounds.x,
    y: nextBounds.y,
    fontSize: Math.max(8, Math.round(o.fontSize * ratio)),
  };
}

function resizeObject(
  o: MarkupObject,
  handle: ResizeHandle,
  startBounds: Bounds,
  pt: { x: number; y: number },
): MarkupObject {
  if (handle === "start" || handle === "end") {
    if (o.type === "arrow" || o.type === "line") {
      return handle === "start" ? { ...o, x1: pt.x, y1: pt.y } : { ...o, x2: pt.x, y2: pt.y };
    }
    return o;
  }

  const nextBounds = resizeBounds(startBounds, handle, pt);

  switch (o.type) {
    case "rectangle":
    case "ellipse":
    case "redact":
      return resizeBoxObject(o, handle, startBounds, pt);
    case "freehand":
      return resizeFreehand(o, startBounds, nextBounds);
    case "text":
      return resizeText(o, startBounds, nextBounds);
    default:
      return o;
  }
}

function scaleMemberInBounds(o: MarkupObject, start: Bounds, next: Bounds): MarkupObject {
  const sx = start.width ? next.width / start.width : 1;
  const sy = start.height ? next.height / start.height : 1;
  const mapX = (x: number) => next.x + (x - start.x) * sx;
  const mapY = (y: number) => next.y + (y - start.y) * sy;

  switch (o.type) {
    case "rectangle":
    case "ellipse":
    case "redact":
      return {
        ...o,
        x: mapX(o.x),
        y: mapY(o.y),
        width: Math.max(MIN_SIZE, o.width * sx),
        height: Math.max(MIN_SIZE, o.height * sy),
      };
    case "arrow":
    case "line":
      return { ...o, x1: mapX(o.x1), y1: mapY(o.y1), x2: mapX(o.x2), y2: mapY(o.y2) };
    case "freehand":
      return {
        ...o,
        points: o.points.map(([px, py]) => [mapX(px), mapY(py)] as [number, number]),
      };
    case "text": {
      const ratio = start.height ? next.height / start.height : 1;
      return {
        ...o,
        x: mapX(o.x),
        y: mapY(o.y),
        fontSize: Math.max(8, Math.round(o.fontSize * ratio)),
      };
    }
    default:
      return o;
  }
}

function applyGroupResize(
  objects: MarkupObject[],
  groupId: string,
  handle: ResizeHandle,
  startBounds: Bounds,
  pt: { x: number; y: number },
): MarkupObject[] {
  const nextBounds = resizeBounds(startBounds, handle, pt);
  let stack = objects;
  for (const m of descendantLeaves(objects, groupId)) {
    stack = updateObject(stack, m.id, scaleMemberInBounds(m, startBounds, nextBounds));
  }
  return stack;
}

export function applyResize(
  objects: MarkupObject[],
  ids: Set<string>,
  handle: ResizeHandle,
  startBounds: Bounds,
  pt: { x: number; y: number },
): MarkupObject[] {
  if (ids.size !== 1) return objects;
  const id = [...ids][0];
  const o = objects.find((item) => item.id === id);
  if (!o) return objects;
  if (o.type === "group") {
    return applyGroupResize(objects, id, handle, startBounds, pt);
  }
  const bounds = objectBounds(o) ?? startBounds;
  const resized = resizeObject(o, handle, bounds, pt);
  return updateObject(objects, id, resized);
}
