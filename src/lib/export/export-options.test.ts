import { describe, expect, it } from "vitest";
import {
  buildExportHref,
  exportFilename,
  parseExportOptions,
} from "./export-options";

describe("export options", () => {
  it("defaults to PNG 1×", () => {
    const options = parseExportOptions(new URLSearchParams());
    expect(options).toEqual({ format: "png", scale: 1, quality: 85 });
  });

  it("parses scale, format, and quality query params", () => {
    const options = parseExportOptions(
      new URLSearchParams("scale=2&format=jpg&quality=90"),
    );
    expect(options).toEqual({ format: "jpg", scale: 2, quality: 90 });
  });

  it("adds @2x suffix to filename when scaled", () => {
    expect(exportFilename("My Session", { format: "png", scale: 2, quality: 85 })).toBe(
      "My Session@2x.png",
    );
    expect(exportFilename("My Session", { format: "jpg", scale: 1, quality: 85 })).toBe(
      "My Session.jpg",
    );
  });

  it("builds export href with query params", () => {
    expect(
      buildExportHref("/api/export", { format: "jpg", scale: 2, quality: 85 }),
    ).toBe("/api/export?scale=2&format=jpg");
  });
});
