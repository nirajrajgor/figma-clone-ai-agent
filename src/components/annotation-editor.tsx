"use client";

import {
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Plus,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DESIGN_TOOLS, REVIEW_TOOLS } from "@/components/annotation-tools";
import { ArtboardTile } from "@/components/artboard-tile";
import {
  MarkupContextMenu,
  type MarkupContextMenuActions,
} from "@/components/markup-context-menu";
import { ActionTooltip } from "@/components/action-tooltip";
import { AnnotationInspector } from "@/components/annotation-inspector";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { useEditorSidebar } from "@/components/editor-sidebar-context";
import { CanvasSelectionOverlay } from "@/components/canvas-selection-overlay";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  addObject,
  addObjects,
  bringForward,
  duplicateObjects,
  moveObjects,
  removeObjects,
  sendBackward,
  sortByZIndex,
  updateObject,
  updateObjects,
} from "@/lib/markup/document";
import {
  copyToClipboard,
  pasteFromClipboard,
  type MarkupClipboard,
} from "@/lib/markup/clipboard";
import {
  formatModKey,
  formatShiftModKey,
  tooltipWithShortcut,
} from "@/lib/keyboard-shortcuts";
import {
  canGroup,
  canUngroup,
  expandSelectionIds,
  groupObjects,
  resolveCanvasSelection,
  ungroupObjects,
} from "@/lib/markup/groups";
import { hitTest, hitTestLeaf } from "@/lib/markup/hit-test";
import { layoutFromArtboard, layoutFromBlankArtboard, applyFillModeLayout, resolveImageFillMode, type ArtboardLayout, type ImageFillMode } from "@/lib/markup/artboard-layout";
import { artboardToImage, clientToArtboard, FRAME_LABEL_OFFSET, isInImageContent } from "@/lib/markup/artboard";
import {
  cropToStored,
  displayToIntrinsicCrop,
  isInCropArea,
  resolveImageCrop,
  type ImageCrop,
} from "@/lib/markup/image-crop";
import { DEVICE_PRESETS, type DevicePresetId } from "@/lib/markup/device-presets";
import { canvasToArtboardLocal, documentBounds, type ClientSessionDocument } from "@/lib/markup/session-document";
import type { TextInlineEditState } from "@/components/text-inline-editor";
import { useAnnotationPointer } from "@/hooks/use-annotation-pointer";
import { useSessionDocument } from "@/hooks/use-session-document";
import { apiSessionPath } from "@/lib/paths";
import { isTypingTarget } from "@/lib/utils";
import type { MarkupObject, MarkupTool, TextMarkup } from "@/lib/markup/types";
import { DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_STROKE_WIDTH, TOOL_SHORTCUTS } from "@/lib/markup/types";
import {
  commonProperty,
  fillShape,
  hasFillShape,
  hasRedact,
  hasStrokeCapable,
  isTextOnlySelection,
  fillColorFromObject,
  objectsForSelection,
  redactShape,
  strokeCapable,
} from "@/lib/markup/selection-properties";

type SessionActions = {
  onReplaceImage: (file: File) => void;
  onDeleteSession: () => void;
};

type Props = {
  workspace: string;
  project: string;
  sessionId: string;
  title: string;
  initialDocument: ClientSessionDocument;
  sessionActions?: SessionActions;
  inspectorOpen?: boolean;
};

