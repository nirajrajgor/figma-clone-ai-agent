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

async function composeContentLayer(
  baseLayer: Buffer | null,
  objects: MarkupObject[],
  contentWidth: number,
  contentHeight: number,
  crop: ImageCrop,
  style: FrameContentStyle,
): Promise<Buffer> {
  const imageOpacity = style.imageOpacity ?? 100;
  const frameCornerRadius = style.frameCornerRadius ?? 0;
  const imgW = roundPx(contentWidth);
  const imgH = roundPx(contentHeight);

  const svg = markupToSvg(objects, crop.width, crop.height, crop.x, crop.y);
  const overlay = await sharp(Buffer.from(svg)).resize(imgW, imgH).png().toBuffer();

  const composites: { input: Buffer; left: number; top: number }[] = [];
  if (baseLayer) {
    composites.push({ input: baseLayer, left: 0, top: 0 });
  }
  composites.push({ input: overlay, left: 0, top: 0 });

  let contentLayer = await sharp({
    create: {
      width: imgW,
      height: imgH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  contentLayer = await applyOpacity(contentLayer, imageOpacity);
  return applyRoundedClip(contentLayer, imgW, imgH, frameCornerRadius);
}

async function composeFramedPng(
  contentLayer: Buffer,
  layout: ArtboardLayout,
): Promise<Buffer> {
  const { width: frameW, height: frameH } = exportFrameDimensions(layout);
  const left = Math.round(layout.imageOffsetX);
  const top = Math.round(layout.imageOffsetY);

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

export async function composeBlankExportPng(
  objects: MarkupObject[],
  layout: ArtboardLayout,
  style: FrameContentStyle = {},
): Promise<Buffer> {
  const imgW = roundPx(layout.imageDisplayWidth);
  const imgH = roundPx(layout.imageDisplayHeight);
  const crop: ImageCrop = { x: 0, y: 0, width: imgW, height: imgH };
  const contentLayer = await composeContentLayer(null, objects, imgW, imgH, crop, style);
  return composeFramedPng(contentLayer, layout);
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
  const imgW = roundPx(layout.imageDisplayWidth);
  const imgH = roundPx(layout.imageDisplayHeight);

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

  const contentLayer = await composeContentLayer(
    baseLayer,
    objects,
    imgW,
    imgH,
    crop,
    style,
  );
  return composeFramedPng(contentLayer, layout);
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

function encodeExportBuffer(png: Buffer, exportOptions: ExportOptions): Promise<Buffer> {
  if (exportOptions.format === "jpg") {
    return sharp(png)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: exportOptions.quality })
      .toBuffer();
  }
  return Promise.resolve(png);
}

export async function composeBlankExport(
  objects: MarkupObject[],
  layout: ArtboardLayout,
  exportOptions: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  style: FrameContentStyle = {},
): Promise<Buffer> {
  const scaledLayout = scaleLayout(layout, exportOptions.scale);
  const scaledStyle = scaleFrameStyle(style, exportOptions.scale);
  const png = await composeBlankExportPng(objects, scaledLayout, scaledStyle);
  return encodeExportBuffer(png, exportOptions);
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
  return encodeExportBuffer(png, exportOptions);
}
