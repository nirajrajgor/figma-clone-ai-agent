/** White margin between the artboard edge and the base image (Figma frame padding). */
export const FRAME_PADDING = 48;

export const FRAME_LABEL_HEIGHT = 22;

/** Viewport top reserve so the screen-space frame label is not clipped. */
export const FRAME_LABEL_OFFSET = FRAME_LABEL_HEIGHT + 6;

/** Map a point on the artboard into image/markup coordinates. */
export function artboardToImage(
  artboardX: number,
  artboardY: number,
  imageOffsetX: number,
  imageOffsetY: number,
) {
  return { x: artboardX - imageOffsetX, y: artboardY - imageOffsetY };
}

/** Map image/markup coordinates to a point on the artboard. */
export function imageToArtboard(
  imageX: number,
  imageY: number,
  imageOffsetX: number,
  imageOffsetY: number,
) {
  return { x: imageX + imageOffsetX, y: imageY + imageOffsetY };
}

export function clientToArtboard(
  clientX: number,
  clientY: number,
  viewportRect: DOMRect,
  offset: { x: number; y: number },
  scale: number,
) {
  return {
    x: (clientX - viewportRect.left - offset.x) / scale,
    y: (clientY - viewportRect.top - offset.y) / scale,
  };
}

export function isOnArtboard(
  artboardX: number,
  artboardY: number,
  artboardWidth: number,
  artboardHeight: number,
) {
  return (
    artboardX >= 0 &&
    artboardX <= artboardWidth &&
    artboardY >= 0 &&
    artboardY <= artboardHeight
  );
}

/** Map display-space image coordinates to intrinsic markup coordinates. */
export function displayToIntrinsic(
  displayX: number,
  displayY: number,
  intrinsicWidth: number,
  intrinsicHeight: number,
  displayWidth: number,
  displayHeight: number,
) {
  if (!displayWidth || !displayHeight) return { x: displayX, y: displayY };
  return {
    x: (displayX / displayWidth) * intrinsicWidth,
    y: (displayY / displayHeight) * intrinsicHeight,
  };
}

/** True when the point is inside the base-image / markup coordinate area. */
export function isInImageContent(
  imageX: number,
  imageY: number,
  imageWidth: number,
  imageHeight: number,
) {
  return (
    imageX >= 0 &&
    imageX <= imageWidth &&
    imageY >= 0 &&
    imageY <= imageHeight
  );
}
