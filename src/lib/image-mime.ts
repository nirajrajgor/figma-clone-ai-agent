export const IMAGE_MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const IMAGE_ACCEPT = Object.keys(IMAGE_MIME_TO_EXT).join(",");

export function allowedImageMime(mime: string) {
  return mime in IMAGE_MIME_TO_EXT;
}
