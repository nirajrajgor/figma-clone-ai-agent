export type MarkupTool =
  | "select"
  | "frame"
  | "rectangle"
  | "ellipse"
  | "arrow"
  | "line"
  | "freehand"
  | "text"
  | "redact";

type TextAlignment = "left" | "center" | "right";

type MarkupObjectBase = {
  id: string;
  zIndex: number;
  strokeColor: string;
  strokeWidth: number;
  /** Parent group id when nested under a Group layer. */
  groupId?: string;
};

export type GroupMarkup = MarkupObjectBase & {
  type: "group";
  name: string;
};

export type RectangleMarkup = MarkupObjectBase & {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  fillEnabled: boolean;
};

export type EllipseMarkup = MarkupObjectBase & {
  type: "ellipse";
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  fillEnabled: boolean;
};

export type RedactMarkup = MarkupObjectBase & {
  type: "redact";
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
};

export type ArrowMarkup = MarkupObjectBase & {
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type LineMarkup = MarkupObjectBase & {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type FreehandMarkup = MarkupObjectBase & {
  type: "freehand";
  points: [number, number][];
};

export type TextMarkup = MarkupObjectBase & {
  type: "text";
  x: number;
  y: number;
  content: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  backgroundEnabled: boolean;
  alignment: TextAlignment;
};

export type MarkupObject =
  | GroupMarkup
  | RectangleMarkup
  | EllipseMarkup
  | RedactMarkup
  | ArrowMarkup
  | LineMarkup
  | FreehandMarkup
  | TextMarkup;

export const DEFAULT_STROKE = "#ef4444";
export const DEFAULT_STROKE_WIDTH = 3;
export const DEFAULT_FILL = "rgba(239, 68, 68, 0.25)";
export const DEFAULT_REDACT_FILL = "#1a1a1a";

export const TOOL_SHORTCUTS: Record<string, MarkupTool> = {
  v: "select",
  f: "frame",
  r: "rectangle",
  o: "ellipse",
  a: "arrow",
  l: "line",
  t: "text",
  p: "freehand",
  x: "redact",
};
