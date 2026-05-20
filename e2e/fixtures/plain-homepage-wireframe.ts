/**
 * Low-fidelity mobile homepage wireframe inspired by Plain.com (saasframe.io reference):
 * sticky nav, hero + CTA, product preview, logo strip, feature rows, footer.
 * Coordinates are for a 390×844 phone frame (full drawable area).
 */
import type { MarkupObject, RectangleMarkup, TextMarkup } from "@/lib/markup/types";

const W = 390;
const PAD = 20;
const STROKE = "#374151";
const MUTED = "#9ca3af";
const ACCENT = "#facc15";
const SURFACE = "#f3f4f6";
const CARD = "#ffffff";

function rect(
  zIndex: number,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string,
  strokeColor = STROKE,
  strokeWidth = 1,
): RectangleMarkup {
  return {
    type: "rectangle",
    id: `rect-${zIndex}`,
    zIndex,
    x,
    y,
    width,
    height,
    strokeColor,
    strokeWidth,
    fillColor,
    fillEnabled: true,
  };
}

function label(
  zIndex: number,
  x: number,
  y: number,
  content: string,
  fontSize: number,
  opts: Partial<Pick<TextMarkup, "bold" | "color" | "alignment">> = {},
): TextMarkup {
  return {
    type: "text",
    id: `text-${zIndex}`,
    zIndex,
    x,
    y,
    content,
    fontSize,
    color: opts.color ?? "#111827",
    bold: opts.bold ?? false,
    italic: false,
    backgroundEnabled: false,
    alignment: opts.alignment ?? "left",
    strokeColor: opts.color ?? "#111827",
    strokeWidth: 1,
  };
}

function line(zIndex: number, x1: number, y1: number, x2: number, y2: number) {
  return {
    type: "line" as const,
    id: `line-${zIndex}`,
    zIndex,
    x1,
    y1,
    x2,
    y2,
    strokeColor: "#e5e7eb",
    strokeWidth: 1,
  };
}

export function plainHomepageWireframe(): MarkupObject[] {
  const btnW = W - PAD * 2;
  let z = 0;

  return [
    rect(z++, 0, 0, W, 52, SURFACE, "transparent", 0),
    rect(z++, PAD, 14, 72, 24, "#111827", "transparent", 0),
    rect(z++, W - PAD - 28, 16, 28, 20, SURFACE, STROKE),

    label(z++, PAD, 68, "Customer support", 26, { bold: true }),
    label(z++, PAD, 102, "for modern tools", 26, { bold: true }),
    label(z++, PAD, 148, "The support platform for SaaS teams.", 14, { color: MUTED }),

    rect(z++, PAD, 188, btnW, 48, ACCENT, "#ca8a04", 1),
    label(z++, PAD + 72, 202, "Start free trial", 15, { bold: true, alignment: "center" }),

    rect(z++, PAD, 248, btnW, 44, CARD, STROKE),
    label(z++, PAD + 100, 260, "Book a demo", 14, { alignment: "center" }),

    rect(z++, PAD, 312, btnW, 168, SURFACE, STROKE),
    rect(z++, PAD + 24, 332, btnW - 48, 128, "#e5e7eb", "transparent", 0),

    line(z++, PAD, 500, W - PAD, 500),

    label(z++, PAD, 516, "Trusted by modern teams", 12, { color: MUTED }),
    rect(z++, PAD, 544, 72, 28, "#e5e7eb", "transparent", 0),
    rect(z++, PAD + 84, 544, 72, 28, "#e5e7eb", "transparent", 0),
    rect(z++, PAD + 168, 544, 72, 28, "#e5e7eb", "transparent", 0),
    rect(z++, PAD + 252, 544, 72, 28, "#e5e7eb", "transparent", 0),

    label(z++, PAD, 596, "Features", 18, { bold: true }),

    rect(z++, PAD, 628, btnW, 72, CARD, "#e5e7eb"),
    rect(z++, PAD + 12, 644, 32, 32, ACCENT, "transparent", 0),
    label(z++, PAD + 56, 646, "Shared inbox", 14, { bold: true }),
    label(z++, PAD + 56, 668, "One queue for every channel.", 12, { color: MUTED }),

    rect(z++, PAD, 712, btnW, 72, CARD, "#e5e7eb"),
    rect(z++, PAD + 12, 728, 32, 32, ACCENT, "transparent", 0),
    label(z++, PAD + 56, 730, "Automation", 14, { bold: true }),
    label(z++, PAD + 56, 752, "Route tickets in seconds.", 12, { color: MUTED }),

    line(z++, PAD, 800, W - PAD, 800),
    label(z++, PAD, 812, "Privacy  ·  Terms  ·  Plain.com", 11, { color: MUTED, alignment: "center" }),
  ];
}

export const PLAIN_HOMEPAGE_MARKUP_COUNT = plainHomepageWireframe().length;
