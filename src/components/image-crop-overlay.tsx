"use client";

import { useCallback, useId, useRef, useState } from "react";
import { boxHandles, hitBoxHandle, type ResizeHandle } from "@/lib/markup/bounds";
import {
  applyCropResize,
  cropPreviewTransform,
  cropToPreviewBounds,
  type ImageCrop,
} from "@/lib/markup/image-crop";

type Props = {
  crop: ImageCrop;
  intrinsicWidth: number;
  intrinsicHeight: number;
  displayWidth: number;
  displayHeight: number;
  scale: number;
  aspectLocked: boolean;
  onCropChange: (crop: ImageCrop) => void;
};

export function ImageCropOverlay({
  crop,
  intrinsicWidth,
  intrinsicHeight,
  displayWidth,
  displayHeight,
  scale,
  aspectLocked,
  onCropChange,
}: Props) {
  const maskId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ handle: ResizeHandle; snapshot: ImageCrop } | null>(null);
  const [hoverHandle, setHoverHandle] = useState<ResizeHandle | null>(null);

  const bounds = cropToPreviewBounds(
    crop,
    intrinsicWidth,
    intrinsicHeight,
    displayWidth,
    displayHeight,
  );

  const localPoint = useCallback((e: React.PointerEvent | PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const pt = localPoint(e);
      const handle = hitBoxHandle(pt.x, pt.y, bounds, scale, 10);
      if (!handle) return;
      dragRef.current = { handle, snapshot: crop };
      svgRef.current?.setPointerCapture(e.pointerId);
    },
    [bounds, crop, localPoint, scale],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pt = localPoint(e);

      if (dragRef.current) {
        onCropChange(
          applyCropResize(
            dragRef.current.snapshot,
            dragRef.current.handle,
            pt,
            displayWidth,
            displayHeight,
            intrinsicWidth,
            intrinsicHeight,
            aspectLocked,
          ),
        );
        return;
      }

      setHoverHandle(hitBoxHandle(pt.x, pt.y, bounds, scale, 10));
    },
    [
      aspectLocked,
      bounds,
      displayHeight,
      displayWidth,
      intrinsicHeight,
      intrinsicWidth,
      localPoint,
      onCropChange,
      scale,
    ],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    svgRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <svg
      ref={svgRef}
      className="absolute left-0 top-0 z-10 touch-none"
      width={displayWidth}
      height={displayHeight}
      data-testid="image-crop-overlay"
      style={{ pointerEvents: "auto", cursor: hoverHandle ? "nwse-resize" : "default" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        if (!dragRef.current) setHoverHandle(null);
      }}
    >
      <defs>
        <mask id={maskId}>
          <rect width={displayWidth} height={displayHeight} fill="white" />
          <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="black" />
        </mask>
      </defs>
      <rect
        width={displayWidth}
        height={displayHeight}
        fill="rgba(0,0,0,0.45)"
        mask={`url(#${maskId})`}
      />
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={1.5 / scale}
      />
      {boxHandles(bounds).map((handle) => (
        <rect
          key={handle.id}
          x={handle.x - 4 / scale}
          y={handle.y - 4 / scale}
          width={8 / scale}
          height={8 / scale}
          fill="#ffffff"
          stroke="#3b82f6"
          strokeWidth={1 / scale}
          data-testid={`crop-handle-${handle.id}`}
          pointerEvents="none"
        />
      ))}
    </svg>
  );
}
