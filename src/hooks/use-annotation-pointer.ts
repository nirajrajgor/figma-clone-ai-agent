import { useCallback, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { addObject, moveObjects, sortByZIndex } from "@/lib/markup/document";
import { hitTest, objectsInRect } from "@/lib/markup/hit-test";
import {
  applyArtboardResize,
  applyImageResize,
  layoutFromArtboard,
  layoutFromBlankArtboard,
  resolveImageFillMode,
  type ArtboardLayout,
  type ImageFillMode,
} from "@/lib/markup/artboard-layout";
import {
  artboardToImage,
  displayToIntrinsic,
  isInImageContent,
  isOnArtboard,
} from "@/lib/markup/artboard";
import {
  displayToIntrinsicCrop,
  isInCropArea,
  resolveImageCrop,
  type ImageCrop,
} from "@/lib/markup/image-crop";
import {
  ARTBOARD_HANDLE_HIT_RADIUS,
  cursorForHandle,
  hitBoxHandle,
  hitSelectionHandle,
  objectBounds,
  type Bounds,
  type ResizeHandle,
} from "@/lib/markup/bounds";
import { applyResize } from "@/lib/markup/resize";
import {
  canvasToArtboardLocal,
  resolveImageDropTarget,
  type ClientSessionDocument,
  type StoredArtboard,
} from "@/lib/markup/session-document";
import type {
  ArrowMarkup,
  EllipseMarkup,
  FreehandMarkup,
  LineMarkup,
  MarkupObject,
  MarkupTool,
  RedactMarkup,
  RectangleMarkup,
} from "@/lib/markup/types";
import { DEFAULT_FILL, DEFAULT_REDACT_FILL } from "@/lib/markup/types";

function boxFromDrag(x: number, y: number, w: number, h: number) {
  return {
    x: w < 0 ? x + w : x,
    y: h < 0 ? y + h : y,
    width: Math.abs(w),
    height: Math.abs(h),
  };
}

export type MarkupDraft =
  | { kind: "rectangle" | "ellipse" | "redact"; x: number; y: number; w: number; h: number }
  | { kind: "arrow" | "line"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "freehand"; points: [number, number][] }
  | null;

type DragState =
  | { kind: "pan"; x: number; y: number; ox: number; oy: number }
  | { kind: "move"; x: number; y: number }
  | {
      kind: "resize";
      handle: ResizeHandle;
      snapshot: MarkupObject[];
      startBounds: Bounds;
    }
  | {
      kind: "resize-artboard";
      handle: ResizeHandle;
      snapshot: ArtboardLayout;
      fillMode: ImageFillMode;
      cropWidth: number;
      cropHeight: number;
    }
  | { kind: "resize-image"; handle: ResizeHandle; snapshot: ArtboardLayout }
  | {
      kind: "move-artboard";
      startCanvasX: number;
      startCanvasY: number;
      startX: number;
      startY: number;
    }
  | {
      kind: "move-image";
      artboardId: string;
      startAbX: number;
      startAbY: number;
      startOx: number;
      startOy: number;
      hoverArtboardId?: string | null;
    }
  | { kind: "create-artboard"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "draw" }
  | { kind: "text" }
  | null;

type SessionDocApi = {
  document: ClientSessionDocument;
  activeArtboard: StoredArtboard | undefined;
  layout: ArtboardLayout | null;
  objects: MarkupObject[];
  commit: (stack: MarkupObject[]) => void;
  previewMarkup: (stack: MarkupObject[]) => void;
  selectArtboard: (id: string) => void;
  patchActiveArtboard: (patch: Partial<StoredArtboard>) => void;
  patchArtboard: (id: string, patch: Partial<StoredArtboard>) => void;
  createArtboardAtDrag: (x1: number, y1: number, x2: number, y2: number) => void;
  transferImageToArtboard: (sourceId: string, targetId: string) => void;
  artboardAtCanvasPoint: (x: number, y: number) => StoredArtboard | null;
};

type PointerContext = {
  tool: MarkupTool;
  selected: Set<string>;
  imageSelected: boolean;
  scale: number;
  width: number;
  height: number;
  imageCrop: ImageCrop;
  imageFillMode: ImageFillMode;
  cropActive: boolean;
  strokeColor: string;
  strokeWidth: number;
  fillEnabled: boolean;
  spaceHeldRef: RefObject<boolean>;
  containerRef: RefObject<HTMLDivElement | null>;
  textPlacementRef: RefObject<{ x: number; y: number } | null>;
  screenToCanvas: (clientX: number, clientY: number) => { x: number; y: number };
  patchLayout: (next: Partial<ArtboardLayout>) => void;
  setSelected: Dispatch<SetStateAction<Set<string>>>;
  setFrameSelected: (v: boolean) => void;
  setImageSelected: (v: boolean) => void;
  setImageDropTargetId: (id: string | null) => void;
  onBeginTextPlace: (x: number, y: number) => void;
  setOffset: Dispatch<SetStateAction<{ x: number; y: number }>>;
  setPanning: (v: boolean) => void;
};

export function useAnnotationPointer(session: SessionDocApi, ctx: PointerContext) {
  const dragRef = useRef<DragState>(null);
  const [draft, setDraft] = useState<MarkupDraft>(null);
  const [marquee, setMarquee] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [artboardDraft, setArtboardDraft] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [layoutPreview, setLayoutPreview] = useState<ArtboardLayout | null>(null);
  const [artboardMovePreview, setArtboardMovePreview] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [imageMovePreview, setImageMovePreview] = useState<{
    artboardId: string;
    imageOffsetX: number;
    imageOffsetY: number;
  } | null>(null);
  const [hoverCursor, setHoverCursor] = useState<string | null>(null);

  const {
    document,
    activeArtboard,
    layout,
    objects,
    commit,
    previewMarkup,
    selectArtboard,
    patchActiveArtboard,
    patchArtboard,
    createArtboardAtDrag,
    transferImageToArtboard,
    artboardAtCanvasPoint,
  } = session;

  const {
    tool,
    selected,
    imageSelected,
    scale,
    width,
    height,
    imageCrop,
    imageFillMode,
    cropActive,
    strokeColor,
    strokeWidth,
    fillEnabled,
    spaceHeldRef,
    containerRef,
    textPlacementRef,
    screenToCanvas,
    patchLayout,
    setSelected,
    setFrameSelected,
    setImageSelected,
    setImageDropTargetId,
    onBeginTextPlace,
    setOffset,
    setPanning,
  } = ctx;

  const sorted = sortByZIndex(objects);

  const pointerToActiveLocal = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = screenToCanvas(clientX, clientY);
      if (!activeArtboard) {
        return { canvas, local: canvas, image: { x: 0, y: 0 } };
      }
      const eff = layoutPreview ?? layout;
      const local = canvasToArtboardLocal(canvas.x, canvas.y, activeArtboard);
      const display = artboardToImage(
        local.x,
        local.y,
        eff?.imageOffsetX ?? 48,
        eff?.imageOffsetY ?? 48,
      );
      return {
        canvas,
        local,
        image: displayToIntrinsicCrop(
          display.x,
          display.y,
          imageCrop,
          eff?.imageDisplayWidth ?? 640,
          eff?.imageDisplayHeight ?? 480,
        ),
      };
    },
    [activeArtboard, imageCrop, layout, layoutPreview, screenToCanvas],
  );

  const intrinsicFromDisplay = useCallback(
    (
      displayX: number,
      displayY: number,
      imgW: number,
      imgH: number,
      displayWidth: number,
      displayHeight: number,
    ) => {
      if (imgW && imgH) {
        const crop =
          imgW === width && imgH === height
            ? imageCrop
            : { x: 0, y: 0, width: imgW, height: imgH };
        return displayToIntrinsicCrop(displayX, displayY, crop, displayWidth, displayHeight);
      }
      return displayToIntrinsic(displayX, displayY, imgW, imgH, displayWidth, displayHeight);
    },
    [imageCrop, width, height],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || cropActive) return;
      const canvas = screenToCanvas(e.clientX, e.clientY);
      const hitBoard = artboardAtCanvasPoint(canvas.x, canvas.y);
      const targetBoard = hitBoard ?? activeArtboard;
      if (!targetBoard) return;
      if (hitBoard && hitBoard.id !== document.activeArtboardId) {
        selectArtboard(hitBoard.id);
      }
      const local = canvasToArtboardLocal(canvas.x, canvas.y, targetBoard);
      const boardImage = targetBoard.imageId ? document.images[targetBoard.imageId] : null;
      const imgW = boardImage?.width ?? 0;
      const imgH = boardImage?.height ?? 0;
      const boardLayout = boardImage
        ? (() => {
            const boardCrop = resolveImageCrop(targetBoard, imgW, imgH);
            return layoutFromArtboard(
              targetBoard,
              imgW,
              imgH,
              boardCrop.width,
              boardCrop.height,
            );
          })()
        : layoutFromBlankArtboard(targetBoard);
      const boardCrop = boardImage
        ? resolveImageCrop(targetBoard, imgW, imgH)
        : {
            x: 0,
            y: 0,
            width: boardLayout.imageDisplayWidth,
            height: boardLayout.imageDisplayHeight,
          };
      const boardFillMode = resolveImageFillMode(targetBoard);
      const displayPt = artboardToImage(
        local.x,
        local.y,
        boardLayout.imageOffsetX,
        boardLayout.imageOffsetY,
      );
      const pt = intrinsicFromDisplay(
        displayPt.x,
        displayPt.y,
        imgW,
        imgH,
        boardLayout.imageDisplayWidth,
        boardLayout.imageDisplayHeight,
      );

      if (tool === "frame") {
        if (hitBoard) {
          setFrameSelected(true);
          setImageSelected(false);
          setSelected(new Set());
          return;
        }
        dragRef.current = {
          kind: "create-artboard",
          x1: canvas.x,
          y1: canvas.y,
          x2: canvas.x,
          y2: canvas.y,
        };
        setArtboardDraft({ x1: canvas.x, y1: canvas.y, x2: canvas.x, y2: canvas.y });
        setFrameSelected(false);
        setImageSelected(false);
        setSelected(new Set());
        containerRef.current?.setPointerCapture(e.pointerId);
        return;
      }

      if (tool === "select") {
        if (selected.size === 0 && targetBoard.id === document.activeArtboardId) {
          const frameHandle = hitBoxHandle(
            local.x,
            local.y,
            { x: 0, y: 0, width: targetBoard.artboardWidth, height: targetBoard.artboardHeight },
            scale,
            ARTBOARD_HANDLE_HIT_RADIUS,
          );
          if (frameHandle && layout) {
            setFrameSelected(true);
            setImageSelected(false);
            dragRef.current = {
              kind: "resize-artboard",
              handle: frameHandle,
              snapshot: layout,
              fillMode: boardFillMode,
              cropWidth: boardCrop.width,
              cropHeight: boardCrop.height,
            };
            containerRef.current?.setPointerCapture(e.pointerId);
            return;
          }

          if (boardFillMode === "crop" && imageSelected && imgW > 0 && imgH > 0) {
            const imageHandle = hitBoxHandle(
              local.x,
              local.y,
              {
                x: boardLayout.imageOffsetX,
                y: boardLayout.imageOffsetY,
                width: boardLayout.imageDisplayWidth,
                height: boardLayout.imageDisplayHeight,
              },
              scale,
              ARTBOARD_HANDLE_HIT_RADIUS,
            );
            if (imageHandle && layout) {
              dragRef.current = { kind: "resize-image", handle: imageHandle, snapshot: layout };
              containerRef.current?.setPointerCapture(e.pointerId);
              return;
            }
          }
        }

        const handle = hitSelectionHandle(pt.x, pt.y, objects, selected, scale);
        if (handle && selected.size === 1) {
          const id = [...selected][0];
          const target = objects.find((o) => o.id === id);
          const startBounds = target ? objectBounds(target) : null;
          if (startBounds) {
            setFrameSelected(false);
            setImageSelected(false);
            dragRef.current = { kind: "resize", handle, snapshot: objects, startBounds };
            containerRef.current?.setPointerCapture(e.pointerId);
            return;
          }
        }

        const markupHit = hitTest(sorted, pt.x, pt.y);
        if (markupHit && targetBoard.id === document.activeArtboardId) {
          setFrameSelected(false);
          setImageSelected(false);
          setSelected((prev) => {
            const next = new Set(e.shiftKey ? prev : []);
            if (next.has(markupHit)) next.delete(markupHit);
            else next.add(markupHit);
            return next;
          });
          dragRef.current = { kind: "move", x: pt.x, y: pt.y };
          containerRef.current?.setPointerCapture(e.pointerId);
          return;
        }

        if (
          boardFillMode === "crop" &&
          targetBoard.imageId &&
          isInImageContent(
            displayPt.x,
            displayPt.y,
            boardLayout.imageDisplayWidth,
            boardLayout.imageDisplayHeight,
          )
        ) {
          setSelected(new Set());
          setFrameSelected(false);
          setImageSelected(true);
          dragRef.current = {
            kind: "move-image",
            artboardId: targetBoard.id,
            startAbX: local.x,
            startAbY: local.y,
            startOx: targetBoard.imageOffsetX,
            startOy: targetBoard.imageOffsetY,
            hoverArtboardId: null,
          };
          containerRef.current?.setPointerCapture(e.pointerId);
          return;
        }

        if (
          isOnArtboard(local.x, local.y, targetBoard.artboardWidth, targetBoard.artboardHeight) &&
          !e.shiftKey
        ) {
          setSelected(new Set());
          setFrameSelected(true);
          setImageSelected(false);
          dragRef.current = {
            kind: "move-artboard",
            startCanvasX: canvas.x,
            startCanvasY: canvas.y,
            startX: targetBoard.x,
            startY: targetBoard.y,
          };
          containerRef.current?.setPointerCapture(e.pointerId);
          return;
        }

        if (!e.shiftKey) {
          setSelected(new Set());
          setFrameSelected(false);
          setImageSelected(false);
        }
        if (targetBoard.id === document.activeArtboardId) {
          setMarquee({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
          dragRef.current = { kind: "draw" };
          containerRef.current?.setPointerCapture(e.pointerId);
        }
        return;
      }

      if (targetBoard.id !== document.activeArtboardId) return;

      if (tool === "text") {
        if (!isInCropArea(pt.x, pt.y, imageCrop)) return;
        textPlacementRef.current = { x: pt.x, y: pt.y };
        dragRef.current = { kind: "text" };
        return;
      }

      if (!isInCropArea(pt.x, pt.y, imageCrop)) return;

      dragRef.current = { kind: "draw" };
      if (tool === "rectangle") {
        setDraft({ kind: "rectangle", x: pt.x, y: pt.y, w: 0, h: 0 });
      } else if (tool === "ellipse") {
        setDraft({ kind: "ellipse", x: pt.x, y: pt.y, w: 0, h: 0 });
      } else if (tool === "redact") {
        setDraft({ kind: "redact", x: pt.x, y: pt.y, w: 0, h: 0 });
      } else if (tool === "arrow") {
        setDraft({ kind: "arrow", x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
      } else if (tool === "line") {
        setDraft({ kind: "line", x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
      } else if (tool === "freehand") {
        setDraft({ kind: "freehand", points: [[pt.x, pt.y]] });
      }
      containerRef.current?.setPointerCapture(e.pointerId);
    },
    [
      activeArtboard,
      artboardAtCanvasPoint,
      containerRef,
      document,
      imageSelected,
      layout,
      objects,
      scale,
      selectArtboard,
      selected,
      sorted,
      textPlacementRef,
      tool,
      cropActive,
      imageCrop,
      intrinsicFromDisplay,
      width,
      height,
      screenToCanvas,
      setFrameSelected,
      setImageSelected,
      setSelected,
    ],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const canvas = screenToCanvas(e.clientX, e.clientY);
      const { local, image: pt } = pointerToActiveLocal(e.clientX, e.clientY);
      const drag = dragRef.current;

      if (drag?.kind === "pan") {
        setOffset({
          x: drag.ox + (e.clientX - drag.x),
          y: drag.oy + (e.clientY - drag.y),
        });
        return;
      }

      if (drag?.kind === "move-artboard") {
        setArtboardMovePreview({
          x: drag.startX + (canvas.x - drag.startCanvasX),
          y: drag.startY + (canvas.y - drag.startCanvasY),
        });
        return;
      }

      if (drag?.kind === "move-image") {
        const sourceBoard = document.artboards.find((a) => a.id === drag.artboardId);
        if (!sourceBoard) return;
        const sourceLocal = canvasToArtboardLocal(canvas.x, canvas.y, sourceBoard);
        const hovered = artboardAtCanvasPoint(canvas.x, canvas.y);
        const hoverId = hovered && hovered.id !== drag.artboardId ? hovered.id : null;
        dragRef.current = { ...drag, hoverArtboardId: hoverId ?? drag.hoverArtboardId };
        setImageDropTargetId(hoverId);
        if (hoverId) {
          setImageMovePreview(null);
          return;
        }
        setImageMovePreview({
          artboardId: drag.artboardId,
          imageOffsetX: drag.startOx + (sourceLocal.x - drag.startAbX),
          imageOffsetY: drag.startOy + (sourceLocal.y - drag.startAbY),
        });
        return;
      }

      if (drag?.kind === "resize-artboard") {
        setLayoutPreview(
          applyArtboardResize(
            drag.snapshot,
            drag.handle,
            local,
            drag.fillMode,
            drag.cropWidth,
            drag.cropHeight,
          ),
        );
        return;
      }

      if (drag?.kind === "resize-image") {
        setLayoutPreview(applyImageResize(drag.snapshot, drag.handle, local));
        return;
      }

      if (drag?.kind === "create-artboard") {
        const next = { ...drag, x2: canvas.x, y2: canvas.y };
        dragRef.current = next;
        setArtboardDraft({ x1: next.x1, y1: next.y1, x2: next.x2, y2: next.y2 });
        return;
      }

      if (drag?.kind === "resize") {
        previewMarkup(applyResize(drag.snapshot, selected, drag.handle, drag.startBounds, pt));
        return;
      }

      if (tool === "select" && !drag && !spaceHeldRef.current && activeArtboard) {
        const frameHandle =
          selected.size === 0 && !imageSelected
            ? hitBoxHandle(
                local.x,
                local.y,
                {
                  x: 0,
                  y: 0,
                  width: activeArtboard.artboardWidth,
                  height: activeArtboard.artboardHeight,
                },
                scale,
                ARTBOARD_HANDLE_HIT_RADIUS,
              )
            : null;
        const imageHandle =
          imageFillMode === "crop" &&
          selected.size === 0 &&
          imageSelected &&
          width > 0 &&
          height > 0
            ? hitBoxHandle(
                local.x,
                local.y,
                {
                  x: layout?.imageOffsetX ?? 0,
                  y: layout?.imageOffsetY ?? 0,
                  width: layout?.imageDisplayWidth ?? 0,
                  height: layout?.imageDisplayHeight ?? 0,
                },
                scale,
                ARTBOARD_HANDLE_HIT_RADIUS,
              )
            : null;
        const markupHandle =
          selected.size > 0
            ? hitSelectionHandle(pt.x, pt.y, objects, selected, scale)
            : null;
        const nextCursor = frameHandle
          ? cursorForHandle(frameHandle)
          : imageHandle
            ? cursorForHandle(imageHandle)
            : markupHandle
              ? cursorForHandle(markupHandle)
              : null;
        setHoverCursor((prev) => (prev === nextCursor ? prev : nextCursor));
      }

      if (drag?.kind === "move" && selected.size > 0) {
        const dx = pt.x - drag.x;
        const dy = pt.y - drag.y;
        if (dx !== 0 || dy !== 0) {
          previewMarkup(moveObjects(objects, selected, dx, dy));
          dragRef.current = { kind: "move", x: pt.x, y: pt.y };
        }
        return;
      }

      if (marquee) {
        setMarquee({ ...marquee, x2: pt.x, y2: pt.y });
        return;
      }

      if (!draft) return;
      if (draft.kind === "rectangle" || draft.kind === "ellipse" || draft.kind === "redact") {
        setDraft({ ...draft, w: pt.x - draft.x, h: pt.y - draft.y });
      } else if (draft.kind === "arrow" || draft.kind === "line") {
        setDraft({ ...draft, x2: pt.x, y2: pt.y });
      } else if (draft.kind === "freehand") {
        setDraft({
          kind: "freehand",
          points: [...draft.points, [pt.x, pt.y] as [number, number]],
        });
      }
    },
    [
      activeArtboard,
      artboardAtCanvasPoint,
      document.artboards,
      draft,
      height,
      imageFillMode,
      imageSelected,
      layout,
      marquee,
      objects,
      pointerToActiveLocal,
      previewMarkup,
      scale,
      screenToCanvas,
      selected,
      setHoverCursor,
      setImageDropTargetId,
      setOffset,
      spaceHeldRef,
      tool,
      width,
    ],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragRef.current?.kind === "text") {
        if (textPlacementRef.current) {
          onBeginTextPlace(textPlacementRef.current.x, textPlacementRef.current.y);
          textPlacementRef.current = null;
        }
        dragRef.current = null;
        return;
      }

      if (marquee) {
        const ids = objectsInRect(sorted, marquee.x1, marquee.y1, marquee.x2, marquee.y2);
        setSelected(new Set(ids));
        setFrameSelected(ids.length === 0);
        setImageSelected(false);
        setMarquee(null);
        dragRef.current = null;
        return;
      }

      if (dragRef.current?.kind === "create-artboard") {
        const { x1, y1, x2, y2 } = dragRef.current;
        if (Math.abs(x2 - x1) > 4 && Math.abs(y2 - y1) > 4) {
          createArtboardAtDrag(x1, y1, x2, y2);
          setFrameSelected(true);
          setImageSelected(false);
        }
        setArtboardDraft(null);
        dragRef.current = null;
        containerRef.current?.releasePointerCapture(e.pointerId);
        return;
      }

      if (dragRef.current?.kind === "move-image") {
        const drag = dragRef.current;
        const canvas = screenToCanvas(e.clientX, e.clientY);
        const dropTarget = resolveImageDropTarget(
          document,
          canvas.x,
          canvas.y,
          drag.artboardId,
          drag.hoverArtboardId,
        );
        const sourceBoard = document.artboards.find((a) => a.id === drag.artboardId);
        if (dropTarget && sourceBoard?.imageId) {
          transferImageToArtboard(drag.artboardId, dropTarget.id);
          setFrameSelected(true);
          setImageSelected(false);
        } else if (imageMovePreview) {
          patchArtboard(imageMovePreview.artboardId, {
            imageOffsetX: imageMovePreview.imageOffsetX,
            imageOffsetY: imageMovePreview.imageOffsetY,
          });
        }
        dragRef.current = null;
        setImageMovePreview(null);
        setImageDropTargetId(null);
        setHoverCursor(null);
        containerRef.current?.releasePointerCapture(e.pointerId);
        return;
      }

      if (
        dragRef.current?.kind === "resize-artboard" ||
        dragRef.current?.kind === "resize-image"
      ) {
        if (layoutPreview) patchLayout(layoutPreview);
        setLayoutPreview(null);
        dragRef.current = null;
        setHoverCursor(null);
        containerRef.current?.releasePointerCapture(e.pointerId);
        return;
      }

      if (dragRef.current?.kind === "move-artboard") {
        if (artboardMovePreview) {
          patchActiveArtboard({ x: artboardMovePreview.x, y: artboardMovePreview.y });
        }
        setArtboardMovePreview(null);
        dragRef.current = null;
        setHoverCursor(null);
        containerRef.current?.releasePointerCapture(e.pointerId);
        return;
      }

      if (dragRef.current?.kind === "resize" || dragRef.current?.kind === "move") {
        commit(objects);
        dragRef.current = null;
        containerRef.current?.releasePointerCapture(e.pointerId);
        return;
      }

      if (draft) {
        if (
          (draft.kind === "rectangle" || draft.kind === "ellipse" || draft.kind === "redact") &&
          Math.abs(draft.w) > 4 &&
          Math.abs(draft.h) > 4
        ) {
          const box = boxFromDrag(draft.x, draft.y, draft.w, draft.h);
          if (draft.kind === "rectangle") {
            const rect: Omit<RectangleMarkup, "id" | "zIndex"> = {
              type: "rectangle",
              ...box,
              strokeColor: strokeColor,
              strokeWidth: strokeWidth,
              fillColor: DEFAULT_FILL,
              fillEnabled: fillEnabled,
            };
            commit(addObject(objects, rect));
          } else if (draft.kind === "ellipse") {
            const ellipse: Omit<EllipseMarkup, "id" | "zIndex"> = {
              type: "ellipse",
              ...box,
              strokeColor: strokeColor,
              strokeWidth: strokeWidth,
              fillColor: DEFAULT_FILL,
              fillEnabled: fillEnabled,
            };
            commit(addObject(objects, ellipse));
          } else {
            const redact: Omit<RedactMarkup, "id" | "zIndex"> = {
              type: "redact",
              ...box,
              fillColor: DEFAULT_REDACT_FILL,
              strokeColor: DEFAULT_REDACT_FILL,
              strokeWidth: 0,
            };
            commit(addObject(objects, redact));
          }
        } else if (draft.kind === "arrow") {
          const arrow: Omit<ArrowMarkup, "id" | "zIndex"> = {
            type: "arrow",
            x1: draft.x1,
            y1: draft.y1,
            x2: draft.x2,
            y2: draft.y2,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
          };
          commit(addObject(objects, arrow));
        } else if (draft.kind === "line") {
          const line: Omit<LineMarkup, "id" | "zIndex"> = {
            type: "line",
            x1: draft.x1,
            y1: draft.y1,
            x2: draft.x2,
            y2: draft.y2,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
          };
          commit(addObject(objects, line));
        } else if (draft.kind === "freehand" && draft.points.length > 2) {
          const pen: Omit<FreehandMarkup, "id" | "zIndex"> = {
            type: "freehand",
            points: draft.points,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
          };
          commit(addObject(objects, pen));
        }
        setDraft(null);
      }

      dragRef.current = null;
      containerRef.current?.releasePointerCapture(e.pointerId);
    },
    [
      artboardMovePreview,
      commit,
      containerRef,
      createArtboardAtDrag,
      document,
      draft,
      fillEnabled,
      imageMovePreview,
      layoutPreview,
      marquee,
      objects,
      patchActiveArtboard,
      patchArtboard,
      patchLayout,
      screenToCanvas,
      setFrameSelected,
      setImageDropTargetId,
      setImageSelected,
      setSelected,
      onBeginTextPlace,
      sorted,
      strokeColor,
      strokeWidth,
      textPlacementRef,
      transferImageToArtboard,
    ],
  );

  const onViewportPointerDown = useCallback(
    (e: React.PointerEvent, offset: { x: number; y: number }) => {
      if (e.button === 1 || (e.button === 0 && (e.altKey || spaceHeldRef.current))) {
        setPanning(true);
        dragRef.current = {
          kind: "pan",
          x: e.clientX,
          y: e.clientY,
          ox: offset.x,
          oy: offset.y,
        };
        containerRef.current?.setPointerCapture(e.pointerId);
        return true;
      }
      onPointerDown(e);
      return false;
    },
    [containerRef, onPointerDown, setPanning, spaceHeldRef],
  );

  const onViewportPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragRef.current?.kind === "pan") {
        dragRef.current = null;
        setPanning(false);
        containerRef.current?.releasePointerCapture(e.pointerId);
        return true;
      }
      onPointerUp(e);
      return false;
    },
    [containerRef, onPointerUp, setPanning],
  );

  return {
    onPointerMove,
    onViewportPointerDown,
    onViewportPointerUp,
    draft,
    marquee,
    artboardDraft,
    layoutPreview,
    artboardMovePreview,
    imageMovePreview,
    hoverCursor,
    setHoverCursor,
  };
}
