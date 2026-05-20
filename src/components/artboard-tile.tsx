"use client";

import { memo } from "react";
import { CanvasFrameLabel } from "@/components/canvas-frame-label";
import { CanvasSelectionOverlay } from "@/components/canvas-selection-overlay";
import { ImageCropOverlay } from "@/components/image-crop-overlay";
import type { ArtboardLayout } from "@/lib/markup/artboard-layout";
import { FRAME_LABEL_HEIGHT } from "@/lib/markup/artboard";
import { freehandPath, renderSvgObject } from "@/lib/markup/svg-objects";
import { sortByZIndex } from "@/lib/markup/document";
import {
  cropImageStyles,
  cropPreviewTransform,
  type ImageCrop,
} from "@/lib/markup/image-crop";
import {
  resolveFrameCornerRadius,
  resolveImageOpacity,
  type ClientSessionDocument,
} from "@/lib/markup/session-document";
import type { MarkupObject, MarkupTool } from "@/lib/markup/types";
import { DEFAULT_FILL, DEFAULT_REDACT_FILL } from "@/lib/markup/types";
import type { MarkupDraft } from "@/hooks/use-annotation-pointer";
import { TextInlineEditor, type TextInlineEditState } from "@/components/text-inline-editor";

type Marquee = { x1: number; y1: number; x2: number; y2: number };

export type ArtboardTileProps = {
  artboard: ClientSessionDocument["artboards"][number];
  image: { url: string; width: number; height: number } | null;
  imgW: number;
  imgH: number;
  imageCrop: ImageCrop;
  isActive: boolean;
  boardLayout: ArtboardLayout;
  boardX: number;
  boardY: number;
  boardObjects: MarkupObject[];
  imageDropTargetId: string | null;
  tool: MarkupTool;
  scale: number;
  selectedIds: string[];
  frameSelected: boolean;
  imageSelected: boolean;
  draft: MarkupDraft;
  marquee: Marquee | null;
  strokeColor: string;
  strokeWidth: number;
  fillEnabled: boolean;
  textInlineEdit: TextInlineEditState | null;
  cropEditing: boolean;
  cropDraft: ImageCrop | null;
  cropAspectLocked: boolean;
  onCropChange: (crop: ImageCrop) => void;
  onInlineTextCommit: (content: string) => void;
  onInlineTextCancel: () => void;
};

