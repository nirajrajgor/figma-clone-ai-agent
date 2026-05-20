"use client";

import { ChevronDown, Download } from "lucide-react";
import { useState } from "react";
import { ActionTooltip } from "@/components/action-tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildExportHref,
  DEFAULT_EXPORT_OPTIONS,
  type ExportFormat,
  type ExportOptions,
  type ExportScale,
} from "@/lib/export/export-options";

type Props = {
  exportHref: string;
};

export function ExportMenu({ exportHref }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState<ExportScale>(1);
  const [quality, setQuality] = useState(String(DEFAULT_EXPORT_OPTIONS.quality));

  const customOptions: ExportOptions = {
    format,
    scale,
    quality: Number(quality) || DEFAULT_EXPORT_OPTIONS.quality,
  };
  const customHref = buildExportHref(exportHref, customOptions);

  return (
    <>
      <div className="inline-flex items-stretch rounded-[min(var(--radius-md),12px)] border border-border bg-background">
        <ActionTooltip label="Export full canvas as PNG">
          <a
            href={exportHref}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="export-png"
            className="inline-flex h-7 items-center gap-1.5 rounded-l-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium hover:bg-muted"
          >
            <Download className="size-3.5" />
            Export
          </a>
        </ActionTooltip>
        <DropdownMenu>
          <ActionTooltip label="More export options">
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 shrink-0 rounded-l-none rounded-r-[min(var(--radius-md),12px)] border-l border-border hover:bg-muted"
                  aria-label="Export options"
                  data-testid="export-options-trigger"
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              }
            />
          </ActionTooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              render={
                <a
                  href={buildExportHref(exportHref, { ...DEFAULT_EXPORT_OPTIONS, scale: 2 })}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="export-png-2x"
                />
              }
            >
              PNG (2×)
            </DropdownMenuItem>
            <DropdownMenuItem
              render={
                <a
                  href={buildExportHref(exportHref, { ...DEFAULT_EXPORT_OPTIONS, format: "jpg" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="export-jpg-1x"
                />
              }
            >
              JPG (1×)
            </DropdownMenuItem>
            <DropdownMenuItem
              render={
                <a
                  href={buildExportHref(exportHref, {
                    ...DEFAULT_EXPORT_OPTIONS,
                    format: "jpg",
                    scale: 2,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="export-jpg-2x"
                />
              }
            >
              JPG (2×)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="export-custom-open"
              onClick={() => setDialogOpen(true)}
            >
              Custom export…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Export options</DialogTitle>
            <DialogDescription>
              Choose format, scale, and JPEG quality. Default one-click export remains PNG at 1×.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Format</Label>
              <select
                id="export-format"
                data-testid="export-format-select"
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-scale">Scale</Label>
              <select
                id="export-scale"
                data-testid="export-scale-select"
                value={String(scale)}
                onChange={(e) => setScale(Number(e.target.value) as ExportScale)}
                className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="1">1×</option>
                <option value="2">2×</option>
              </select>
            </div>
            {format === "jpg" && (
              <div className="space-y-2">
                <Label htmlFor="export-quality">JPEG quality</Label>
                <Input
                  id="export-quality"
                  data-testid="export-quality-input"
                  type="number"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              render={
                <a
                  href={customHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="export-custom-download"
                />
              }
              onClick={() => setDialogOpen(false)}
            >
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
