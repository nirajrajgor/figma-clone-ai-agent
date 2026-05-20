import type { MarkupObject } from "./types";

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function hitEllipse(x: number, y: number, o: { x: number; y: number; width: number; height: number }) {
  if (o.width <= 0 || o.height <= 0) return false;
  const cx = o.x + o.width / 2;
  const cy = o.y + o.height / 2;
  const rx = o.width / 2;
  const ry = o.height / 2;
  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  return nx * nx + ny * ny <= 1;
}

export function hitTest(objects: MarkupObject[], x: number, y: number): string | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    if (hitObject(o, x, y)) return o.id;
  }
  return null;
}

function hitObject(o: MarkupObject, x: number, y: number): boolean {
  const pad = Math.max(8, o.strokeWidth * 2);
  switch (o.type) {
    case "rectangle":
    case "redact":
      return (
        x >= o.x - pad &&
        x <= o.x + o.width + pad &&
        y >= o.y - pad &&
        y <= o.y + o.height + pad
      );
    case "ellipse":
      return hitEllipse(x, y, o) || hitEllipse(x, y, {
        x: o.x - pad,
        y: o.y - pad,
        width: o.width + pad * 2,
        height: o.height + pad * 2,
      });
    case "arrow":
    case "line":
      return distToSegment(x, y, o.x1, o.y1, o.x2, o.y2) <= pad;
    case "freehand": {
      for (let i = 1; i < o.points.length; i++) {
        const [x1, y1] = o.points[i - 1];
        const [x2, y2] = o.points[i];
        if (distToSegment(x, y, x1, y1, x2, y2) <= pad) return true;
      }
      return false;
    }
    case "text": {
      const w = Math.max(40, o.content.length * o.fontSize * 0.55);
      const h = o.fontSize * 1.4;
      return x >= o.x - pad && x <= o.x + w + pad && y >= o.y - pad && y <= o.y + h + pad;
    }
    default:
      return false;
  }
}

export function objectsInRect(
  objects: MarkupObject[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string[] {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return objects
    .filter((o) => {
      for (let x = minX; x <= maxX; x += (maxX - minX) / 4 || 1) {
        for (let y = minY; y <= maxY; y += (maxY - minY) / 4 || 1) {
          if (hitObject(o, x, y)) return true;
        }
      }
      return hitObject(o, (minX + maxX) / 2, (minY + maxY) / 2);
    })
    .map((o) => o.id);
}
