import { boxHandles, selectionBounds, selectionHandles } from "@/lib/markup/bounds";
import type { ArtboardLayout } from "@/lib/markup/artboard-layout";
import { boundsFromDrag } from "@/lib/markup/session-document";
import type { MarkupObject, MarkupTool } from "@/lib/markup/types";

const FIGMA_BLUE = "#0D99FF";

type Props = {
  objects: MarkupObject[];
  selected: Set<string>;
  tool: MarkupTool;
  scale: number;
  scope: "artboard" | "image";
  frameSelected?: boolean;
  imageSelected?: boolean;
  layout?: ArtboardLayout;
  artboardDraft?: { x1: number; y1: number; x2: number; y2: number } | null;
};

function SelectionBox({
  bounds,
  scale,
  dashed = false,
}: {
  bounds: { x: number; y: number; width: number; height: number };
  scale: number;
  dashed?: boolean;
}) {
  return (
    <rect
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      fill={dashed ? "none" : "rgba(13, 153, 255, 0.06)"}
      stroke={FIGMA_BLUE}
      strokeWidth={1 / scale}
      strokeDasharray={dashed ? `${4 / scale} ${3 / scale}` : undefined}
      pointerEvents="none"
    />
  );
}

function SelectionHandles({
  handles,
  scale,
}: {
  handles: ReturnType<typeof boxHandles>;
  scale: number;
}) {
  const size = 8 / scale;
  const half = size / 2;
  return (
    <>
      {handles.map((handle) => (
        <rect
          key={handle.id}
          x={handle.x - half}
          y={handle.y - half}
          width={size}
          height={size}
          fill="#ffffff"
          stroke={FIGMA_BLUE}
          strokeWidth={1 / scale}
          data-selection-handle={handle.id}
          pointerEvents="none"
        />
      ))}
    </>
  );
}

export function CanvasSelectionOverlay({
  objects,
  selected,
  tool,
  scale,
  scope,
  frameSelected = false,
  imageSelected = false,
  layout,
  artboardDraft = null,
}: Props) {
  if (scope === "artboard" && layout) {
    if (artboardDraft) {
      const { x, y, width, height } = boundsFromDrag(
        artboardDraft.x1,
        artboardDraft.y1,
        artboardDraft.x2,
        artboardDraft.y2,
      );
      return (
        <g data-testid="artboard-draft-overlay" pointerEvents="none">
          <SelectionBox bounds={{ x, y, width, height }} scale={scale} />
        </g>
      );
    }

    if (imageSelected && selected.size === 0) {
      const imageBounds = {
        x: layout.imageOffsetX,
        y: layout.imageOffsetY,
        width: layout.imageDisplayWidth,
        height: layout.imageDisplayHeight,
      };
      return (
        <g data-testid="image-selection-overlay" pointerEvents="none">
          <SelectionBox bounds={imageBounds} scale={scale} />
          <SelectionHandles handles={boxHandles(imageBounds)} scale={scale} />
        </g>
      );
    }

    if (frameSelected && selected.size === 0) {
      const artboardBounds = {
        x: 0,
        y: 0,
        width: layout.artboardWidth,
        height: layout.artboardHeight,
      };
      const imageBounds = {
        x: layout.imageOffsetX,
        y: layout.imageOffsetY,
        width: layout.imageDisplayWidth,
        height: layout.imageDisplayHeight,
      };
      return (
        <g data-testid="frame-selection-overlay" pointerEvents="none">
          <SelectionBox bounds={artboardBounds} scale={scale} />
          <SelectionHandles handles={boxHandles(artboardBounds)} scale={scale} />
          {layout.imageDisplayWidth > 0 && layout.imageDisplayHeight > 0 && (
            <SelectionBox bounds={imageBounds} scale={scale} dashed />
          )}
        </g>
      );
    }

    return null;
  }

  if (scope !== "image") return null;
  if (tool !== "select" || selected.size === 0) return null;
  const bounds = selectionBounds(objects, selected);
  if (!bounds) return null;
  const handles = selectionHandles(objects, selected);

  return (
    <g data-testid="selection-overlay" pointerEvents="none">
      <SelectionBox bounds={bounds} scale={scale} />
      <SelectionHandles handles={handles} scale={scale} />
    </g>
  );
}
