"use client";

import { useEffect, useRef, useState } from "react";
import type { ImageCrop } from "@/lib/markup/image-crop";

export type TextInlineEditState =
  | { kind: "new"; x: number; y: number }
  | { kind: "edit"; id: string; x: number; y: number; content: string; fontSize: number };

type Props = {
  edit: TextInlineEditState;
  imageCrop: ImageCrop;
  displayW: number;
  displayH: number;
  onCommit: (content: string) => void;
  onCancel: () => void;
};

export function TextInlineEditor({
  edit,
  imageCrop,
  displayW,
  displayH,
  onCommit,
  onCancel,
}: Props) {
  const [value, setValue] = useState(edit.kind === "edit" ? edit.content : "");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const finishedRef = useRef(false);

  const fontSize = edit.kind === "edit" ? edit.fontSize : 16;
  const left = ((edit.x - imageCrop.x) / imageCrop.width) * displayW;
  const top = ((edit.y - imageCrop.y) / imageCrop.height) * displayH;
  const fontPx = (fontSize / imageCrop.height) * displayH;

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [edit]);

  const finish = (action: "commit" | "cancel", next?: string) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (action === "commit") onCommit(next ?? value);
    else onCancel();
  };

  return (
    <textarea
      ref={inputRef}
      data-testid="text-inline-input"
      rows={1}
      placeholder="Label"
      aria-label="Text label"
      className="absolute z-20 min-w-[5rem] max-w-[min(16rem,100%)] resize-none rounded border border-primary bg-background/95 px-1.5 py-0.5 text-foreground shadow-sm outline-none ring-2 ring-primary/30"
      style={{
        left,
        top,
        fontSize: fontPx,
        lineHeight: 1.25,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        pointerEvents: "auto",
      }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          finish("commit", value.trim());
        }
        if (e.key === "Escape") {
          e.preventDefault();
          finish("cancel");
        }
      }}
      onBlur={() => {
        const trimmed = value.trim();
        if (edit.kind === "new") {
          if (trimmed) finish("commit", trimmed);
          else finish("cancel");
          return;
        }
        if (trimmed) finish("commit", trimmed);
        else finish("cancel");
      }}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}
