import fs from "fs";
import path from "path";
import sharp from "sharp";
import { allowedImageMime, IMAGE_MIME_TO_EXT } from "@/lib/image-mime";

export { allowedImageMime } from "@/lib/image-mime";

const UPLOADS = path.join(process.cwd(), "data", "uploads");

export async function saveBaseImage(sessionId: string, file: File) {
  if (!allowedImageMime(file.type)) {
    throw new Error("Unsupported image type");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const dir = path.join(UPLOADS, sessionId);
  fs.mkdirSync(dir, { recursive: true });
  const ext = IMAGE_MIME_TO_EXT[file.type];
  const basePath = path.join(dir, `base.${ext}`);
  const thumbPath = path.join(dir, "thumb.jpg");
  await sharp(buf).toFile(basePath);
  await sharp(buf).resize(200, 200, { fit: "inside" }).jpeg({ quality: 80 }).toFile(thumbPath);
  return {
    path: basePath,
    thumbnailPath: thumbPath,
    mime: file.type,
    width,
    height,
  };
}

export function resolveStoredPath(stored: string) {
  return path.isAbsolute(stored) ? stored : path.join(process.cwd(), stored);
}

export function deleteSessionUploadDir(baseImagePath: string) {
  fs.rmSync(path.dirname(resolveStoredPath(baseImagePath)), {
    recursive: true,
    force: true,
  });
}
