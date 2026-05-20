import { devicePresetSize } from "./device-presets";

export function frameSizeFromPreset(
  preset: string,
): { width: number; height: number } | undefined {
  return devicePresetSize(preset);
}

/** Resolve optional frame size from multipart session-create fields. */
export function resolveFrameSizeFromForm(
  form: FormData,
): { width: number; height: number } | undefined {
  const preset = String(form.get("preset") ?? "").trim();
  const fromPreset = frameSizeFromPreset(preset);
  if (fromPreset) return fromPreset;

  const width = Number(form.get("frameWidth"));
  const height = Number(form.get("frameHeight"));
  if (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  ) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  return undefined;
}
