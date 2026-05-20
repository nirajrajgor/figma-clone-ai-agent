import type { Bounds, ResizeHandle } from "./bounds";
import { FRAME_PADDING } from "./artboard";

export type ImageFillMode = "fill" | "fit" | "crop";

export const DEFAULT_IMAGE_FILL_MODE: ImageFillMode = "fit";

export type ArtboardLayout = {
  artboardWidth: number;
  artboardHeight: number;
  imageOffsetX: number;
  imageOffsetY: number;
  imageDisplayWidth: number;
  imageDisplayHeight: number;
};

export type StoredArtboardLayout = {
  artboardWidth?: number | null;
  artboardHeight?: number | null;
  imageOffsetX?: number | null;
  imageOffsetY?: number | null;
  imageDisplayWidth?: number | null;
  imageDisplayHeight?: number | null;
  imageFillMode?: ImageFillMode | null;
};

export const MIN_ARTBOARD_SIZE = 120;
export const MIN_IMAGE_DISPLAY_SIZE = 8;

const MIN_MARGIN = 16;
const LAYOUT_TOLERANCE = 1;

export function resolveImageFillMode(
  stored: Pick<StoredArtboardLayout, "imageFillMode"> | null | undefined,
): ImageFillMode {
  return stored?.imageFillMode ?? DEFAULT_IMAGE_FILL_MODE;
}

function contentArea(artboardWidth: number, artboardHeight: number) {
  return {
    x: FRAME_PADDING,
    y: FRAME_PADDING,
    width: Math.max(MIN_IMAGE_DISPLAY_SIZE, artboardWidth - FRAME_PADDING * 2),
    height: Math.max(MIN_IMAGE_DISPLAY_SIZE, artboardHeight - FRAME_PADDING * 2),
  };
}

/** Fit (contain): scale crop region to fit inside frame padding, centered. */
export function computeFitImageLayout(
  artboardWidth: number,
  artboardHeight: number,
  cropWidth: number,
  cropHeight: number,
): Pick<ArtboardLayout, "imageOffsetX" | "imageOffsetY" | "imageDisplayWidth" | "imageDisplayHeight"> {
  if (!cropWidth || !cropHeight) {
    return {
      imageOffsetX: FRAME_PADDING,
      imageOffsetY: FRAME_PADDING,
      imageDisplayWidth: MIN_IMAGE_DISPLAY_SIZE,
      imageDisplayHeight: MIN_IMAGE_DISPLAY_SIZE,
    };
  }
  const area = contentArea(artboardWidth, artboardHeight);
  const scale = Math.min(area.width / cropWidth, area.height / cropHeight);
  const imageDisplayWidth = cropWidth * scale;
  const imageDisplayHeight = cropHeight * scale;
  return {
    imageOffsetX: area.x + (area.width - imageDisplayWidth) / 2,
    imageOffsetY: area.y + (area.height - imageDisplayHeight) / 2,
    imageDisplayWidth,
    imageDisplayHeight,
  };
}

/** Fill (cover): scale crop region to cover frame padding area, centered, overflow clipped. */
export function computeFillImageLayout(
  artboardWidth: number,
  artboardHeight: number,
  cropWidth: number,
  cropHeight: number,
): Pick<ArtboardLayout, "imageOffsetX" | "imageOffsetY" | "imageDisplayWidth" | "imageDisplayHeight"> {
  if (!cropWidth || !cropHeight) {
    return {
      imageOffsetX: FRAME_PADDING,
      imageOffsetY: FRAME_PADDING,
      imageDisplayWidth: MIN_IMAGE_DISPLAY_SIZE,
      imageDisplayHeight: MIN_IMAGE_DISPLAY_SIZE,
    };
  }
  const area = contentArea(artboardWidth, artboardHeight);
  const scale = Math.max(area.width / cropWidth, area.height / cropHeight);
  const imageDisplayWidth = cropWidth * scale;
  const imageDisplayHeight = cropHeight * scale;
  return {
    imageOffsetX: area.x + (area.width - imageDisplayWidth) / 2,
    imageOffsetY: area.y + (area.height - imageDisplayHeight) / 2,
    imageDisplayWidth,
    imageDisplayHeight,
  };
}

