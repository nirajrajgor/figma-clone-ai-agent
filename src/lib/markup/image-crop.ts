import type { Bounds, ResizeHandle } from "./bounds";

export type ImageCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StoredImageCrop = {
  imageCropX?: number | null;
  imageCropY?: number | null;
  imageCropWidth?: number | null;
  imageCropHeight?: number | null;
};

export const MIN_CROP_SIZE = 8;

export function resolveImageCrop(
  stored: StoredImageCrop | undefined | null,
  intrinsicWidth: number,
  intrinsicHeight: number,
): ImageCrop {
  if (
    stored?.imageCropWidth == null ||
    stored?.imageCropHeight == null ||
    stored.imageCropX == null ||
    stored.imageCropY == null
  ) {
    return { x: 0, y: 0, width: intrinsicWidth, height: intrinsicHeight };
  }
  return clampImageCrop(
    {
      x: stored.imageCropX,
      y: stored.imageCropY,
      width: stored.imageCropWidth,
      height: stored.imageCropHeight,
    },
    intrinsicWidth,
    intrinsicHeight,
  );
}

export function clampImageCrop(
  crop: ImageCrop,
  intrinsicWidth: number,
  intrinsicHeight: number,
): ImageCrop {
  const width = Math.max(MIN_CROP_SIZE, Math.min(crop.width, intrinsicWidth));
  const height = Math.max(MIN_CROP_SIZE, Math.min(crop.height, intrinsicHeight));
  const x = Math.max(0, Math.min(crop.x, intrinsicWidth - width));
  const y = Math.max(0, Math.min(crop.y, intrinsicHeight - height));
  return { x, y, width, height };
}

export function cropToStored(crop: ImageCrop): StoredImageCrop {
  return {
    imageCropX: crop.x,
    imageCropY: crop.y,
    imageCropWidth: crop.width,
    imageCropHeight: crop.height,
  };
}

export function cropImageStyles(
  crop: ImageCrop,
  intrinsicWidth: number,
  intrinsicHeight: number,
  displayWidth: number,
  displayHeight: number,
) {
  const scaleX = displayWidth / crop.width;
  const scaleY = displayHeight / crop.height;
  return {
    width: intrinsicWidth * scaleX,
    height: intrinsicHeight * scaleY,
    marginLeft: -crop.x * scaleX,
    marginTop: -crop.y * scaleY,
  };
}

export function cropPreviewTransform(
  intrinsicWidth: number,
  intrinsicHeight: number,
  displayWidth: number,
  displayHeight: number,
) {
  const scale = Math.min(displayWidth / intrinsicWidth, displayHeight / intrinsicHeight);
  const previewWidth = intrinsicWidth * scale;
  const previewHeight = intrinsicHeight * scale;
  return {
    scale,
    offsetX: (displayWidth - previewWidth) / 2,
    offsetY: (displayHeight - previewHeight) / 2,
    previewWidth,
    previewHeight,
  };
}

export function cropToPreviewBounds(
  crop: ImageCrop,
  intrinsicWidth: number,
  intrinsicHeight: number,
  displayWidth: number,
  displayHeight: number,
): Bounds {
  const { scale, offsetX, offsetY } = cropPreviewTransform(
    intrinsicWidth,
    intrinsicHeight,
    displayWidth,
    displayHeight,
  );
  return {
    x: offsetX + crop.x * scale,
    y: offsetY + crop.y * scale,
    width: crop.width * scale,
    height: crop.height * scale,
  };
}

export function previewBoundsToCrop(
  bounds: Bounds,
  intrinsicWidth: number,
  intrinsicHeight: number,
  displayWidth: number,
  displayHeight: number,
): ImageCrop {
  const { scale, offsetX, offsetY } = cropPreviewTransform(
    intrinsicWidth,
    intrinsicHeight,
    displayWidth,
    displayHeight,
  );
  return clampImageCrop(
    {
      x: (bounds.x - offsetX) / scale,
      y: (bounds.y - offsetY) / scale,
      width: bounds.width / scale,
      height: bounds.height / scale,
    },
    intrinsicWidth,
    intrinsicHeight,
  );
}

export function isInCropArea(intrinsicX: number, intrinsicY: number, crop: ImageCrop): boolean {
  return (
    intrinsicX >= crop.x &&
    intrinsicX <= crop.x + crop.width &&
    intrinsicY >= crop.y &&
    intrinsicY <= crop.y + crop.height
  );
}

/** Map display-space image coordinates to intrinsic markup coordinates for a crop viewport. */
export function displayToIntrinsicCrop(
  displayX: number,
  displayY: number,
  crop: ImageCrop,
  displayWidth: number,
  displayHeight: number,
) {
  if (!displayWidth || !displayHeight) return { x: displayX, y: displayY };
  return {
    x: crop.x + (displayX / displayWidth) * crop.width,
    y: crop.y + (displayY / displayHeight) * crop.height,
  };
}

export function applyCropResize(
  crop: ImageCrop,
  handle: ResizeHandle,
  pointer: { x: number; y: number },
  displayWidth: number,
  displayHeight: number,
  intrinsicWidth: number,
  intrinsicHeight: number,
  aspectLocked: boolean,
): ImageCrop {
  const preview = cropPreviewTransform(intrinsicWidth, intrinsicHeight, displayWidth, displayHeight);
  const min = MIN_CROP_SIZE * preview.scale;
  let { x, y, width, height } = cropToPreviewBounds(
    crop,
    intrinsicWidth,
    intrinsicHeight,
    displayWidth,
    displayHeight,
  );
  const right = x + width;
  const bottom = y + height;
  const ratio = crop.width / crop.height;

  switch (handle) {
    case "se":
      width = Math.max(min, pointer.x - x);
      height = Math.max(min, pointer.y - y);
      break;
    case "sw":
      width = Math.max(min, right - pointer.x);
      height = Math.max(min, pointer.y - y);
      x = right - width;
      break;
    case "ne":
      width = Math.max(min, pointer.x - x);
      height = Math.max(min, bottom - pointer.y);
      y = bottom - height;
      break;
    case "nw":
      width = Math.max(min, right - pointer.x);
      height = Math.max(min, bottom - pointer.y);
      x = right - width;
      y = bottom - height;
      break;
    case "e":
      width = Math.max(min, pointer.x - x);
      break;
    case "w":
      width = Math.max(min, right - pointer.x);
      x = right - width;
      break;
    case "s":
      height = Math.max(min, pointer.y - y);
      break;
    case "n":
      height = Math.max(min, bottom - pointer.y);
      y = bottom - height;
      break;
    default:
      break;
  }

  if (aspectLocked && ratio > 0) {
    if (handle === "e" || handle === "w") height = width / ratio;
    else if (handle === "n" || handle === "s") width = height * ratio;
    else {
      height = width / ratio;
      if (handle === "nw" || handle === "sw") y = bottom - height;
      if (handle === "nw" || handle === "ne") x = right - width;
    }
  }

  const maxX = preview.offsetX + preview.previewWidth;
  const maxY = preview.offsetY + preview.previewHeight;
  x = Math.max(preview.offsetX, x);
  y = Math.max(preview.offsetY, y);
  width = Math.min(maxX - x, width);
  height = Math.min(maxY - y, height);

  return previewBoundsToCrop(
    { x, y, width, height },
    intrinsicWidth,
    intrinsicHeight,
    displayWidth,
    displayHeight,
  );
}
