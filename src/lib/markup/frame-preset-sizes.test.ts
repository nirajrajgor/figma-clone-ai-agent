import { describe, expect, it } from "vitest";
import { devicePresetSize } from "./device-presets";
import { frameSizeFromPreset, resolveFrameSizeFromForm } from "./frame-preset-sizes";

describe("frame-preset-sizes", () => {
  it("returns sizes for phone, tablet, and desktop via device-presets", () => {
    expect(frameSizeFromPreset("phone")).toEqual(devicePresetSize("phone"));
    expect(frameSizeFromPreset("tablet")).toEqual(devicePresetSize("tablet"));
    expect(frameSizeFromPreset("desktop")).toEqual(devicePresetSize("desktop"));
  });

  it("returns undefined for unknown presets", () => {
    expect(frameSizeFromPreset("watch")).toBeUndefined();
  });

  it("reads preset from form data", () => {
    const form = new FormData();
    form.set("preset", "phone");
    expect(resolveFrameSizeFromForm(form)).toEqual({ width: 390, height: 844 });
  });

  it("reads frameWidth and frameHeight from form data", () => {
    const form = new FormData();
    form.set("frameWidth", "320");
    form.set("frameHeight", "568");
    expect(resolveFrameSizeFromForm(form)).toEqual({ width: 320, height: 568 });
  });

  it("prefers preset over explicit dimensions", () => {
    const form = new FormData();
    form.set("preset", "desktop");
    form.set("frameWidth", "100");
    form.set("frameHeight", "100");
    expect(resolveFrameSizeFromForm(form)).toEqual(devicePresetSize("desktop"));
  });
});
