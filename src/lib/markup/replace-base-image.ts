import { randomUUID } from "crypto";
import { defaultArtboardLayout } from "./artboard-layout";
import type { StoredSessionDocument } from "./session-document";

export const IMAGE_DIMENSION_TOLERANCE = 1;

export type BaseImageReplacement = {
  path: string;
  mime: string;
  width: number;
  height: number;
};

export function imageDimensionsMatch(
  a: { width: number; height: number },
  b: { width: number; height: number },
  tolerance = IMAGE_DIMENSION_TOLERANCE,
): boolean {
  return (
    Math.abs(a.width - b.width) <= tolerance &&
    Math.abs(a.height - b.height) <= tolerance
  );
}

export function mergeReplacedBaseImage(
  existing: StoredSessionDocument,
  image: BaseImageReplacement,
  options: { keepMarkup: boolean },
): StoredSessionDocument {
  const activeId = existing.activeArtboardId ?? existing.artboards[0]?.id;
  const active = existing.artboards.find((a) => a.id === activeId);
  const imageAssetId = active?.imageId ?? randomUUID();
  const imageAsset = {
    id: imageAssetId,
    path: image.path,
    mime: image.mime,
    width: image.width,
    height: image.height,
  };

  if (options.keepMarkup) {
    return {
      ...existing,
      images: {
        ...existing.images,
        [imageAssetId]: imageAsset,
      },
      artboards: existing.artboards.map((artboard) =>
        artboard.id === activeId
          ? { ...artboard, imageId: imageAssetId }
          : artboard,
      ),
    };
  }

  const layout = defaultArtboardLayout(image.width, image.height);
  return {
    ...existing,
    images: {
      ...existing.images,
      [imageAssetId]: imageAsset,
    },
    artboards: existing.artboards.map((artboard) =>
      artboard.id === activeId
        ? {
            ...artboard,
            markupStack: [],
            imageId: imageAssetId,
            artboardWidth: layout.artboardWidth,
            artboardHeight: layout.artboardHeight,
            imageOffsetX: layout.imageOffsetX,
            imageOffsetY: layout.imageOffsetY,
            imageDisplayWidth: image.width,
            imageDisplayHeight: image.height,
            imageCropX: null,
            imageCropY: null,
            imageCropWidth: null,
            imageCropHeight: null,
          }
        : { ...artboard, markupStack: [] },
    ),
  };
}
