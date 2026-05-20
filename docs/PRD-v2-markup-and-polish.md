# PRD: Richer markup and editor polish (v2)

**Status:** Implemented  
**Domain glossary:** [CONTEXT.md](../CONTEXT.md)  
**Parent:** [PRD v1](./PRD-v1-image-annotation.md)  
**Deferred:** [View-only sharing](./PRD-v2-view-only-sharing.md), auth, real-time sync

---

## Problem Statement

v1 covers the core annotate-and-export loop with rectangle, arrow, text, and pen—but teams still reach for other tools when highlighting ovals, drawing plain lines, or hiding credentials in screenshots. The editor also lacks everyday speed features (tool shortcuts, duplicate, save feedback) that make repeated annotation sessions feel rough.

## Solution

v2 extends the same **markup session** model with three new **markup tools** (ellipse, line, redact) and a **polish** pass on the session editor: keyboard shortcuts, duplicate/copy-paste within a session, save status, zoom controls, and clearer upload validation. No login, no share links, no collaboration model changes (ADR 0001 unchanged).

## User Stories

### Richer markup — ellipse

1. As an Annotator, I want an ellipse tool, so that I can circle UI elements that are not rectangular.
2. As an Annotator, I want ellipse stroke color, width, and optional fill like rectangles, so that styling stays consistent.
3. As an Annotator, I want ellipses to select, move, resize, reorder, and delete like other markup objects.

### Richer markup — line

4. As an Annotator, I want a straight line tool without an arrowhead, so that I can underline or separate regions.
5. As an Annotator, I want line stroke color and width, so that lines match my annotation style.
6. As an Annotator, I want lines to participate in multi-select, move, z-order, undo, and export like other objects.

### Richer markup — redact

7. As an Annotator, I want a redact tool to draw opaque regions over sensitive areas, so that I can share screenshots more safely.
8. As an Annotator, I want redact regions to appear in **export** as opaque overlays, so that handoff matches what I see on canvas.
9. As an Annotator, I want redact objects movable and deletable like other markup, so that I can fix mistakes without replacing the base image.

### Editor polish — shortcuts and productivity

10. As an Annotator, I want keyboard shortcuts to switch tools and run common actions, so that I work faster.
11. As an Annotator, I want shortcuts disabled while typing in text fields, so that I do not trigger tools accidentally.
12. As an Annotator, I want to duplicate selected markup objects, so that I can repeat similar callouts quickly.
13. As an Annotator, I want copy and paste of selected markup within the same session, so that I can reuse shapes.

### Editor polish — feedback and navigation

14. As an Annotator, I want visible **save status** (saved / saving / error), so that I know when collaborators will see my changes.
15. As an Annotator, I want zoom controls (fit, 100%, zoom in/out), so that I can navigate large screenshots without only the scroll wheel.
16. As an Annotator, I want a clear error when an upload exceeds the instance limit, so that I know why an image was rejected.

## Implementation Decisions

### Markup object types (additions)

| Type | Geometry | Style | Notes |
|------|----------|-------|--------|
| `ellipse` | bounding box `x,y,width,height` | stroke, optional fill (like rectangle) | Hit test: ellipse interior |
| `line` | `x1,y1,x2,y2` | stroke only | Distinct from `arrow` (no head) |
| `redact` | `x,y,width,height` | fill color fixed neutral (e.g. `#1a1a1a`); no stroke in v2 | Render above base image in canvas + compositor |

Extend **markup document**, **hit testing**, **render-svg**, **export compositor**, toolbar, property panel, undo, and persistence (JSON stack) for all three types.

### Keyboard shortcuts (v2 defaults)

| Action | Shortcut |
|--------|----------|
| Select tool | `V` |
| Rectangle | `R` |
| Ellipse | `O` |
| Arrow | `A` |
| Line | `L` |
| Text | `T` |
| Freehand | `P` |
| Redact | `X` |
| Undo / Redo | `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z` (existing) |
| Delete selection | `Delete` / `Backspace` (existing) |
| Duplicate | `Cmd/Ctrl+D` |
| Copy / Paste | `Cmd/Ctrl+C`, `Cmd/Ctrl+V` |
| Group / Ungroup | `Cmd/Ctrl+G`, `Cmd/Ctrl+Shift+G` |
| Zoom in / out / fit / 100% | `+` / `-` / `0` / `1` (when canvas focused) |

Show shortcut hints in tool tooltips or a small cheatsheet link in the editor.

### Markup context menu

Right-click the **canvas** or a **layers** row (when the select tool is active and text is not being edited):

| Action | Shortcut (menu hint) |
|--------|----------------------|
| Copy | `Cmd/Ctrl+C` |
| Paste | `Cmd/Ctrl+V` |
| Duplicate | `Cmd/Ctrl+D` |
| Bring forward | — |
| Send backward | — |
| Group | `Cmd/Ctrl+G` |
| Ungroup | `Cmd/Ctrl+Shift+G` |
| Edit text | — (single text layer only) |
| Delete | — |

Right-click on a shape selects it if not already selected (Shift+right-click toggles multi-select). Layer order actions match the toolbar bring-forward / send-backward buttons.

### Upload limit

- Server enforces max base image size (e.g. 15 MB); return `413` with message.
- Client validates before upload where possible.

### Modules (delta from v1)

| Module | Change |
|--------|--------|
| Markup document / types | New discriminated variants |
| Tool controllers | Ellipse, line, redact gestures |
| Hit test & render & export | Per-type geometry |
| Annotation editor | Toolbar, shortcuts, context menu, save status, zoom UI, clipboard |
| API | Optional: none beyond existing session save |

### Testing

- Unit: document round-trip, hit test, export fixtures for new types
- E2E: one spec per new tool; shortcuts smoke test; `e2e/markup-context-menu.spec.ts`; redact visible in export download

## Out of Scope (v2)

- View links, auth, real-time sync
- True Gaussian blur of base-image pixels (redact is overlay only)
- Ellbow/curved arrows, eraser tool, numbered pins, font picker
- Copy/paste across sessions; persistent groups
- JPEG export; workspace deletion UI
- Share link / Viewer flows

## Further Notes

- **Issues:** [docs/issues/README-v2.md](./issues/README-v2.md)
- **Deferred sharing PRD:** [PRD-v2-view-only-sharing.md](./PRD-v2-view-only-sharing.md)