export function AnnotationEditor({
  workspace,
  project,
  sessionId,
  title,
  initialDocument,
  sessionActions,
  inspectorOpen = true,
}: Props) {
  const apiBase = apiSessionPath(workspace, project, sessionId);
  const saveDocument = useCallback(
    async (doc: ClientSessionDocument) => {
      const res = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: {
            version: doc.version,
            activeArtboardId: doc.activeArtboardId,
            artboards: doc.artboards,
            images: {},
          },
        }),
      });
      return res.ok;
    },
    [apiBase],
  );

  const {
    document,
    activeArtboard,
    activeImage,
    layout,
    objects,
    commit,
    previewMarkup,
    undo,
    redo,
    selectArtboard,
    patchActiveArtboard,
    patchArtboard,
    addEmptyArtboard,
    addArtboardFromPreset,
    createArtboardAtDrag,
    transferImageToArtboard,
    artboardAtCanvasPoint,
    canUndo,
    canRedo,
    saveStatus,
  } = useSessionDocument(initialDocument, saveDocument);

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef(document);
  const textPlacementRef = useRef<{ x: number; y: number } | null>(null);
  const clipboardRef = useRef<MarkupClipboard>({ items: [] });
  const [contextMenuTargetIds, setContextMenuTargetIds] = useState<Set<string>>(() => new Set());
  const [clipboardReady, setClipboardReady] = useState(false);
  const [tool, setTool] = useState<MarkupTool>("select");
  const [strokeColor, setStrokeColor] = useState(DEFAULT_STROKE);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [fillEnabled, setFillEnabled] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [frameSelected, setFrameSelected] = useState(false);
  const [imageSelected, setImageSelected] = useState(false);
  const [imageDropTargetId, setImageDropTargetId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [textInlineEdit, setTextInlineEdit] = useState<TextInlineEditState | null>(null);
  const [cropSession, setCropSession] = useState<{ draft: ImageCrop; aspectLocked: boolean } | null>(
    null,
  );
  const [spaceHeld, setSpaceHeld] = useState(false);
  const spaceHeldRef = useRef(false);
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  const focusNewArtboard = useCallback(() => {
    setFrameSelected(true);
    setImageSelected(false);
    setSelected(new Set());
  }, []);

  const handleAddArtboard = useCallback(() => {
    addEmptyArtboard();
    focusNewArtboard();
  }, [addEmptyArtboard, focusNewArtboard]);

  const handleAddPresetArtboard = useCallback(
    (presetId: DevicePresetId) => {
      addArtboardFromPreset(presetId);
      focusNewArtboard();
    },
    [addArtboardFromPreset, focusNewArtboard],
  );

  const width = activeImage?.width ?? 0;
  const height = activeImage?.height ?? 0;
  const imageCrop = useMemo(() => {
    if (!activeArtboard) return { x: 0, y: 0, width: 0, height: 0 };
    if (!activeImage && layout) {
      return {
        x: 0,
        y: 0,
        width: layout.imageDisplayWidth,
        height: layout.imageDisplayHeight,
      };
    }
    return resolveImageCrop(activeArtboard, width, height);
  }, [activeArtboard, activeImage, layout, width, height]);

  const enterCropMode = useCallback(() => {
    if (!activeArtboard || !width || !height) return;
    setCropSession({ draft: imageCrop, aspectLocked: true });
    setSelected(new Set());
    setFrameSelected(false);
    setImageSelected(true);
    setTool("select");
    setTextInlineEdit(null);
  }, [activeArtboard, height, imageCrop, width]);

  const commitCrop = useCallback(() => {
    if (!cropSession) return;
    patchActiveArtboard(cropToStored(cropSession.draft));
    setCropSession(null);
  }, [cropSession, patchActiveArtboard]);

  const cancelCrop = useCallback(() => {
    setCropSession(null);
  }, []);

  const beginTextPlace = useCallback((x: number, y: number) => {
    setTextInlineEdit({ kind: "new", x, y });
  }, []);

  const commitInlineText = useCallback(
    (content: string) => {
      if (!textInlineEdit) return;
      const trimmed = content.trim();
      if (textInlineEdit.kind === "new") {
        if (!trimmed) {
          setTextInlineEdit(null);
          return;
        }
        const text: Omit<TextMarkup, "id" | "zIndex"> = {
          type: "text",
          x: textInlineEdit.x,
          y: textInlineEdit.y,
          content: trimmed,
          fontSize: 16,
          color: "#ffffff",
          bold: false,
          italic: false,
          backgroundEnabled: true,
          alignment: "left",
          strokeColor: DEFAULT_STROKE,
          strokeWidth: 0,
        };
        const stack = addObject(objects, text);
        commit(stack);
        const newId = stack[stack.length - 1]!.id;
        setSelected(new Set([newId]));
        setTool("select");
        setFrameSelected(false);
        setImageSelected(false);
      } else if (trimmed) {
        commit(updateObject(objects, textInlineEdit.id, { content: trimmed }));
      }
      setTextInlineEdit(null);
    },
    [commit, objects, textInlineEdit],
  );

  const cancelInlineText = useCallback(() => {
    setTextInlineEdit(null);
  }, []);

  const worldBounds = documentBounds(document);

  const doUndo = useCallback(() => {
    if (undo()) setSelected(new Set());
  }, [undo]);

  const doRedo = useCallback(() => {
    redo();
  }, [redo]);

  const zoomBy = useCallback((factor: number) => {
    setScale((s) => Math.min(8, Math.max(0.05, s * factor)));
  }, []);

  const zoomTo100 = useCallback(() => {
    const el = containerRef.current;
    const bounds = documentBounds(document);
    if (!el || !bounds.width) return;
    setScale(1);
    setOffset({
      x: (el.clientWidth - bounds.width) / 2 - bounds.x,
      y:
        FRAME_LABEL_OFFSET +
        (el.clientHeight - FRAME_LABEL_OFFSET - bounds.height) / 2 -
        bounds.y,
    });
  }, [document]);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      return clientToArtboard(clientX, clientY, el.getBoundingClientRect(), offset, scale);
    },
    [offset, scale],
  );

  const patchLayout = useCallback(
    (next: Partial<ArtboardLayout> & { imageFillMode?: ImageFillMode }) => {
      if (!layout || !activeArtboard) return;
      const mode = next.imageFillMode ?? resolveImageFillMode(activeArtboard);
      const artboardWidth = next.artboardWidth ?? layout.artboardWidth;
      const artboardHeight = next.artboardHeight ?? layout.artboardHeight;
      let imageOffsetX = next.imageOffsetX ?? layout.imageOffsetX;
      let imageOffsetY = next.imageOffsetY ?? layout.imageOffsetY;
      let imageDisplayWidth = next.imageDisplayWidth ?? layout.imageDisplayWidth;
      let imageDisplayHeight = next.imageDisplayHeight ?? layout.imageDisplayHeight;

      const shouldRecomputeImage = mode !== "crop" && activeImage;

      if (shouldRecomputeImage) {
        const imageLayout = applyFillModeLayout(
          mode,
          artboardWidth,
          artboardHeight,
          imageCrop.width,
          imageCrop.height,
        );
        imageOffsetX = imageLayout.imageOffsetX;
        imageOffsetY = imageLayout.imageOffsetY;
        imageDisplayWidth = imageLayout.imageDisplayWidth;
        imageDisplayHeight = imageLayout.imageDisplayHeight;
      }

      patchActiveArtboard({
        artboardWidth,
        artboardHeight,
        imageOffsetX,
        imageOffsetY,
        imageDisplayWidth,
        imageDisplayHeight,
        ...(next.imageFillMode != null ? { imageFillMode: next.imageFillMode } : {}),
      });
    },
    [activeArtboard, activeImage, imageCrop.height, imageCrop.width, layout, patchActiveArtboard],
  );

  const pointer = useAnnotationPointer(
    {
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
    },
    {
      tool,
      selected,
      imageSelected,
      scale,
      width,
      height,
      imageCrop,
      imageFillMode: activeArtboard ? resolveImageFillMode(activeArtboard) : "fit",
      cropActive: !!cropSession,
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
      onBeginTextPlace: beginTextPlace,
      setOffset,
      setPanning,
    },
  );

  const {
    draft,
    marquee,
    artboardDraft,
    layoutPreview,
    artboardMovePreview,
    imageMovePreview,
    hoverCursor,
    setHoverCursor,
    onPointerMove,
    onViewportPointerDown,
    onViewportPointerUp,
  } = pointer;

  const effectiveLayout = layoutPreview ?? layout;
  const artboardWidth = effectiveLayout?.artboardWidth ?? 640;
  const artboardHeight = effectiveLayout?.artboardHeight ?? 480;

  const clientToImagePoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!activeArtboard || !effectiveLayout) return null;
      const el = containerRef.current;
      if (!el) return null;
      const canvas = clientToArtboard(clientX, clientY, el.getBoundingClientRect(), offset, scale);
      const local = canvasToArtboardLocal(canvas.x, canvas.y, activeArtboard);
      const display = artboardToImage(
        local.x,
        local.y,
        effectiveLayout.imageOffsetX,
        effectiveLayout.imageOffsetY,
      );
      const pt = displayToIntrinsicCrop(
        display.x,
        display.y,
        imageCrop,
        effectiveLayout.imageDisplayWidth,
        effectiveLayout.imageDisplayHeight,
      );
      if (!isInCropArea(pt.x, pt.y, imageCrop)) return null;
      return pt;
    },
    [activeArtboard, effectiveLayout, height, imageCrop, offset, scale, width],
  );

  const prepareCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (cropSession || textInlineEdit || tool !== "select") {
        setContextMenuTargetIds(new Set());
        return;
      }
      const pt = clientToImagePoint(e.clientX, e.clientY);
      if (!pt) {
        setContextMenuTargetIds(new Set(selected));
        return;
      }
      const leafHit = hitTestLeaf(sortByZIndex(objects), pt.x, pt.y);
      if (leafHit) {
        const ids = resolveCanvasSelection(objects, selected, leafHit, e.shiftKey);
        setContextMenuTargetIds(ids);
        setFrameSelected(false);
        setImageSelected(false);
        setSelected(ids);
        return;
      }
      setContextMenuTargetIds(new Set(selected));
    },
    [clientToImagePoint, cropSession, objects, selected, textInlineEdit, tool],
  );

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (textInlineEdit || cropSession || tool !== "select") return;
      const pt = clientToImagePoint(e.clientX, e.clientY);
      if (!pt) return;
      const leafHit = hitTestLeaf(sortByZIndex(objects), pt.x, pt.y);
      if (leafHit) {
        const obj = objects.find((o) => o.id === leafHit);
        if (obj?.type === "text") {
          e.preventDefault();
          setTextInlineEdit({
            kind: "edit",
            id: obj.id,
            x: obj.x,
            y: obj.y,
            content: obj.content,
            fontSize: obj.fontSize,
          });
          setSelected(new Set([obj.id]));
          setFrameSelected(false);
          setImageSelected(false);
          return;
        }
        if (obj?.groupId) {
          e.preventDefault();
          setSelected(new Set([leafHit]));
          setFrameSelected(false);
          setImageSelected(false);
          return;
        }
        return;
      }
      if (isInImageContent(pt.x, pt.y, width, height)) {
        e.preventDefault();
        enterCropMode();
      }
    },
    [clientToImagePoint, cropSession, enterCropMode, objects, textInlineEdit, tool, width, height],
  );

  const duplicateIds = useCallback(
    (ids: Set<string>) => {
      if (ids.size === 0) return;
      const { stack, newIds } = duplicateObjects(objects, ids);
      commit(stack);
      setSelected(new Set(newIds));
    },
    [objects, commit],
  );

  const duplicateSelection = useCallback(() => {
    duplicateIds(selected);
  }, [duplicateIds, selected]);

  const applyGroup = useCallback(
    (targets: Set<string>) => {
      const { stack, groupId } = groupObjects(objects, targets);
      if (!groupId) return;
      commit(stack);
      setSelected(new Set([groupId]));
      setContextMenuTargetIds(new Set());
    },
    [commit, objects],
  );

  const applyUngroup = useCallback(
    (targets: Set<string>) => {
      commit(ungroupObjects(objects, targets));
      setSelected(new Set());
      setContextMenuTargetIds(new Set());
    },
    [commit, objects],
  );

  const groupSelection = useCallback(() => {
    applyGroup(selected);
  }, [applyGroup, selected]);

  const ungroupSelection = useCallback(() => {
    applyUngroup(selected);
  }, [applyUngroup, selected]);

  const copyIds = useCallback(
    (ids: Set<string>) => {
      const clip = copyToClipboard(objects, ids);
      if (clip.items.length === 0) return;
      clipboardRef.current = clip;
      setClipboardReady(true);
    },
    [objects],
  );

  const copySelection = useCallback(() => {
    copyIds(selected);
  }, [copyIds, selected]);

  const deleteIds = useCallback(
    (ids: Set<string>) => {
      if (ids.size === 0) return;
      commit(removeObjects(objects, ids));
      setSelected(new Set());
    },
    [commit, objects],
  );

  const editTextIds = useCallback(
    (ids: Set<string>) => {
      if (ids.size !== 1) return;
      const id = [...ids][0];
      const obj = objects.find((o) => o.id === id);
      if (obj?.type !== "text") return;
      setTextInlineEdit({
        kind: "edit",
        id: obj.id,
        x: obj.x,
        y: obj.y,
        content: obj.content,
        fontSize: obj.fontSize,
      });
      setSelected(new Set([id]));
      setFrameSelected(false);
      setImageSelected(false);
    },
    [objects],
  );

  const pasteClipboard = useCallback(() => {
    if (clipboardRef.current.items.length === 0) return;
    const { stack, newIds } = pasteFromClipboard(objects, clipboardRef.current);
    commit(stack);
    setSelected(new Set(newIds));
  }, [objects, commit]);

  const contextMenuActions = useMemo((): MarkupContextMenuActions => {
    const targets = contextMenuTargetIds.size > 0 ? contextMenuTargetIds : selected;
    const targetObjects = objects.filter((o) => targets.has(o.id));
    const singleText = targets.size === 1 && targetObjects[0]?.type === "text";

    return {
      canCopy: targets.size > 0,
      canPaste: clipboardReady,
      canDuplicate: targets.size > 0,
      canGroup: canGroup(objects, targets),
      canUngroup: canUngroup(objects, targets),
      canEditText: singleText,
      canLayerOrder: targets.size > 0,
      canDelete: targets.size > 0,
      onCopy: () => copyIds(targets),
      onPaste: pasteClipboard,
      onDuplicate: () => duplicateIds(targets),
      onGroup: () => applyGroup(targets),
      onUngroup: () => applyUngroup(targets),
      onEditText: () => editTextIds(targets),
      onBringForward: () => commit(bringForward(objects, targets)),
      onSendBackward: () => commit(sendBackward(objects, targets)),
      onDelete: () => deleteIds(targets),
    };
  }, [
    applyGroup,
    applyUngroup,
    clipboardReady,
    commit,
    contextMenuTargetIds,
    copyIds,
    deleteIds,
    duplicateIds,
    editTextIds,
    objects,
    pasteClipboard,
    selected,
  ]);

  const fit = useCallback(() => {
    const el = containerRef.current;
    const bounds = documentBounds(documentRef.current);
    if (!el || !bounds.width || !bounds.height) return;
    const pad = 24;
    const topPad = FRAME_LABEL_OFFSET;
    const s = Math.min(
      (el.clientWidth - pad * 2) / bounds.width,
      (el.clientHeight - pad - topPad) / bounds.height,
      1,
    );
    setScale(s);
    setOffset({
      x: (el.clientWidth - bounds.width * s) / 2 - bounds.x * s,
      y: topPad + (el.clientHeight - pad - topPad - bounds.height * s) / 2 - bounds.y * s,
    });
  }, []);

  useEffect(() => {
    fit();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit, document.artboards.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setScale((prevScale) => {
        const nextScale = Math.min(8, Math.max(0.05, prevScale * factor));
        setOffset((prevOffset) => ({
          x: mx - ((mx - prevOffset.x) / prevScale) * nextScale,
          y: my - ((my - prevOffset.y) / prevScale) * nextScale,
        }));
        return nextScale;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isTypingTarget(e.target)) return;
      e.preventDefault();
      spaceHeldRef.current = true;
      setSpaceHeld(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      spaceHeldRef.current = false;
      setSpaceHeld(false);
      setPanning(false);
    };
    const onBlur = () => {
      spaceHeldRef.current = false;
      setSpaceHeld(false);
      setPanning(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const focusEditor = () => {
    editorRef.current?.focus({ preventScroll: true });
  };

  const onEditorKeyDown = (e: React.KeyboardEvent) => {
    if (cropSession) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitCrop();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        cancelCrop();
        return;
      }
    }
    if (isTypingTarget(e.target) || textInlineEdit) return;

    const mod = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();

    if (mod && key === "z") {
      e.preventDefault();
      if (e.shiftKey) doRedo();
      else doUndo();
      return;
    }
    if (mod && key === "d") {
      e.preventDefault();
      duplicateSelection();
      return;
    }
    if (mod && key === "c") {
      e.preventDefault();
      copySelection();
      return;
    }
    if (mod && key === "v") {
      e.preventDefault();
      pasteClipboard();
      return;
    }
    if (mod && key === "g") {
      e.preventDefault();
      if (e.shiftKey) ungroupSelection();
      else groupSelection();
      return;
    }
    if (mod && e.key === "]") {
      if (selected.size === 0) return;
      e.preventDefault();
      commit(bringForward(objects, selected));
      return;
    }
    if (mod && e.key === "[") {
      if (selected.size === 0) return;
      e.preventDefault();
      commit(sendBackward(objects, selected));
      return;
    }
    if (!mod && TOOL_SHORTCUTS[key]) {
      e.preventDefault();
      setTool(TOOL_SHORTCUTS[key]);
      setSelected(new Set());
      setFrameSelected(false);
      setImageSelected(false);
      return;
    }
    if (key === "delete" || key === "backspace") {
      if (selected.size === 0) return;
      e.preventDefault();
      commit(removeObjects(objects, selected));
      setSelected(new Set());
      return;
    }
    if (key === "+" || key === "=") {
      e.preventDefault();
      zoomBy(1.15);
      return;
    }
    if (key === "-") {
      e.preventDefault();
      zoomBy(1 / 1.15);
      return;
    }
    if (key === "0") {
      e.preventDefault();
      fit();
      return;
    }
    if (key === "1") {
      e.preventDefault();
      zoomTo100();
      return;
    }
    if (tool === "select" && selected.size > 0 && !mod) {
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "ArrowUp") dy = -step;
      else if (e.key === "ArrowDown") dy = step;
      else return;
      e.preventDefault();
      commit(moveObjects(objects, selected, dx, dy));
    }
  };

  const selectedObject =
    selected.size === 1 ? objects.find((o) => o.id === [...selected][0]) : undefined;
  const selectedText = selectedObject?.type === "text" ? selectedObject : undefined;
  const selectedObjects = useMemo(
    () => objectsForSelection(objects, selected),
    [objects, selected],
  );
  const editingSelection = tool === "select" && selectedObjects.length > 0;
  const showSessionPanel =
    !!sessionActions && tool === "select" && selected.size === 0 && !frameSelected && !imageSelected;
  const showFramePanel =
    tool === "select" && (frameSelected || imageSelected) && selected.size === 0;
  const showMarkupPanel = (tool !== "select" || selected.size > 0) && !showFramePanel;

  const showStroke =
    !isTextOnlySelection(selectedObjects) &&
    (editingSelection ? hasStrokeCapable(selectedObjects) : tool !== "text" && tool !== "redact");
  const showFillToggle =
    editingSelection
      ? hasFillShape(selectedObjects)
      : tool === "rectangle" || tool === "ellipse";
  const showFillColor =
    editingSelection
      ? hasFillShape(selectedObjects) || hasRedact(selectedObjects)
      : tool === "rectangle" || tool === "ellipse";

  const inspectorStrokeColor =
    (editingSelection
      ? commonProperty(selectedObjects, (o) => (strokeCapable(o) ? o.strokeColor : undefined))
      : undefined) ?? strokeColor;
  const commonStrokeWidth = editingSelection
    ? commonProperty(selectedObjects, (o) => (strokeCapable(o) ? o.strokeWidth : undefined))
    : undefined;
  const inspectorStrokeWidth: number | "" =
    editingSelection && hasStrokeCapable(selectedObjects) && commonStrokeWidth === undefined
      ? ""
      : (commonStrokeWidth ?? strokeWidth);
  const inspectorFillEnabled =
    (editingSelection
      ? commonProperty(selectedObjects, (o) =>
          o.type === "rectangle" || o.type === "ellipse" ? o.fillEnabled : undefined,
        )
      : undefined) ?? fillEnabled;
  const inspectorFillColor =
    (editingSelection ? commonProperty(selectedObjects, fillColorFromObject) : undefined) ??
    DEFAULT_FILL;

  useEffect(() => {
    if (tool !== "select" || selected.size !== 1) return;
    const obj = objects.find((o) => o.id === [...selected][0]);
    if (!obj || obj.type === "text") return;
    if (obj.type === "redact") return;
    setStrokeColor(obj.strokeColor);
    setStrokeWidth(obj.strokeWidth);
    if (obj.type === "rectangle" || obj.type === "ellipse") {
      setFillEnabled(obj.fillEnabled);
    }
  }, [selected, objects, tool]);

  const patchSelection = useCallback(
    (patch: Partial<MarkupObject>, predicate?: (o: MarkupObject) => boolean) => {
      commit(updateObjects(objects, selected, patch, predicate));
    },
    [commit, objects, selected],
  );

  const handleStrokeColorChange = useCallback(
    (color: string) => {
      setStrokeColor(color);
      if (editingSelection) patchSelection({ strokeColor: color }, strokeCapable);
    },
    [editingSelection, patchSelection],
  );

  const handleStrokeWidthChange = useCallback(
    (width: number) => {
      if (!Number.isFinite(width)) return;
      setStrokeWidth(width);
      if (editingSelection) patchSelection({ strokeWidth: width }, strokeCapable);
    },
    [editingSelection, patchSelection],
  );

  const handleFillEnabledChange = useCallback(
    (enabled: boolean) => {
      setFillEnabled(enabled);
      if (editingSelection) patchSelection({ fillEnabled: enabled }, fillShape);
    },
    [editingSelection, patchSelection],
  );

  const handleFillColorChange = useCallback(
    (color: string) => {
      if (editingSelection) {
        let next = updateObjects(objects, selected, { fillColor: color }, fillShape);
        next = updateObjects(
          next,
          selected,
          { fillColor: color, strokeColor: color },
          redactShape,
        );
        commit(next);
      }
    },
    [commit, editingSelection, objects, selected],
  );

  const handleSelectLayer = useCallback(
    (id: string, additive: boolean) => {
      setTool("select");
      setFrameSelected(false);
      setImageSelected(false);
      setSelected((prev) => {
        if (additive) {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }
        return new Set([id]);
      });
      editorRef.current?.focus({ preventScroll: true });
    },
    [],
  );

  const handleSelectFrame = useCallback(
    (artboardId: string) => {
      if (artboardId !== document.activeArtboardId) selectArtboard(artboardId);
      setTool("select");
      setFrameSelected(true);
      setImageSelected(false);
      setSelected(new Set());
    },
    [document.activeArtboardId, selectArtboard],
  );

  const handleSelectImage = useCallback(
    (artboardId: string) => {
      if (artboardId !== document.activeArtboardId) selectArtboard(artboardId);
      setTool("select");
      setFrameSelected(false);
      setImageSelected(true);
      setSelected(new Set());
    },
    [document.activeArtboardId, selectArtboard],
  );

  const prepareLayerContextMenu = useCallback(
    (id: string) => {
      const rowInSelection = selected.has(id);
      const targets =
        rowInSelection && selected.size > 1 ? new Set(selected) : new Set([id]);
      setContextMenuTargetIds(targets);
    },
    [selected],
  );

  const { setLayers } = useEditorSidebar();
  useEffect(() => {
    setLayers({
      artboards: document.artboards.map((board) => ({
        id: board.id,
        title: board.title,
        hasImage: !!board.imageId,
        objects: board.id === document.activeArtboardId ? objects : board.markupStack,
        isActive: board.id === document.activeArtboardId,
      })),
      activeArtboardId: document.activeArtboardId,
      selectedIds: selected,
      frameSelected,
      imageSelected,
      onSelectFrame: handleSelectFrame,
      onSelectImage: handleSelectImage,
      onSelectLayer: handleSelectLayer,
      onLayerContextMenu: prepareLayerContextMenu,
      contextMenuActions,
    });
    return () => setLayers(null);
  }, [
    contextMenuActions,
    document.activeArtboardId,
    document.artboards,
    frameSelected,
    handleSelectFrame,
    handleSelectImage,
    handleSelectLayer,
    imageSelected,
    objects,
    prepareLayerContextMenu,
    selected,
    setLayers,
  ]);

  const selectedIds = useMemo(() => [...selected], [selected]);

  const zoomPercent = Math.round(scale * 100);

  return (
    <div
      ref={editorRef}
      className="flex h-full min-h-0 outline-none"
      tabIndex={-1}
      data-testid="annotation-editor"
      onKeyDown={onEditorKeyDown}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b bg-background px-3 py-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <div
              className="flex items-center"
              data-testid="tool-toolbar"
            >
              {(
                [
                  { tools: DESIGN_TOOLS, tooltipPrefix: undefined },
                  { tools: REVIEW_TOOLS, tooltipPrefix: "Review" },
                ] as const
              ).map(({ tools, tooltipPrefix }, groupIndex) => (
                <span key={tooltipPrefix ?? "design"} className="contents">
                  {groupIndex > 0 ? (
                    <Separator orientation="vertical" className="mx-1 h-5" />
                  ) : null}
                  <ToggleGroup
                    value={[tool]}
                    onValueChange={(v) => {
                      if (v.length === 0) return;
                      setTool(v[0] as MarkupTool);
                      setSelected(new Set());
                      setFrameSelected(false);
                      setImageSelected(false);
                    }}
                    variant="outline"
                    size="sm"
                    spacing={0}
                  >
                    {tools.map((t) => (
                      <ActionTooltip
                        key={t.id}
                        label={
                          tooltipPrefix
                            ? `${tooltipPrefix} — ${t.label} (${t.shortcut})`
                            : `${t.label} (${t.shortcut})`
                        }
                      >
                        <ToggleGroupItem
                          value={t.id}
                          aria-label={t.label}
                          data-testid={`tool-${t.id}`}
                        >
                          {t.icon}
                        </ToggleGroupItem>
                      </ActionTooltip>
                    ))}
                  </ToggleGroup>
                </span>
              ))}
            </div>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <div className="inline-flex items-stretch">
              <ActionTooltip label="Add artboard">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-r-none"
                  data-testid="add-artboard"
                  aria-label="Add artboard"
                  onClick={handleAddArtboard}
                >
                  <Plus className="size-4" />
                </Button>
              </ActionTooltip>
              <DropdownMenu>
                <ActionTooltip label="Add device frame preset">
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-6 shrink-0 rounded-l-none px-0"
                        aria-label="Add device frame preset"
                        data-testid="add-device-frame-menu"
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                    }
                  />
                </ActionTooltip>
                <DropdownMenuContent align="start">
                  {DEVICE_PRESETS.map((preset) => (
                    <DropdownMenuItem
                      key={preset.id}
                      data-testid={`add-device-frame-${preset.id}`}
                      onClick={() => handleAddPresetArtboard(preset.id)}
                    >
                      {preset.label} ({preset.width}×{preset.height})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ActionTooltip label={tooltipWithShortcut("Undo", formatModKey("Z"))} disabled={!canUndo}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                data-testid="undo"
                aria-label="Undo"
                disabled={!canUndo}
                onClick={doUndo}
              >
                <Undo2 className="size-4" />
              </Button>
            </ActionTooltip>
            <ActionTooltip
              label={tooltipWithShortcut("Redo", formatShiftModKey("Z"))}
              disabled={!canRedo}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                data-testid="redo"
                aria-label="Redo"
                disabled={!canRedo}
                onClick={doRedo}
              >
                <Redo2 className="size-4" />
              </Button>
            </ActionTooltip>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ActionTooltip label={tooltipWithShortcut("Bring forward", formatModKey("]"))}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                data-testid="bring-forward"
                aria-label="Bring forward"
                onClick={() => commit(bringForward(objects, selected))}
              >
                <ArrowUp className="size-4" />
              </Button>
            </ActionTooltip>
            <ActionTooltip label={tooltipWithShortcut("Send backward", formatModKey("["))}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                data-testid="send-back"
                aria-label="Send backward"
                onClick={() => commit(sendBackward(objects, selected))}
              >
                <ArrowDown className="size-4" />
              </Button>
            </ActionTooltip>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <KeyboardShortcutsDialog />
          </div>
          <ActionTooltip
            label={
              saveStatus === "saving"
                ? "Saving changes to the team instance"
                : saveStatus === "error"
                  ? "Could not save — retry by editing"
                  : "All changes saved"
            }
          >
            <span
              className="cursor-default text-xs text-muted-foreground"
              data-testid="save-status"
              aria-live="polite"
            >
              {saveStatus === "saving" && "Saving…"}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "error" && "Save failed"}
            </span>
          </ActionTooltip>
        </header>
        <MarkupContextMenu
          actions={contextMenuActions}
          onContextMenu={prepareCanvasContextMenu}
          triggerRef={containerRef}
          triggerClassName={`relative min-h-0 flex-1 overflow-hidden bg-[#e5e5e5] dark:bg-[#2c2c2c] ${spaceHeld ? (panning ? "cursor-grabbing" : "cursor-grab") : ""}`}
          style={!spaceHeld && hoverCursor ? { cursor: hoverCursor } : undefined}
          onPointerLeave={() => setHoverCursor(null)}
          data-testid="canvas-viewport"
          onDoubleClick={handleCanvasDoubleClick}
          onPointerDown={(e) => {
            if (textInlineEdit || cropSession) return;
            focusEditor();
            onViewportPointerDown(e, offset);
          }}
          onPointerMove={(e) => {
            if (textInlineEdit || cropSession) return;
            onPointerMove(e);
          }}
          onPointerUp={(e) => {
            if (textInlineEdit || cropSession) return;
            onViewportPointerUp(e);
          }}
        >
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
          data-testid="canvas-transform-layer"
        >
          {artboardDraft && (
            <svg
              className="absolute left-0 top-0 pointer-events-none overflow-visible"
              width={worldBounds.width + worldBounds.x + 200}
              height={worldBounds.height + worldBounds.y + 200}
            >
              <CanvasSelectionOverlay
                scope="artboard"
                objects={[]}
                selected={new Set()}
                tool={tool}
                scale={scale}
                layout={{
                  artboardWidth: Math.abs(artboardDraft.x2 - artboardDraft.x1),
                  artboardHeight: Math.abs(artboardDraft.y2 - artboardDraft.y1),
                  imageOffsetX: 48,
                  imageOffsetY: 48,
                  imageDisplayWidth: 640,
                  imageDisplayHeight: 480,
                }}
                artboardDraft={artboardDraft}
              />
            </svg>
          )}
          {document.artboards.map((artboard) => {
            const isActive = artboard.id === document.activeArtboardId;
            const image = artboard.imageId ? document.images[artboard.imageId] : null;
            const imgW = image?.width ?? 0;
            const imgH = image?.height ?? 0;
            const resolvedCrop = image ? resolveImageCrop(artboard, imgW, imgH) : null;
            let boardLayout = image
              ? layoutFromArtboard(artboard, imgW, imgH, resolvedCrop.width, resolvedCrop.height)
              : layoutFromBlankArtboard(artboard);
            if (isActive && layoutPreview) boardLayout = layoutPreview;
            const boardImageCrop = resolvedCrop ?? {
              x: 0,
              y: 0,
              width: boardLayout.imageDisplayWidth,
              height: boardLayout.imageDisplayHeight,
            };
            if (isActive && imageMovePreview?.artboardId === artboard.id) {
              boardLayout = {
                ...boardLayout,
                imageOffsetX: imageMovePreview.imageOffsetX,
                imageOffsetY: imageMovePreview.imageOffsetY,
              };
            }
            const boardX =
              isActive && artboardMovePreview ? artboardMovePreview.x : artboard.x;
            const boardY =
              isActive && artboardMovePreview ? artboardMovePreview.y : artboard.y;
            const boardObjects = isActive ? objects : artboard.markupStack;
            return (
              <ArtboardTile
                key={artboard.id}
                artboard={artboard}
                image={image}
                imgW={imgW}
                imgH={imgH}
                imageCrop={boardImageCrop}
                isActive={isActive}
                boardLayout={boardLayout}
                boardX={boardX}
                boardY={boardY}
                boardObjects={boardObjects}
                imageDropTargetId={imageDropTargetId}
                tool={tool}
                scale={scale}
                selectedIds={isActive ? selectedIds : []}
                frameSelected={frameSelected}
                imageSelected={imageSelected}
                draft={isActive ? draft : null}
                marquee={isActive ? marquee : null}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                fillEnabled={fillEnabled}
                textInlineEdit={isActive ? textInlineEdit : null}
                cropEditing={isActive && !!cropSession}
                cropDraft={isActive ? cropSession?.draft ?? null : null}
                cropAspectLocked={cropSession?.aspectLocked ?? true}
                onCropChange={(draft) =>
                  setCropSession((prev) => (prev ? { ...prev, draft } : prev))
                }
                onInlineTextCommit={commitInlineText}
                onInlineTextCancel={cancelInlineText}
              />
            );
          })}
        </div>
      </MarkupContextMenu>
        <footer
          className="flex h-9 shrink-0 items-center justify-between border-t bg-background px-3"
          data-testid="canvas-zoom-bar"
        >
          <span className="text-xs text-muted-foreground">Space or Alt+drag to pan</span>
          <div className="flex items-center gap-1">
            <ActionTooltip label="Zoom out (-)">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Zoom out"
                onClick={() => zoomBy(1 / 1.15)}
              >
                <ZoomOut className="size-4" />
              </Button>
            </ActionTooltip>
            <ActionTooltip label={`Zoom ${zoomPercent}%`}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-w-14 tabular-nums"
                data-testid="zoom-percent"
                onClick={zoomTo100}
              >
                {zoomPercent}%
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Zoom in (+)">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Zoom in"
                onClick={() => zoomBy(1.15)}
              >
                <ZoomIn className="size-4" />
              </Button>
            </ActionTooltip>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ActionTooltip label="Fit image to viewport (0)">
              <Button type="button" variant="ghost" size="sm" onClick={fit}>
                Fit
              </Button>
            </ActionTooltip>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {document.artboards.length} artboard{document.artboards.length === 1 ? "" : "s"} · Frame{" "}
            {artboardWidth} × {artboardHeight}
          </span>
        </footer>
      </div>
      {inspectorOpen && (
        <AnnotationInspector
          document={document}
          title={title}
          activeArtboardTitle={activeArtboard?.title}
          layout={effectiveLayout}
          activeImage={activeImage}
          tool={tool}
          editingSelection={editingSelection}
          strokeColor={inspectorStrokeColor}
          strokeWidth={inspectorStrokeWidth}
          fillEnabled={inspectorFillEnabled}
          fillColor={inspectorFillColor}
          showStroke={showStroke}
          showFillToggle={showFillToggle}
          showFillColor={showFillColor}
          objects={objects}
          selectedText={selectedText}
          showSessionPanel={showSessionPanel}
          showFramePanel={showFramePanel}
          showMarkupPanel={showMarkupPanel}
          sessionActions={sessionActions}
          onSelectArtboard={(id) => {
            selectArtboard(id);
            setFrameSelected(true);
            setImageSelected(false);
            setSelected(new Set());
          }}
          onAddArtboard={handleAddArtboard}
          onPatchLayout={patchLayout}
          onPatchArtboard={patchActiveArtboard}
          onStrokeColorChange={handleStrokeColorChange}
          onStrokeWidthChange={handleStrokeWidthChange}
          onFillEnabledChange={handleFillEnabledChange}
          onFillColorChange={handleFillColorChange}
          onCommit={commit}
          cropEditing={!!cropSession}
          cropAspectLocked={cropSession?.aspectLocked ?? true}
          onEnterCrop={enterCropMode}
          onCommitCrop={commitCrop}
          onCancelCrop={cancelCrop}
          onCropAspectLockedChange={(locked) =>
            setCropSession((prev) => (prev ? { ...prev, aspectLocked: locked } : prev))
          }
        />
      )}
    </div>
  );
}