function ArtboardTileInner({
  artboard,
  image,
  imgW,
  imgH,
  imageCrop,
  isActive,
  boardLayout,
  boardX,
  boardY,
  boardObjects,
  imageDropTargetId,
  tool,
  scale,
  selectedIds,
  frameSelected,
  imageSelected,
  draft,
  marquee,
  strokeColor,
  strokeWidth,
  fillEnabled,
  textInlineEdit,
  cropEditing,
  cropDraft,
  cropAspectLocked,
  onCropChange,
  onInlineTextCommit,
  onInlineTextCancel,
}: ArtboardTileProps) {
  const selected = new Set(selectedIds);
  const displayW = boardLayout.imageDisplayWidth;
  const displayH = boardLayout.imageDisplayHeight;
  const boardSorted = sortByZIndex(boardObjects);
  const crop = cropEditing && cropDraft ? cropDraft : imageCrop;
  const preview = cropEditing ? cropPreviewTransform(imgW, imgH, displayW, displayH) : null;
  const imageStyles = cropEditing
    ? {
        position: "absolute" as const,
        left: preview!.offsetX,
        top: preview!.offsetY,
        width: preview!.previewWidth,
        height: preview!.previewHeight,
      }
    : cropImageStyles(crop, imgW, imgH, displayW, displayH);
  const imageOpacity = resolveImageOpacity(artboard);
  const frameCornerRadius = resolveFrameCornerRadius(artboard);

  return (
    <div className="absolute" style={{ left: boardX, top: boardY }}>
      <CanvasFrameLabel
        title={artboard.title}
        artboardWidth={boardLayout.artboardWidth}
        artboardHeight={boardLayout.artboardHeight}
        left={0}
        top={-FRAME_LABEL_HEIGHT - 4}
      />
      <div
        className={`relative overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)] ${isActive ? "" : "opacity-90"} ${imageDropTargetId === artboard.id ? "ring-2 ring-primary ring-offset-2" : ""}`}
        style={{
          width: boardLayout.artboardWidth,
          height: boardLayout.artboardHeight,
        }}
        data-testid={isActive ? "canvas-artboard" : undefined}
      >
        <svg
          width={boardLayout.artboardWidth}
          height={boardLayout.artboardHeight}
          className="absolute left-0 top-0 pointer-events-none"
          data-testid={isActive ? "artboard-overlay" : undefined}
        >
          {isActive && !cropEditing && (
            <CanvasSelectionOverlay
              scope="artboard"
              objects={boardObjects}
              selected={selected}
              tool={tool}
              scale={scale}
              frameSelected={frameSelected}
              imageSelected={imageSelected}
              layout={boardLayout}
            />
          )}
        </svg>
        {image ? (
          <div
            className="absolute overflow-hidden bg-white ring-1 ring-black/5"
            style={{
              left: boardLayout.imageOffsetX,
              top: boardLayout.imageOffsetY,
              width: displayW,
              height: displayH,
              opacity: imageOpacity / 100,
              borderRadius: frameCornerRadius,
            }}
            data-testid={isActive ? "frame-content" : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={artboard.title}
              draggable={false}
              data-testid={isActive ? "base-image" : undefined}
              className={`block max-w-none select-none pointer-events-none ${cropEditing ? "object-contain" : ""}`}
              style={imageStyles}
            />
            <svg
              width={displayW}
              height={displayH}
              viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
              className="absolute left-0 top-0"
              data-testid={isActive ? "markup-layer" : undefined}
              style={{ pointerEvents: cropEditing ? "none" : "none" }}
            >
              {boardSorted.map((o) => {
                if (textInlineEdit?.kind === "edit" && o.id === textInlineEdit.id) return null;
                return renderSvgObject(o);
              })}
              {isActive && !cropEditing && draft && (draft.kind === "rectangle" || draft.kind === "redact") && (
                <rect
                  x={draft.w < 0 ? draft.x + draft.w : draft.x}
                  y={draft.h < 0 ? draft.y + draft.h : draft.y}
                  width={Math.abs(draft.w)}
                  height={Math.abs(draft.h)}
                  stroke={draft.kind === "redact" ? "none" : strokeColor}
                  strokeWidth={draft.kind === "redact" ? 0 : strokeWidth}
                  fill={
                    draft.kind === "redact"
                      ? DEFAULT_REDACT_FILL
                      : fillEnabled
                        ? DEFAULT_FILL
                        : "none"
                  }
                  opacity={0.7}
                />
              )}
              {isActive && !cropEditing && draft?.kind === "ellipse" && Math.abs(draft.w) > 0 && (
                <ellipse
                  cx={(draft.w < 0 ? draft.x + draft.w : draft.x) + Math.abs(draft.w) / 2}
                  cy={(draft.h < 0 ? draft.y + draft.h : draft.y) + Math.abs(draft.h) / 2}
                  rx={Math.abs(draft.w) / 2}
                  ry={Math.abs(draft.h) / 2}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fill={fillEnabled ? DEFAULT_FILL : "none"}
                  opacity={0.7}
                />
              )}
              {isActive && !cropEditing && (draft?.kind === "arrow" || draft?.kind === "line") && (
                <line
                  x1={draft.x1}
                  y1={draft.y1}
                  x2={draft.x2}
                  y2={draft.y2}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={0.7}
                />
              )}
              {isActive && !cropEditing && draft?.kind === "freehand" && draft.points.length > 1 && (
                <path
                  d={freehandPath(draft.points)}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={0.7}
                />
              )}
              {isActive && !cropEditing && marquee && (
                <rect
                  x={Math.min(marquee.x1, marquee.x2)}
                  y={Math.min(marquee.y1, marquee.y2)}
                  width={Math.abs(marquee.x2 - marquee.x1)}
                  height={Math.abs(marquee.y2 - marquee.y1)}
                  fill="rgba(59,130,246,0.1)"
                  stroke="#3b82f6"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                  data-testid="marquee-rect"
                />
              )}
              {isActive && !cropEditing && (
                <CanvasSelectionOverlay
                  scope="image"
                  objects={boardObjects}
                  selected={selected}
                  tool={tool}
                  scale={scale}
                />
              )}
            </svg>
            {isActive && cropEditing && cropDraft && (
              <ImageCropOverlay
                crop={cropDraft}
                intrinsicWidth={imgW}
                intrinsicHeight={imgH}
                displayWidth={displayW}
                displayHeight={displayH}
                scale={scale}
                aspectLocked={cropAspectLocked}
                onCropChange={onCropChange}
              />
            )}
            {isActive && textInlineEdit && !cropEditing && (
              <TextInlineEditor
                edit={textInlineEdit}
                imageCrop={imageCrop}
                displayW={displayW}
                displayH={displayH}
                onCommit={onInlineTextCommit}
                onCancel={onInlineTextCancel}
              />
            )}
          </div>
        ) : (
          <div
            className="absolute inset-8 flex items-center justify-center rounded border border-dashed border-muted-foreground/40 text-xs text-muted-foreground"
            data-testid={isActive ? "empty-artboard" : undefined}
          >
            Drop an image here
          </div>
        )}
      </div>
    </div>
  );
}

function propsEqual(a: ArtboardTileProps, b: ArtboardTileProps) {
  if (a.artboard.id !== b.artboard.id) return false;
  if (a.isActive !== b.isActive) return false;
  if (a.boardX !== b.boardX || a.boardY !== b.boardY) return false;
  if (a.imageDropTargetId !== b.imageDropTargetId) return false;
  if (a.tool !== b.tool || a.scale !== b.scale) return false;
  if (a.frameSelected !== b.frameSelected || a.imageSelected !== b.imageSelected) return false;
  if (a.strokeColor !== b.strokeColor || a.strokeWidth !== b.strokeWidth) return false;
  if (a.fillEnabled !== b.fillEnabled) return false;
  if (a.textInlineEdit !== b.textInlineEdit) return false;
  if (a.cropEditing !== b.cropEditing) return false;
  if (a.cropAspectLocked !== b.cropAspectLocked) return false;
  if (a.cropDraft !== b.cropDraft) return false;
  if (
    a.imageCrop.x !== b.imageCrop.x ||
    a.imageCrop.y !== b.imageCrop.y ||
    a.imageCrop.width !== b.imageCrop.width ||
    a.imageCrop.height !== b.imageCrop.height
  ) {
    return false;
  }
  if (a.draft !== b.draft || a.marquee !== b.marquee) return false;
  if (a.image?.url !== b.image?.url) return false;
  if (
    a.boardLayout.artboardWidth !== b.boardLayout.artboardWidth ||
    a.boardLayout.artboardHeight !== b.boardLayout.artboardHeight ||
    a.boardLayout.imageOffsetX !== b.boardLayout.imageOffsetX ||
    a.boardLayout.imageOffsetY !== b.boardLayout.imageOffsetY ||
    a.boardLayout.imageDisplayWidth !== b.boardLayout.imageDisplayWidth ||
    a.boardLayout.imageDisplayHeight !== b.boardLayout.imageDisplayHeight
  ) {
    return false;
  }
  if (a.selectedIds.length !== b.selectedIds.length) return false;
  for (let i = 0; i < a.selectedIds.length; i++) {
    if (a.selectedIds[i] !== b.selectedIds[i]) return false;
  }
  if (a.boardObjects !== b.boardObjects) return false;
  if (resolveImageOpacity(a.artboard) !== resolveImageOpacity(b.artboard)) return false;
  if (resolveFrameCornerRadius(a.artboard) !== resolveFrameCornerRadius(b.artboard)) return false;
  return true;
}

export const ArtboardTile = memo(ArtboardTileInner, propsEqual);
