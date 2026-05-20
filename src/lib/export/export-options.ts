export type ExportFormat = "png" | "jpg";
export type ExportScale = 1 | 2;

export type ExportOptions = {
  format: ExportFormat;
  scale: ExportScale;
  quality: number;
};

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: "png",
  scale: 1,
  quality: 85,
};

export function exportFilename(baseName: string, options: ExportOptions): string {
  const stem = baseName.trim() || "export";
  const scaleSuffix = options.scale === 2 ? "@2x" : "";
  const ext = options.format === "jpg" ? "jpg" : "png";
  return `${stem}${scaleSuffix}.${ext}`;
}

export function exportContentType(options: ExportOptions): string {
  return options.format === "jpg" ? "image/jpeg" : "image/png";
}

function parseScale(value: string | null | undefined): ExportScale | null {
  if (value == null || value === "" || value === "1") return 1;
  if (value === "2") return 2;
  return null;
}

function parseFormat(value: string | null | undefined): ExportFormat | null {
  if (value == null || value === "" || value === "png") return "png";
  if (value === "jpg" || value === "jpeg") return "jpg";
  return null;
}

function parseQuality(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return DEFAULT_EXPORT_OPTIONS.quality;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 100) return null;
  return Math.round(n);
}

export function parseExportOptions(
  searchParams: URLSearchParams,
  body?: Partial<Record<keyof ExportOptions, string | number>>,
): ExportOptions | { error: string } {
  const scale = parseScale(
    body?.scale != null ? String(body.scale) : searchParams.get("scale"),
  );
  if (scale == null) return { error: "Invalid scale (use 1 or 2)" };

  const format = parseFormat(
    body?.format != null ? String(body.format) : searchParams.get("format"),
  );
  if (format == null) return { error: "Invalid format (use png or jpg)" };

  const quality = parseQuality(
    body?.quality ?? searchParams.get("quality"),
  );
  if (quality == null) return { error: "Invalid quality (use 1–100)" };

  return { format, scale, quality };
}

export function buildExportQuery(options: ExportOptions): string {
  const params = new URLSearchParams();
  if (options.scale === 2) params.set("scale", "2");
  if (options.format === "jpg") params.set("format", "jpg");
  if (options.format === "jpg" && options.quality !== DEFAULT_EXPORT_OPTIONS.quality) {
    params.set("quality", String(options.quality));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function buildExportHref(basePath: string, options: ExportOptions): string {
  return `${basePath}${buildExportQuery(options)}`;
}
