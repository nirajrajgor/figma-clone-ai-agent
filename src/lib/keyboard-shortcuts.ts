import { ANNOTATION_TOOLS } from "@/components/annotation-tools";

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/i.test(navigator.platform);
}

export function formatModKey(key: string): string {
  return isMacPlatform() ? `⌘${key}` : `Ctrl+${key}`;
}

export function formatShiftModKey(key: string): string {
  return isMacPlatform() ? `⌘⇧${key}` : `Ctrl+Shift+${key}`;
}

export type ShortcutItem = { label: string; keys: string };
export type ShortcutSection = { title: string; items: ShortcutItem[] };

/** Human-readable shortcut catalog for markup editor help UI. */
export function buildMarkupShortcutSections(): ShortcutSection[] {
  const shiftArrow = isMacPlatform() ? "⇧ + arrow keys" : "Shift + arrow keys";

  return [
    {
      title: "Tools",
      items: ANNOTATION_TOOLS.map((t) => ({ label: t.label, keys: t.shortcut })),
    },
    {
      title: "Edit",
      items: [
        { label: "Undo", keys: formatModKey("Z") },
        { label: "Redo", keys: formatShiftModKey("Z") },
        { label: "Copy", keys: formatModKey("C") },
        { label: "Paste", keys: formatModKey("V") },
        { label: "Duplicate", keys: formatModKey("D") },
        { label: "Delete", keys: "Delete" },
      ],
    },
    {
      title: "Groups",
      items: [
        { label: "Group", keys: formatModKey("G") },
        { label: "Ungroup", keys: formatShiftModKey("G") },
      ],
    },
    {
      title: "Arrange",
      items: [
        { label: "Bring forward", keys: formatModKey("]") },
        { label: "Send backward", keys: formatModKey("[") },
      ],
    },
    {
      title: "Selection",
      items: [
        { label: "Nudge", keys: "← ↑ → ↓" },
        { label: "Nudge 10px", keys: shiftArrow },
      ],
    },
    {
      title: "View",
      items: [
        { label: "Zoom in", keys: "+" },
        { label: "Zoom out", keys: "−" },
        { label: "Fit to screen", keys: "0" },
        { label: "Zoom 100%", keys: "1" },
      ],
    },
  ];
}

export function tooltipWithShortcut(action: string, keys: string): string {
  return `${action} (${keys})`;
}
