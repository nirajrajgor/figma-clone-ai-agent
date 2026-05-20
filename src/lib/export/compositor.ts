import sharp from "sharp";
import {
  DEFAULT_EXPORT_OPTIONS,
  type ExportOptions,
} from "@/lib/export/export-options";
import type { ArtboardLayout } from "@/lib/markup/artboard-layout";
import type { ImageCrop } from "@/lib/markup/image-crop";
import { markupToSvg } from "@/lib/markup/svg-objects";
import type { MarkupObject } from "@/lib/markup/types";

function roundPx(value: number): number {
  return Math.max(1, Math.round(value));
}

export type FrameContentStyle = {
  imageOpacity?: number;
  frameCornerRadius?: number;
};

export function exportFrameDimensions(layout: ArtboardLayout) {
  return {
    width: roundPx(layout.artboardWidth),
    height: roundPx(layout.artboardHeight),
  };
}

function roundedRectMaskSvg(width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, height / 2);
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" rx="${r}" ry="${r}" fill="white"/>
</svg>`;
}

async function applyOpacity(buffer: Buffer, opacityPercent: number): Promise<Buffer> {
  if (opacityPercent >= 100) return buffer;
  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? 1;
  const height = meta.height ?? 1;
  if (opacityPercent <= 0) {
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();
  }
  const alpha = opacityPercent / 100;
  return sharp(buffer).ensureAlpha().linear([1, 1, 1, alpha], [0, 0, 0, 0]).png().toBuffer();
}

async function applyRoundedClip(
  buffer: Buffer,
  width: number,
  height: number,
  radius: number,
): Promise<Buffer> {
  if (radius <= 0) return buffer;
  const mask = await sharp(Buffer.from(roundedRectMaskSvg(width, height, radius)))
    .png()
    .toBuffer();
  return sharp(buffer).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

export async function composeExportPng(
  baseImagePath: string,
  objects: MarkupObject[],
  intrinsicWidth: number,
  intrinsicHeight: number,
  layout: ArtboardLayout,
  crop: ImageCrop,
  style: FrameContentStyle = {},
): Promise<Buffer> {
  const { width: frameW, height: frameH } = exportFrameDimensions(layout);
  const imgW = roundPx(layout.imageDisplayWidth);
  const imgH = roundPx(layout.imageDisplayHeight);
  const left = Math.round(layout.imageOffsetX);
  const top = Math.round(layout.imageOffsetY);
  const imageOpacity = style.imageOpacity ?? 100;
  const frameCornerRadius = style.frameCornerRadius ?? 0;

  const baseLayer = await sharp(baseImagePath)
    .extract({
      left: Math.round(crop.x),
      top: Math.round(crop.y),
      width: Math.round(crop.width),
      height: Math.round(crop.height),
    })
    .resize(imgW, imgH)
    .png()
    .toBuffer();

  const svg = markupToSvg(objects, crop.width, crop.height, crop.x, crop.y);
  const overlay = await sharp(Buffer.from(svg)).resize(imgW, imgH).png().toBuffer();

  let contentLayer = await sharp({
    create: {
      width: imgW,
      height: imgH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: baseLayer, left: 0, top: 0 },
      { input: overlay, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  contentLayer = await applyOpacity(contentLayer, imageOpacity);
  contentLayer = await applyRoundedClip(contentLayer, imgW, imgH, frameCornerRadius);

  return sharp({
    create: {
      width: frameW,
      height: frameH,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: contentLayer, left, top }])
    .png()
    .toBuffer();
}

function scaleLayout(layout: ArtboardLayout, scale: number): ArtboardLayout {
  if (scale === 1) return layout;
  return {
    artboardWidth: layout.artboardWidth * scale,
    artboardHeight: layout.artboardHeight * scale,
    imageOffsetX: layout.imageOffsetX * scale,
    imageOffsetY: layout.imageOffsetY * scale,
    imageDisplayWidth: layout.imageDisplayWidth * scale,
    imageDisplayHeight: layout.imageDisplayHeight * scale,
  };
}

function scaleFrameStyle(style: FrameContentStyle, scale: number): FrameContentStyle {
  if (scale === 1) return style;
  return {
    imageOpacity: style.imageOpacity,
    frameCornerRadius:
      style.frameCornerRadius != null ? style.frameCornerRadius * scale : undefined,
  };
}

export async function composeExport(
  baseImagePath: string,
  objects: MarkupObject[],
  intrinsicWidth: number,
  intrinsicHeight: number,
  layout: ArtboardLayout,
  crop: ImageCrop,
  exportOptions: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  style: FrameContentStyle = {},
): Promise<Buffer> {
  const scaledLayout = scaleLayout(layout, exportOptions.scale);
  const scaledStyle = scaleFrameStyle(style, exportOptions.scale);
  const png = await composeExportPng(
    baseImagePath,
    objects,
    intrinsicWidth,
    intrinsicHeight,
    scaledLayout,
    crop,
    scaledStyle,
  );
  if (exportOptions.format === "jpg") {
    return sharp(png)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: exportOptions.quality })
      .toBuffer();
  }
  return png;
}
