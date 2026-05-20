type Props = {
  title: string;
  artboardWidth: number;
  artboardHeight: number;
  left: number;
  top: number;
};

/** Screen-space frame label (Figma-style; does not scale with zoom). */
export function CanvasFrameLabel({
  title,
  artboardWidth,
  artboardHeight,
  left,
  top,
}: Props) {
  return (
    <div
      className="pointer-events-none absolute z-10 flex items-center gap-2 whitespace-nowrap"
      style={{ left, top }}
      data-testid="frame-label"
    >
      <span className="rounded bg-[#0D99FF] px-1.5 py-0.5 text-[11px] font-medium leading-none text-white">
        {title}
      </span>
      <span className="text-[11px] leading-none text-[#666666] dark:text-[#999999]">
        {artboardWidth} × {artboardHeight}
      </span>
    </div>
  );
}
