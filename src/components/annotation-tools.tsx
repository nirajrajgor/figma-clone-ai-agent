import {
  ArrowRight,
  Circle,
  Frame,
  Minus,
  MousePointer2,
  Pencil,
  Square,
  SquareSlash,
  Type,
} from "lucide-react";
import type { MarkupTool } from "@/lib/markup/types";

export type AnnotationToolConfig = {
  id: MarkupTool;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
};

export const ANNOTATION_TOOLS: AnnotationToolConfig[] = [
  { id: "select", icon: <MousePointer2 className="size-4" />, label: "Select", shortcut: "V" },
  { id: "frame", icon: <Frame className="size-4" />, label: "Frame", shortcut: "F" },
  { id: "rectangle", icon: <Square className="size-4" />, label: "Rectangle", shortcut: "R" },
  { id: "ellipse", icon: <Circle className="size-4" />, label: "Ellipse", shortcut: "O" },
  { id: "arrow", icon: <ArrowRight className="size-4" />, label: "Arrow", shortcut: "A" },
  { id: "line", icon: <Minus className="size-4" />, label: "Line", shortcut: "L" },
  { id: "freehand", icon: <Pencil className="size-4" />, label: "Draw", shortcut: "P" },
  { id: "text", icon: <Type className="size-4" />, label: "Text", shortcut: "T" },
  { id: "redact", icon: <SquareSlash className="size-4" />, label: "Redact", shortcut: "X" },
];
