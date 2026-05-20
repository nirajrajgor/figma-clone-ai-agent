"use client";

import { ImageIcon, Upload, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IMAGE_ACCEPT } from "@/lib/image-mime";
import { isUploadTooLarge, MAX_UPLOAD_BYTES, uploadTooLargeMessage } from "@/lib/upload-limits";

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
  onReject?: (message: string) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
  inputTestId?: string;
  compact?: boolean;
  maxBytes?: number;
};

export function ImageUpload({
  value,
  onChange,
  accept = IMAGE_ACCEPT,
  disabled,
  className,
  inputTestId = "session-image-input",
  compact = false,
  maxBytes = MAX_UPLOAD_BYTES,
  onReject,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const previewUrl = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function pickFile(file: File | undefined) {
    if (!file || disabled) return;
    const allowed = accept.split(",").map((t) => t.trim());
    if (!allowed.includes(file.type)) return;
    if (isUploadTooLarge(file.size) || file.size > maxBytes) {
      onReject?.(uploadTooLargeMessage());
      return;
    }
    onChange(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0]);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        data-testid={inputTestId}
        disabled={disabled}
        onChange={onInputChange}
      />

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-lg border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Selected upload preview"
            className={cn(
              "w-full object-contain",
              compact ? "max-h-20" : "max-h-48",
            )}
          />
          <div className="absolute right-1.5 top-1.5 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size={compact ? "icon-sm" : "sm"}
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              aria-label="Change image"
            >
              {compact ? <Upload className="size-3.5" /> : "Change"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              disabled={disabled}
              aria-label="Remove image"
              onClick={() => onChange(null)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
          {value && !compact && (
            <p className="border-t bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
              {value.name} · {(value.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-center transition-colors",
            compact ? "px-3 py-4" : "gap-2 px-6 py-10",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-muted",
              compact ? "size-8" : "size-10",
            )}
          >
            {dragOver ? (
              <Upload className={cn("text-primary", compact ? "size-4" : "size-5")} />
            ) : (
              <ImageIcon
                className={cn("text-muted-foreground", compact ? "size-4" : "size-5")}
              />
            )}
          </div>
          <span className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
            {compact ? "Upload image" : "Click or drag image here"}
          </span>
          {!compact && (
            <span className="text-xs text-muted-foreground">
              PNG, JPEG, or WebP · max {Math.round(maxBytes / (1024 * 1024))} MB
            </span>
          )}
        </button>
      )}
    </div>
  );
}