export function applyFillModeLayout(
  mode: ImageFillMode,
  artboardWidth: number,
  artboardHeight: number,
  cropWidth: number,
  cropHeight: number,
  stored?: Pick<
    ArtboardLayout,
    "imageOffsetX" | "imageOffsetY" | "imageDisplayWidth" | "imageDisplayHeight"
  >,
): Pick<ArtboardLayout, "imageOffsetX" | "imageOffsetY" | "imageDisplayWidth" | "imageDisplayHeight"> {
  if (mode === "crop" && stored) {
    const fallback = computeFitImageLayout(artboardWidth, artboardHeight, cropWidth, cropHeight);
    return {
      imageOffsetX: stored.imageOffsetX ?? fallback.imageOffsetX,
      imageOffsetY: stored.imageOffsetY ?? fallback.imageOffsetY,
      imageDisplayWidth: stored.imageDisplayWidth ?? fallback.imageDisplayWidth,
      imageDisplayHeight: stored.imageDisplayHeight ?? fallback.imageDisplayHeight,
    };
  }
  if (mode === "fill") {
    return computeFillImageLayout(artboardWidth, artboardHeight, cropWidth, cropHeight);
  }
  return computeFitImageLayout(artboardWidth, artboardHeight, cropWidth, cropHeight);
}

export function layoutsMatchFillMode(
  mode: ImageFillMode,
  artboardWidth: number,
  artboardHeight: number,
  cropWidth: number,
  cropHeight: number,
  layout: Pick<
    ArtboardLayout,
    "imageOffsetX" | "imageOffsetY" | "imageDisplayWidth" | "imageDisplayHeight"
  >,
): boolean {
  const expected = applyFillModeLayout(mode, artboardWidth, artboardHeight, cropWidth, cropHeight, layout);
  return (
    Math.abs(expected.imageOffsetX - layout.imageOffsetX) <= LAYOUT_TOLERANCE &&
    Math.abs(expected.imageOffsetY - layout.imageOffsetY) <= LAYOUT_TOLERANCE &&
    Math.abs(expected.imageDisplayWidth - layout.imageDisplayWidth) <= LAYOUT_TOLERANCE &&
    Math.abs(expected.imageDisplayHeight - layout.imageDisplayHeight) <= LAYOUT_TOLERANCE
  );
}

/** Layout for artboards with no image layer (blank / wireframe frame). */
export function layoutFromBlankArtboard(
  stored: StoredArtboardLayout & { artboardWidth: number; artboardHeight: number },
): ArtboardLayout {
  const area = contentArea(stored.artboardWidth, stored.artboardHeight);
  return normalizeArtboardLayout({
    artboardWidth: stored.artboardWidth,
    artboardHeight: stored.artboardHeight,
    imageOffsetX: stored.imageOffsetX ?? area.x,
    imageOffsetY: stored.imageOffsetY ?? area.y,
    imageDisplayWidth: stored.imageDisplayWidth ?? area.width,
    imageDisplayHeight: stored.imageDisplayHeight ?? area.height,
  });
}

export function layoutFromArtboard(
  stored: StoredArtboardLayout & {
    artboardWidth: number;
    artboardHeight: number;
    imageOffsetX: number;
    imageOffsetY: number;
  },
  intrinsicWidth: number,
  intrinsicHeight: number,
  cropWidth = intrinsicWidth,
  cropHeight = intrinsicHeight,
): ArtboardLayout {
  const mode = resolveImageFillMode(stored);
  const storedImage = {
    artboardWidth: stored.artboardWidth,
    artboardHeight: stored.artboardHeight,
    imageOffsetX: stored.imageOffsetX,
    imageOffsetY: stored.imageOffsetY,
    imageDisplayWidth: stored.imageDisplayWidth ?? intrinsicWidth,
    imageDisplayHeight: stored.imageDisplayHeight ?? intrinsicHeight,
  };
  const imageLayout = applyFillModeLayout(
    mode,
    stored.artboardWidth,
    stored.artboardHeight,
    cropWidth,
    cropHeight,
    storedImage,
  );
  return normalizeArtboardLayout({
    artboardWidth: stored.artboardWidth,
    artboardHeight: stored.artboardHeight,
    ...imageLayout,
  });
}

