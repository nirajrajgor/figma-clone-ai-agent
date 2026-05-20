import { newMarkupId } from "./document";
import type { MarkupObject } from "./types";
import { FRAME_PADDING } from "./artboard";
import {
  artboardLayoutFromDrag,
  DEFAULT_IMAGE_FILL_MODE,
  layoutsMatchFillMode,
  type ImageFillMode,
  defaultArtboardLayout,
} from "./artboard-layout";
import { resolveImageCrop } from "./image-crop";

export const SESSION_DOCUMENT_VERSION = 1 as const;

type StoredImageAsset = {
  id: string;
  path: string;
  mime: string;
  width: number;
  height: number;
};

export type StoredArtboard = {
  id: string;
  title: string;
  x: number;
  y: number;
  artboardWidth: number;
  artboardHeight: number;
  imageOffsetX: number;
  imageOffsetY: number;
  imageDisplayWidth?: number | null;
  imageDisplayHeight?: number | null;
  imageCropX?: number | null;
  imageCropY?: number | null;
  imageCropWidth?: number | null;
  imageCropHeight?: number | null;
  /** 0–100; omitted means fully opaque. */
  imageOpacity?: number | null;
  /** Uniform corner radius (px) on the frame content clip region. */
  frameCornerRadius?: number | null;
  imageFillMode?: ImageFillMode | null;
  imageId: string | null;
  markupStack: MarkupObject[];
};

export const DEFAULT_IMAGE_OPACITY = 100;

export function resolveImageOpacity(
  artboard: Pick<StoredArtboard, "imageOpacity">,
): number {
  const value = artboard.imageOpacity ?? DEFAULT_IMAGE_OPACITY;
  return Math.min(100, Math.max(0, value));
}

export function resolveFrameCornerRadius(
  artboard: Pick<StoredArtboard, "frameCornerRadius">,
): number {
  const value = artboard.frameCornerRadius ?? 0;
  return Math.max(0, value);
}

export type StoredSessionDocument = {
  version: typeof SESSION_DOCUMENT_VERSION;
  artboards: StoredArtboard[];
  images: Record<string, StoredImageAsset>;
  activeArtboardId: string;
};

type ClientImageAsset = {
  id: string;
  url: string;
  width: number;
  height: number;
};

export type ClientSessionDocument = {
  version: typeof SESSION_DOCUMENT_VERSION;
  artboards: StoredArtboard[];
  images: Record<string, ClientImageAsset>;
  activeArtboardId: string;
};

const DEFAULT_EMPTY_FRAME = { width: 640, height: 480 };

export function createInitialSessionDocument(
  title: string,
  imageAsset: StoredImageAsset,
): StoredSessionDocument {
  const artboardId = newMarkupId();
  const layout = defaultArtboardLayout(imageAsset.width, imageAsset.height);
  return {
    version: SESSION_DOCUMENT_VERSION,
    activeArtboardId: artboardId,
    images: { [imageAsset.id]: imageAsset },
    artboards: [
      {
        id: artboardId,
        title,
        x: 0,
        y: 0,
        artboardWidth: layout.artboardWidth,
        artboardHeight: layout.artboardHeight,
        imageOffsetX: layout.imageOffsetX,
        imageOffsetY: layout.imageOffsetY,
        imageDisplayWidth: imageAsset.width,
        imageDisplayHeight: imageAsset.height,
        imageFillMode: DEFAULT_IMAGE_FILL_MODE,
        imageId: imageAsset.id,
        markupStack: [],
      },
    ],
  };
}

export function requireSessionDocument(
  document: StoredSessionDocument | null | undefined,
): StoredSessionDocument {
  if (document?.version === SESSION_DOCUMENT_VERSION && document.artboards.length > 0) {
    return document;
  }
  throw new Error("Session document is missing or invalid");
}

export function imagePathsInDocument(document: StoredSessionDocument): string[] {
  return Object.values(document.images).map((image) => image.path);
}

