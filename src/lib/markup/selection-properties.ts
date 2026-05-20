import type { MarkupObject } from "./types";

export function objectsForSelection(objects: MarkupObject[], ids: Set<string>): MarkupObject[] {
  return objects.filter((o) => ids.has(o.id));
}

export function commonProperty<T>(
  objs: MarkupObject[],
  get: (o: MarkupObject) => T | undefined,
): T | undefined {
  if (objs.length === 0) return undefined;
  let common: T | undefined;
  for (const o of objs) {
    const value = get(o);
    if (value === undefined) continue;
    if (common === undefined) common = value;
    else if (common !== value) return undefined;
  }
  return common;
}

export function hasStrokeCapable(objs: MarkupObject[]): boolean {
  return objs.some((o) => o.type !== "text" && o.type !== "redact");
}

export function hasFillShape(objs: MarkupObject[]): boolean {
  return objs.some((o) => o.type === "rectangle" || o.type === "ellipse");
}

export function hasRedact(objs: MarkupObject[]): boolean {
  return objs.some((o) => o.type === "redact");
}

export function isTextOnlySelection(objs: MarkupObject[]): boolean {
  return objs.length > 0 && objs.every((o) => o.type === "text");
}

export function strokeCapable(o: MarkupObject): boolean {
  return o.type !== "text" && o.type !== "redact";
}

export function fillShape(o: MarkupObject): boolean {
  return o.type === "rectangle" || o.type === "ellipse";
}

export function redactShape(o: MarkupObject): boolean {
  return o.type === "redact";
}

export function toHexForColorInput(color: string, fallback = "#ef4444"): string {
  if (color.startsWith("#")) return color.length >= 7 ? color.slice(0, 7) : fallback;
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return fallback;
  const hex = (n: string) => Number(n).toString(16).padStart(2, "0");
  return `#${hex(match[1])}${hex(match[2])}${hex(match[3])}`;
}

export function fillColorFromObject(o: MarkupObject): string | undefined {
  if (o.type === "rectangle" || o.type === "ellipse" || o.type === "redact") return o.fillColor;
  return undefined;
}
