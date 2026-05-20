import { describe, expect, it } from "vitest";
import {
  createInitialSessionDocument,
} from "./session-document";
import {
  imageDimensionsMatch,
  mergeReplacedBaseImage,
} from "./replace-base-image";

describe("replace-base-image", () => {
  it("matches dimensions within tolerance", () => {
    expect(imageDimensionsMatch({ width: 100, height: 80 }, { width: 100, height: 80 })).toBe(
      true,
    );
    expect(imageDimensionsMatch({ width: 100, height: 80 }, { width: 101, height: 80 })).toBe(
      true,
    );
    expect(imageDimensionsMatch({ width: 100, height: 80 }, { width: 102, height: 80 })).toBe(
      false,
    );
  });

  it("keeps markup and artboard layout when keepMarkup is true", () => {
    const doc = createInitialSessionDocument("Screen", {
      id: "img-1",
      path: "/data/uploads/s1/base.png",
      mime: "image/png",
      width: 100,
      height: 80,
    });
    const artboard = doc.artboards[0];
    artboard.markupStack = [
      {
        id: "shape-1",
        type: "rectangle",
        x: 10,
        y: 10,
        width: 20,
        height: 20,
        strokeColor: "#000",
        strokeWidth: 2,
        zIndex: 0,
      },
    ];
    artboard.artboardWidth = 200;
    artboard.imageOffsetX = 30;

    const merged = mergeReplacedBaseImage(
      doc,
      {
        path: "/data/uploads/s1/base-new.png",
        mime: "image/png",
        width: 100,
        height: 80,
      },
      { keepMarkup: true },
    );

    expect(merged.artboards[0].markupStack).toHaveLength(1);
    expect(merged.artboards[0].artboardWidth).toBe(200);
    expect(merged.artboards[0].imageOffsetX).toBe(30);
    expect(merged.images[artboard.imageId!].path).toBe("/data/uploads/s1/base-new.png");
  });

  it("clears markup and resets layout when keepMarkup is false", () => {
    const doc = createInitialSessionDocument("Screen", {
      id: "img-1",
      path: "/data/uploads/s1/base.png",
      mime: "image/png",
      width: 100,
      height: 80,
    });
    doc.artboards[0].markupStack = [
      {
        id: "shape-1",
        type: "rectangle",
        x: 10,
        y: 10,
        width: 20,
        height: 20,
        strokeColor: "#000",
        strokeWidth: 2,
        zIndex: 0,
      },
    ];
    doc.artboards[0].artboardWidth = 200;

    const merged = mergeReplacedBaseImage(
      doc,
      {
        path: "/data/uploads/s1/base-new.png",
        mime: "image/png",
        width: 64,
        height: 64,
      },
      { keepMarkup: false },
    );

    expect(merged.artboards[0].markupStack).toHaveLength(0);
    expect(merged.artboards[0].artboardWidth).not.toBe(200);
    expect(merged.artboards[0].imageDisplayWidth).toBe(64);
  });
});
