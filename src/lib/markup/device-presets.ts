export type DevicePresetId = "phone" | "tablet" | "desktop";

export type DeviceCategory = DevicePresetId;

export type DevicePreset = {
  readonly id: DevicePresetId;
  readonly label: string;
  readonly category: DeviceCategory;
  readonly width: number;
  readonly height: number;
};

export const DEVICE_PRESETS: readonly DevicePreset[] = [
  {
    id: "phone",
    label: "Phone",
    category: "phone",
    width: 390,
    height: 844,
  },
  {
    id: "tablet",
    label: "Tablet",
    category: "tablet",
    width: 768,
    height: 1024,
  },
  {
    id: "desktop",
    label: "Desktop",
    category: "desktop",
    width: 1440,
    height: 900,
  },
] as const;

const presetById = new Map<DevicePresetId, DevicePreset>(
  DEVICE_PRESETS.map((preset) => [preset.id, preset]),
);

export function getDevicePreset(id: string): DevicePreset | undefined {
  return presetById.get(id as DevicePresetId);
}

export function devicePresetSize(
  id: string,
): { width: number; height: number } | undefined {
  const preset = getDevicePreset(id);
  if (!preset) return undefined;
  return { width: preset.width, height: preset.height };
}
