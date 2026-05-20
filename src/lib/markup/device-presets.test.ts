import { describe, expect, it } from "vitest";
import {
  DEVICE_PRESETS,
  devicePresetSize,
  getDevicePreset,
} from "./device-presets";

describe("device presets", () => {
  it("exposes three presets with standard dimensions", () => {
    expect(DEVICE_PRESETS).toHaveLength(3);
    expect(DEVICE_PRESETS.map((p) => p.id)).toEqual([
      "phone",
      "tablet",
      "desktop",
    ]);
  });

  it.each([
    ["phone", "Phone", "phone", 390, 844],
    ["tablet", "Tablet", "tablet", 768, 1024],
    ["desktop", "Desktop", "desktop", 1440, 900],
  ] as const)(
    "getDevicePreset(%s) returns label, category, and size",
    (id, label, category, width, height) => {
      const preset = getDevicePreset(id);
      expect(preset).toEqual({
        id,
        label,
        category,
        width,
        height,
      });
    },
  );

  it.each([
    ["phone", 390, 844],
    ["tablet", 768, 1024],
    ["desktop", 1440, 900],
  ] as const)("devicePresetSize(%s) returns width and height", (id, width, height) => {
    expect(devicePresetSize(id)).toEqual({ width, height });
  });

  it("returns undefined for unknown preset id", () => {
    expect(getDevicePreset("watch")).toBeUndefined();
    expect(devicePresetSize("watch")).toBeUndefined();
  });
});
