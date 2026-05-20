"use client";

import { Plus } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  centerImageInArtboard,
  fitArtboardToImage,
  applyFillModeLayout,
  resolveImageFillMode,
  MIN_ARTBOARD_SIZE,
  MIN_IMAGE_DISPLAY_SIZE,
  normalizeArtboardLayout,
  type ArtboardLayout,
  type ImageFillMode,
} from "@/lib/markup/artboard-layout";
import { resolveImageCrop } from "@/lib/markup/image-crop";
import { updateObject } from "@/lib/markup/document";
import type { ClientSessionDocument, StoredArtboard } from "@/lib/markup/session-document";
import {
  DEFAULT_IMAGE_OPACITY,
  resolveFrameCornerRadius,
  resolveImageOpacity,
} from "@/lib/markup/session-document";
import type { MarkupObject, MarkupTool, TextMarkup } from "@/lib/markup/types";
import { toHexForColorInput } from "@/lib/markup/selection-properties";

type SessionActions = {
  onReplaceImage: (file: File) => void;
  onDeleteSession: () => void;
};

type Props = {
  document: ClientSessionDocument;
  title: string;
  activeArtboardTitle?: string;
  layout: ArtboardLayout | null;
  activeImage: { width: number; height: number } | null;
  tool: MarkupTool;
  editingSelection: boolean;
  strokeColor: string;
  strokeWidth: number | "";
  fillEnabled: boolean;
  fillColor: string;
  showStroke: boolean;
  showFillToggle: boolean;
  showFillColor: boolean;
  objects: MarkupObject[];
  selectedText?: TextMarkup;
  showSessionPanel: boolean;
  showFramePanel: boolean;
  showMarkupPanel: boolean;
  sessionActions?: SessionActions;
  onSelectArtboard: (id: string) => void;
  onAddArtboard: () => void;
  onPatchLayout: (next: Partial<ArtboardLayout> & { imageFillMode?: ImageFillMode }) => void;
  onPatchArtboard: (patch: Partial<StoredArtboard>) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onFillEnabledChange: (enabled: boolean) => void;
  onFillColorChange: (color: string) => void;
  onCommit: (stack: MarkupObject[]) => void;
  cropEditing: boolean;
  cropAspectLocked: boolean;
  onEnterCrop: () => void;
  onCommitCrop: () => void;
  onCancelCrop: () => void;
  onCropAspectLockedChange: (locked: boolean) => void;
};

