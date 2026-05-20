"use client";

import { Keyboard } from "lucide-react";
import { useMemo } from "react";
import { ActionTooltip } from "@/components/action-tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buildMarkupShortcutSections } from "@/lib/keyboard-shortcuts";

function ShortcutKey({ keys }: { keys: string }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
      {keys}
    </kbd>
  );
}

export function KeyboardShortcutsDialog() {
  const sections = useMemo(() => buildMarkupShortcutSections(), []);

  return (
    <Dialog>
      <ActionTooltip label="Keyboard shortcuts">
        <span className="inline-flex">
          <DialogTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                data-testid="keyboard-shortcuts-open"
                aria-label="Keyboard shortcuts"
              >
                <Keyboard className="size-4" />
              </Button>
            }
          />
        </span>
      </ActionTooltip>
      <DialogContent className="max-h-[min(85vh,640px)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Shortcuts work when the canvas editor is focused and you are not typing in a text
            field.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {sections.map((section) => (
            <section key={section.title}>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li
                    key={`${section.title}-${item.label}`}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span>{item.label}</span>
                    <ShortcutKey keys={item.keys} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