export function minArtboardSize() {
  return {
    width: MIN_ARTBOARD_SIZE,
    height: MIN_ARTBOARD_SIZE,
  };
}

export function defaultArtboardLayout(
  imageDisplayWidth: number,
  imageDisplayHeight: number,
): ArtboardLayout {
  return {
    artboardWidth: imageDisplayWidth + FRAME_PADDING * 2,
    artboardHeight: imageDisplayHeight + FRAME_PADDING * 2,
    imageOffsetX: FRAME_PADDING,
    imageOffsetY: FRAME_PADDING,
    imageDisplayWidth,
    imageDisplayHeight,
  };
}

export function resolveArtboardLayout(
  intrinsicWidth: number,
  intrinsicHeight: number,
  stored?: StoredArtboardLayout | null,
): ArtboardLayout {
  const fallback = defaultArtboardLayout(intrinsicWidth, intrinsicHeight);
  if (!stored?.artboardWidth || !stored?.artboardHeight) return fallback;
  return normalizeArtboardLayout(
    {
      artboardWidth: stored.artboardWidth,
      artboardHeight: stored.artboardHeight,
      imageOffsetX: stored.imageOffsetX ?? fallback.imageOffsetX,
      imageOffsetY: stored.imageOffsetY ?? fallback.imageOffsetY,
      imageDisplayWidth: stored.imageDisplayWidth ?? intrinsicWidth,
      imageDisplayHeight: stored.imageDisplayHeight ?? intrinsicHeight,
    },
  );
}

export function normalizeArtboardLayout(layout: ArtboardLayout): ArtboardLayout {
  const imageDisplayWidth = Math.max(MIN_IMAGE_DISPLAY_SIZE, layout.imageDisplayWidth);
  const imageDisplayHeight = Math.max(MIN_IMAGE_DISPLAY_SIZE, layout.imageDisplayHeight);
  const artboardWidth = Math.max(MIN_ARTBOARD_SIZE, layout.artboardWidth);
  const artboardHeight = Math.max(MIN_ARTBOARD_SIZE, layout.artboardHeight);
  const centered = centerImageInArtboard({
    artboardWidth,
    artboardHeight,
    imageDisplayWidth,
    imageDisplayHeight,
  });
  return {
    artboardWidth,
    artboardHeight,
    imageDisplayWidth,
    imageDisplayHeight,
    imageOffsetX: Number.isFinite(layout.imageOffsetX) ? layout.imageOffsetX : centered.imageOffsetX,
    imageOffsetY: Number.isFinite(layout.imageOffsetY) ? layout.imageOffsetY : centered.imageOffsetY,
  };
}

export function centerImageInArtboard(
  layout: Pick<ArtboardLayout, "artboardWidth" | "artboardHeight" | "imageDisplayWidth" | "imageDisplayHeight">,
): Pick<ArtboardLayout, "imageOffsetX" | "imageOffsetY"> {
  return {
    imageOffsetX: (layout.artboardWidth - layout.imageDisplayWidth) / 2,
    imageOffsetY: (layout.artboardHeight - layout.imageDisplayHeight) / 2,
  };
}