export function AnnotationInspector({
  document,
  title,
  activeArtboardTitle,
  layout,
  activeImage,
  tool,
  editingSelection,
  strokeColor,
  strokeWidth,
  fillEnabled,
  fillColor,
  showStroke,
  showFillToggle,
  showFillColor,
  objects,
  selectedText,
  showSessionPanel,
  showFramePanel,
  showMarkupPanel,
  sessionActions,
  onSelectArtboard,
  onAddArtboard,
  onPatchLayout,
  onPatchArtboard,
  onStrokeColorChange,
  onStrokeWidthChange,
  onFillEnabledChange,
  onFillColorChange,
  onCommit,
  cropEditing,
  cropAspectLocked,
  onEnterCrop,
  onCommitCrop,
  onCancelCrop,
  onCropAspectLockedChange,
}: Props) {
  const {
    artboardWidth,
    artboardHeight,
    imageOffsetX,
    imageOffsetY,
    imageDisplayWidth,
    imageDisplayHeight,
  } = layout ?? {
    artboardWidth: 640,
    artboardHeight: 480,
    imageOffsetX: 48,
    imageOffsetY: 48,
    imageDisplayWidth: 640,
    imageDisplayHeight: 480,
  };
  const width = activeImage?.width ?? 0;
  const height = activeImage?.height ?? 0;
  const activeArtboard = document.artboards.find((a) => a.id === document.activeArtboardId);
  const imageOpacity = activeArtboard ? resolveImageOpacity(activeArtboard) : DEFAULT_IMAGE_OPACITY;
  const frameCornerRadius = activeArtboard ? resolveFrameCornerRadius(activeArtboard) : 0;
  const imageFillMode = activeArtboard ? resolveImageFillMode(activeArtboard) : "fit";
  const manualImageLayout = imageFillMode === "crop";
  const maxCornerRadius = Math.floor(Math.min(imageDisplayWidth, imageDisplayHeight) / 2);

  const patchFromLayout = (next: ArtboardLayout) => {
    onPatchLayout(next);
  };

  return (
    <aside
      className="flex w-56 shrink-0 flex-col border-l bg-background"
      data-testid="markup-properties-panel"
    >
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          {showSessionPanel && sessionActions && (
            <div className="space-y-3" data-testid="session-maintenance">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Design file
              </p>
              <div className="space-y-2">
                <Label>Replace image</Label>
                <p className="text-xs text-muted-foreground">
                  Same-size images keep scene objects; different sizes ask before clearing.
                </p>
                <ImageUpload
                  value={null}
                  onChange={(file) => {
                    if (file) sessionActions.onReplaceImage(file);
                  }}
                  inputTestId="replace-base-image-input"
                  compact
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full"
                data-testid="delete-session"
                onClick={sessionActions.onDeleteSession}
              >
                Delete design file
              </Button>
            </div>
          )}
          {showSessionPanel && (showMarkupPanel || showFramePanel) && <Separator />}
          {showFramePanel && (
            <div className="space-y-3" data-testid="frame-properties">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Frame
              </p>
              <div className="space-y-2">
                <Label htmlFor="artboard-select">Artboard</Label>
                <Select
                  value={document.activeArtboardId}
                  onValueChange={(value) => {
                    if (value) onSelectArtboard(value);
                  }}
                >
                  <SelectTrigger id="artboard-select" data-testid="artboard-select">
                    <SelectValue placeholder="Select artboard">{activeArtboardTitle}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {document.artboards.map((board) => (
                      <SelectItem key={board.id} value={board.id}>
                        {board.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  data-testid="add-artboard-panel"
                  onClick={onAddArtboard}
                >
                  <Plus className="mr-1 size-3.5" />
                  Add artboard
                </Button>
              </div>
              <p className="text-sm">{activeArtboardTitle ?? title}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Frame size
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="artboard-width">Width</Label>
                  <Input
                    id="artboard-width"
                    type="number"
                    min={MIN_ARTBOARD_SIZE}
                    data-testid="artboard-width"
                    value={artboardWidth}
                    onChange={(e) => {
                      const nextWidth = Number(e.target.value);
                      if (!Number.isFinite(nextWidth) || !layout) return;
                      patchFromLayout(
                        normalizeArtboardLayout({ ...layout, artboardWidth: nextWidth }),
                      );
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="artboard-height">Height</Label>
                  <Input
                    id="artboard-height"
                    type="number"
                    min={MIN_ARTBOARD_SIZE}
                    data-testid="artboard-height"
                    value={artboardHeight}
                    onChange={(e) => {
                      const nextHeight = Number(e.target.value);
                      if (!Number.isFinite(nextHeight) || !layout) return;
                      patchFromLayout(
                        normalizeArtboardLayout({ ...layout, artboardHeight: nextHeight }),
                      );
                    }}
                  />
                </div>
              </div>
              {activeImage ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Source {width} × {height}px — drag image onto another artboard to move
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="image-fill-mode">Fill mode</Label>
                    <Select
                      value={imageFillMode}
                      onValueChange={(value) => {
                        if (!layout || !activeArtboard || !activeImage || !value) return;
                        const mode = value as ImageFillMode;
                        const crop = resolveImageCrop(activeArtboard, width, height);
                        const imageLayout = applyFillModeLayout(
                          mode,
                          layout.artboardWidth,
                          layout.artboardHeight,
                          crop.width,
                          crop.height,
                          layout,
                        );
                        onPatchLayout({ imageFillMode: mode, ...imageLayout });
                      }}
                    >
                      <SelectTrigger id="image-fill-mode" data-testid="image-fill-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fill">Fill</SelectItem>
                        <SelectItem value="fit">Fit</SelectItem>
                        <SelectItem value="crop">Crop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {cropEditing ? (
                    <div className="space-y-2" data-testid="crop-controls">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Crop image
                      </p>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="crop-aspect-lock"
                          data-testid="crop-aspect-lock"
                          checked={cropAspectLocked}
                          onCheckedChange={(c) => onCropAspectLockedChange(c === true)}
                        />
                        <Label htmlFor="crop-aspect-lock">Lock aspect ratio</Label>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          size="sm"
                          data-testid="apply-crop"
                          onClick={onCommitCrop}
                        >
                          Apply crop (Enter)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="cancel-crop"
                          onClick={onCancelCrop}
                        >
                          Cancel (Esc)
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      data-testid="enter-crop"
                      onClick={onEnterCrop}
                    >
                      Crop image
                    </Button>
                  )}
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Image size
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="image-display-width">Width</Label>
                      <Input
                        id="image-display-width"
                        type="number"
                        min={MIN_IMAGE_DISPLAY_SIZE}
                        data-testid="image-display-width"
                        value={Math.round(imageDisplayWidth)}
                        disabled={!manualImageLayout}
                        onChange={(e) => {
                          const nextWidth = Number(e.target.value);
                          if (!Number.isFinite(nextWidth) || !layout) return;
                          patchFromLayout(
                            normalizeArtboardLayout({ ...layout, imageDisplayWidth: nextWidth }),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="image-display-height">Height</Label>
                      <Input
                        id="image-display-height"
                        type="number"
                        min={MIN_IMAGE_DISPLAY_SIZE}
                        data-testid="image-display-height"
                        value={Math.round(imageDisplayHeight)}
                        disabled={!manualImageLayout}
                        onChange={(e) => {
                          const nextHeight = Number(e.target.value);
                          if (!Number.isFinite(nextHeight) || !layout) return;
                          patchFromLayout(
                            normalizeArtboardLayout({ ...layout, imageDisplayHeight: nextHeight }),
                          );
                        }}
                      />
                    </div>
                  </div>
                  {!manualImageLayout && (
                    <p className="text-xs text-muted-foreground">
                      Switch to Crop mode to edit image size and position manually.
                    </p>
                  )}
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Appearance
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="image-opacity">Opacity</Label>
                      <span
                        className="text-xs tabular-nums text-muted-foreground"
                        data-testid="image-opacity-value"
                      >
                        {imageOpacity}%
                      </span>
                    </div>
                    <input
                      id="image-opacity"
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      data-testid="image-opacity"
                      value={imageOpacity}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        if (!Number.isFinite(next)) return;
                        onPatchArtboard({ imageOpacity: next });
                      }}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="frame-corner-radius">Corner radius</Label>
                      <span
                        className="text-xs tabular-nums text-muted-foreground"
                        data-testid="frame-corner-radius-value"
                      >
                        {frameCornerRadius}px
                      </span>
                    </div>
                    <input
                      id="frame-corner-radius"
                      type="range"
                      min={0}
                      max={maxCornerRadius}
                      step={1}
                      data-testid="frame-corner-radius"
                      value={Math.min(frameCornerRadius, maxCornerRadius)}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        if (!Number.isFinite(next)) return;
                        onPatchArtboard({ frameCornerRadius: next });
                      }}
                      className="w-full accent-primary"
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No image on this artboard — drag one here from another frame
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Offset{" "}
                <span data-testid="image-offset-x">{Math.round(imageOffsetX)}</span>,{" "}
                <span data-testid="image-offset-y">{Math.round(imageOffsetY)}</span>
                px
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="fit-artboard-to-image"
                  disabled={!activeImage || !layout}
                  onClick={() => {
                    if (!layout) return;
                    onPatchLayout(fitArtboardToImage(layout));
                  }}
                >
                  Fit frame around image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="reset-image-size"
                  disabled={!activeImage}
                  onClick={() => {
                    onPatchLayout({
                      imageFillMode: "crop",
                      imageDisplayWidth: width,
                      imageDisplayHeight: height,
                      ...(layout ? centerImageInArtboard({ ...layout, imageDisplayWidth: width, imageDisplayHeight: height }) : {}),
                    });
                  }}
                >
                  Reset image to 100%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="center-image-in-artboard"
                  disabled={!activeImage || !layout}
                  onClick={() => {
                    if (!layout) return;
                    onPatchLayout(centerImageInArtboard(layout));
                  }}
                >
                  Center image
                </Button>
              </div>
            </div>
          )}
          {showFramePanel && showMarkupPanel && <Separator />}
          {showMarkupPanel ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {editingSelection ? "Selection" : "Tool defaults"}
              </p>
              {showStroke && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="stroke-color">Stroke</Label>
                    <Input
                      id="stroke-color"
                      type="color"
                      data-testid="stroke-color"
                      value={strokeColor}
                      onChange={(e) => onStrokeColorChange(e.target.value)}
                      className="h-9 cursor-pointer p-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stroke-width">Width</Label>
                    <Input
                      id="stroke-width"
                      type="number"
                      data-testid="stroke-width"
                      min={1}
                      max={20}
                      placeholder={strokeWidth === "" ? "Mixed" : undefined}
                      value={strokeWidth}
                      onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
              {showFillToggle && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="fill-enabled"
                    data-testid="fill-enabled"
                    checked={fillEnabled}
                    onCheckedChange={(c) => onFillEnabledChange(c === true)}
                  />
                  <Label htmlFor="fill-enabled">Fill shape</Label>
                </div>
              )}
              {showFillColor && (
                <div className="space-y-2">
                  <Label htmlFor="fill-color">
                    {editingSelection && !showFillToggle ? "Fill" : "Fill color"}
                  </Label>
                  <Input
                    id="fill-color"
                    type="color"
                    data-testid="fill-color"
                    value={toHexForColorInput(fillColor)}
                    onChange={(e) => onFillColorChange(e.target.value)}
                    className="h-9 cursor-pointer p-1"
                  />
                </div>
              )}
              {selectedText && (
                <>
                  <Separator />
                  <p className="text-xs font-medium text-muted-foreground">Text</p>
                  <div className="space-y-2">
                    <Label htmlFor="text-content">Label</Label>
                    <Input
                      id="text-content"
                      data-testid="text-content"
                      value={selectedText.content}
                      onChange={(e) =>
                        onCommit(
                          updateObject(objects, selectedText.id, { content: e.target.value }),
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="text-bold"
                      data-testid="text-bold"
                      checked={selectedText.bold}
                      onCheckedChange={(c) =>
                        onCommit(updateObject(objects, selectedText.id, { bold: c === true }))
                      }
                    />
                    <Label htmlFor="text-bold">Bold</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="text-italic"
                      data-testid="text-italic"
                      checked={selectedText.italic}
                      onCheckedChange={(c) =>
                        onCommit(updateObject(objects, selectedText.id, { italic: c === true }))
                      }
                    />
                    <Label htmlFor="text-italic">Italic</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="text-background"
                      data-testid="text-background"
                      checked={selectedText.backgroundEnabled}
                      onCheckedChange={(c) =>
                        onCommit(
                          updateObject(objects, selectedText.id, {
                            backgroundEnabled: c === true,
                          }),
                        )
                      }
                    />
                    <Label htmlFor="text-background">Background pill</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Alignment</Label>
                    <Select
                      value={selectedText.alignment}
                      onValueChange={(v) =>
                        onCommit(
                          updateObject(objects, selectedText.id, {
                            alignment: v as TextMarkup["alignment"],
                          }),
                        )
                      }
                    >
                      <SelectTrigger data-testid="text-alignment" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Select a shape to edit its properties, or pick a drawing tool.
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