export function getActiveArtboard<T extends Pick<StoredSessionDocument, "artboards" | "activeArtboardId">>(
  document: T,
) {
  return (
    document.artboards.find((a) => a.id === document.activeArtboardId) ??
    document.artboards[0]
  );
}

export function activeMarkupStack(document: Pick<StoredSessionDocument, "artboards" | "activeArtboardId">) {
  return getActiveArtboard(document)?.markupStack ?? [];
}

function nextArtboardTitle(artboards: StoredArtboard[]) {
  return `Frame ${artboards.length + 1}`;
}

export function createEmptyArtboard(
  artboards: StoredArtboard[],
  x: number,
  y: number,
  size = DEFAULT_EMPTY_FRAME,
): StoredArtboard {
  const id = newMarkupId();
  return {
    id,
    title: nextArtboardTitle(artboards),
    x,
    y,
    artboardWidth: size.width,
    artboardHeight: size.height,
    imageOffsetX: FRAME_PADDING,
    imageOffsetY: FRAME_PADDING,
    imageId: null,
    markupStack: [],
  };
}

export function boundsFromDrag(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

export function createArtboardFromDrag(
  artboards: StoredArtboard[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): StoredArtboard {
  const { x, y } = boundsFromDrag(x1, y1, x2, y2);
  const layout = artboardLayoutFromDrag(x1, y1, x2, y2);
  return {
    id: newMarkupId(),
    title: nextArtboardTitle(artboards),
    x,
    y,
    artboardWidth: layout.artboardWidth,
    artboardHeight: layout.artboardHeight,
    imageOffsetX: layout.imageOffsetX,
    imageOffsetY: layout.imageOffsetY,
    imageId: null,
    markupStack: [],
  };
}

export function placementForNewArtboard(artboards: StoredArtboard[]) {
  if (artboards.length === 0) return { x: 0, y: 0 };
  const right = Math.max(...artboards.map((a) => a.x + a.artboardWidth));
  const top = Math.min(...artboards.map((a) => a.y));
  return { x: right + 80, y: top };
}

export function documentBounds(document: Pick<StoredSessionDocument, "artboards">) {
  if (document.artboards.length === 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
  const minX = Math.min(...document.artboards.map((a) => a.x));
  const minY = Math.min(...document.artboards.map((a) => a.y));
  const maxX = Math.max(...document.artboards.map((a) => a.x + a.artboardWidth));
  const maxY = Math.max(...document.artboards.map((a) => a.y + a.artboardHeight));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function findArtboardAt(
  document: Pick<StoredSessionDocument, "artboards">,
  canvasX: number,
  canvasY: number,
) {
  for (let i = document.artboards.length - 1; i >= 0; i -= 1) {
    const artboard = document.artboards[i];
    if (
      canvasX >= artboard.x &&
      canvasX <= artboard.x + artboard.artboardWidth &&
      canvasY >= artboard.y &&
      canvasY <= artboard.y + artboard.artboardHeight
    ) {
      return artboard;
    }
  }
  return null;
}

/** Drop target when dragging a base image between artboards (pointer or last hover). */
export function resolveImageDropTarget(
  document: Pick<StoredSessionDocument, "artboards">,
  canvasX: number,
  canvasY: number,
  sourceArtboardId: string,
  hoverArtboardId?: string | null,
) {
  const atPointer = findArtboardAt(document, canvasX, canvasY);
  if (atPointer && atPointer.id !== sourceArtboardId) return atPointer;
  if (hoverArtboardId && hoverArtboardId !== sourceArtboardId) {
    return document.artboards.find((a) => a.id === hoverArtboardId) ?? null;
  }
  return null;
}

export function canvasToArtboardLocal(
  canvasX: number,
  canvasY: number,
  artboard: Pick<StoredArtboard, "x" | "y">,
) {
  return { x: canvasX - artboard.x, y: canvasY - artboard.y };
}

export function moveImageBetweenArtboards<T extends {
  version: typeof SESSION_DOCUMENT_VERSION;
  artboards: StoredArtboard[];
  images: Record<string, { width: number; height: number }>;
  activeArtboardId: string;
}>(
  document: T,
  sourceArtboardId: string,
  targetArtboardId: string,
): T {
  if (sourceArtboardId === targetArtboardId) return document;
  const source = document.artboards.find((a) => a.id === sourceArtboardId);
  const target = document.artboards.find((a) => a.id === targetArtboardId);
  if (!source?.imageId || !target) return document;

  const image = document.images[source.imageId];
  if (!image) return document;

  const nextArtboards = document.artboards.map((artboard) => {
    if (artboard.id === sourceArtboardId) {
      return {
        ...artboard,
        imageId: null,
        markupStack: [],
        imageOffsetX: FRAME_PADDING,
        imageOffsetY: FRAME_PADDING,
      };
    }
    if (artboard.id === targetArtboardId) {
      const centered = defaultArtboardLayout(image.width, image.height);
      return {
        ...artboard,
        imageId: source.imageId,
        markupStack: [],
        artboardWidth: Math.max(artboard.artboardWidth, centered.artboardWidth),
        artboardHeight: Math.max(artboard.artboardHeight, centered.artboardHeight),
        imageOffsetX: centered.imageOffsetX,
        imageOffsetY: centered.imageOffsetY,
        imageDisplayWidth: image.width,
        imageDisplayHeight: image.height,
        imageFillMode: DEFAULT_IMAGE_FILL_MODE,
        imageCropX: null,
        imageCropY: null,
        imageCropWidth: null,
        imageCropHeight: null,
      };
    }
    return artboard;
  });

  return {
    ...document,
    artboards: nextArtboards,
    activeArtboardId: targetArtboardId,
  };
}

export function updateArtboardInDocument<T extends Pick<StoredSessionDocument, "artboards">>(
  document: T,
  artboardId: string,
  patch: Partial<StoredArtboard>,
): T {
  return {
    ...document,
    artboards: document.artboards.map((artboard) =>
      artboard.id === artboardId ? { ...artboard, ...patch } : artboard,
    ),
  };
}

/** Infer fill mode for legacy artboards missing imageFillMode. */
export function migrateArtboardFillMode(
  artboard: StoredArtboard,
  image: { width: number; height: number } | null | undefined,
): ImageFillMode {
  if (artboard.imageFillMode) return artboard.imageFillMode;
  if (!image) return DEFAULT_IMAGE_FILL_MODE;
  const crop = resolveImageCrop(artboard, image.width, image.height);
  const layout = {
    imageOffsetX: artboard.imageOffsetX ?? FRAME_PADDING,
    imageOffsetY: artboard.imageOffsetY ?? FRAME_PADDING,
    imageDisplayWidth: artboard.imageDisplayWidth ?? image.width,
    imageDisplayHeight: artboard.imageDisplayHeight ?? image.height,
  };
  if (
    layoutsMatchFillMode(
      "fit",
      artboard.artboardWidth,
      artboard.artboardHeight,
      crop.width,
      crop.height,
      layout,
    )
  ) {
    return "fit";
  }
  if (
    layoutsMatchFillMode(
      "fill",
      artboard.artboardWidth,
      artboard.artboardHeight,
      crop.width,
      crop.height,
      layout,
    )
  ) {
    return "fill";
  }
  return "crop";
}

export function normalizeSessionDocument(document: StoredSessionDocument): StoredSessionDocument {
  return {
    ...document,
    artboards: document.artboards.map((artboard) => {
      const image = artboard.imageId ? document.images[artboard.imageId] : null;
      const imageFillMode = migrateArtboardFillMode(artboard, image);
      if (artboard.imageFillMode === imageFillMode) return artboard;
      return { ...artboard, imageFillMode };
    }),
  };
}