function resizeArtboardBounds(
  bounds: Bounds,
  handle: ResizeHandle,
  pt: { x: number; y: number },
): Bounds {
  let { x, y, width, height } = bounds;
  const right = x + width;
  const bottom = y + height;

  switch (handle) {
    case "se":
      width = Math.max(MIN_MARGIN, pt.x - x);
      height = Math.max(MIN_MARGIN, pt.y - y);
      break;
    case "sw":
      width = Math.max(MIN_MARGIN, right - pt.x);
      height = Math.max(MIN_MARGIN, pt.y - y);
      x = right - width;
      break;
    case "ne":
      width = Math.max(MIN_MARGIN, pt.x - x);
      height = Math.max(MIN_MARGIN, bottom - pt.y);
      y = bottom - height;
      break;
    case "nw":
      width = Math.max(MIN_MARGIN, right - pt.x);
      height = Math.max(MIN_MARGIN, bottom - pt.y);
      x = right - width;
      y = bottom - height;
      break;
    case "e":
      width = Math.max(MIN_MARGIN, pt.x - x);
      break;
    case "w":
      width = Math.max(MIN_MARGIN, right - pt.x);
      x = right - width;
      break;
    case "s":
      height = Math.max(MIN_MARGIN, pt.y - y);
      break;
    case "n":
      height = Math.max(MIN_MARGIN, bottom - pt.y);
      y = bottom - height;
      break;
    default:
      break;
  }

  return { x, y, width, height };
}

export function applyArtboardResize(
  layout: ArtboardLayout,
  handle: ResizeHandle,
  pt: { x: number; y: number },
  mode: ImageFillMode = "crop",
  cropWidth = layout.imageDisplayWidth,
  cropHeight = layout.imageDisplayHeight,
): ArtboardLayout {
  const next = resizeArtboardBounds(
    { x: 0, y: 0, width: layout.artboardWidth, height: layout.artboardHeight },
    handle,
    pt,
  );
  const resized = normalizeArtboardLayout({
    ...layout,
    artboardWidth: next.width,
    artboardHeight: next.height,
  });
  if (mode === "crop") return resized;
  const imageLayout = applyFillModeLayout(
    mode,
    resized.artboardWidth,
    resized.artboardHeight,
    cropWidth,
    cropHeight,
  );
  return normalizeArtboardLayout({ ...resized, ...imageLayout });
}

export function applyImageResize(
  layout: ArtboardLayout,
  handle: ResizeHandle,
  pt: { x: number; y: number },
): ArtboardLayout {
  const next = resizeArtboardBounds(
    {
      x: layout.imageOffsetX,
      y: layout.imageOffsetY,
      width: layout.imageDisplayWidth,
      height: layout.imageDisplayHeight,
    },
    handle,
    pt,
  );
  return normalizeArtboardLayout({
    ...layout,
    imageOffsetX: next.x,
    imageOffsetY: next.y,
    imageDisplayWidth: next.width,
    imageDisplayHeight: next.height,
  });
}

export function artboardLayoutFromDrag(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  imageDisplayWidth = 0,
  imageDisplayHeight = 0,
): ArtboardLayout {
  const artboardWidth = Math.max(MIN_ARTBOARD_SIZE, Math.abs(x2 - x1));
  const artboardHeight = Math.max(MIN_ARTBOARD_SIZE, Math.abs(y2 - y1));
  if (imageDisplayWidth > 0 && imageDisplayHeight > 0) {
    return {
      artboardWidth,
      artboardHeight,
      imageDisplayWidth,
      imageDisplayHeight,
      ...centerImageInArtboard({
        artboardWidth,
        artboardHeight,
        imageDisplayWidth,
        imageDisplayHeight,
      }),
    };
  }
  return {
    artboardWidth,
    artboardHeight,
    imageOffsetX: FRAME_PADDING,
    imageOffsetY: FRAME_PADDING,
    imageDisplayWidth: 0,
    imageDisplayHeight: 0,
  };
}

export function fitArtboardToImage(layout: ArtboardLayout): ArtboardLayout {
  return normalizeArtboardLayout({
    ...layout,
    artboardWidth: layout.imageDisplayWidth + FRAME_PADDING * 2,
    artboardHeight: layout.imageDisplayHeight + FRAME_PADDING * 2,
    imageOffsetX: FRAME_PADDING,
    imageOffsetY: FRAME_PADDING,
  });
}
