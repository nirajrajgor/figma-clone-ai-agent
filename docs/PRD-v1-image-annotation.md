# PRD: Team Image Annotation (v1)

**Status:** Ready for implementation  
**Domain glossary:** [CONTEXT.md](../CONTEXT.md)  
**Related ADR:** [0001-name-based-access-and-collaboration.md](./adr/0001-name-based-access-and-collaboration.md)

---

## Problem Statement

Teams need to explain or highlight something on a screenshot or photo without scheduling a meeting. Generic image editors focus on pixels; design tools like Figma are heavy and account-driven. Annotators want a lightweight, Figma-like canvas—shapes, arrows, text, and pen strokes over an image—and a simple way to hand results to others (e.g. paste into Slack). They do not want login flows or IT-heavy setup, but they do want a shared place where everyone on the team can open the same investigation if they know where it lives.

## Solution

A **team instance** of an image annotation product: browser UI plus a backing service with persistent storage (SQLite). Annotators enter a **workspace** name and **project** name (no login); unknown names require explicit **Create workspace** / **Create project** confirmation. Inside a project they manage many **markup sessions**—each with one **base image** and a **markup stack** of objects—using rectangle, straight arrow, medium text, and freehand tools. They pan/zoom the **canvas viewport**, multi-select objects, undo local edits, and **export** a full-resolution PNG. Access is **name-based**; collaboration within a project is **open**; concurrent edits use **last write wins** on save.

## User Stories

### Instance and access

1. As an Annotator, I want to open the product in my browser against my team’s instance URL, so that I can start work without installing an app.
2. As an Annotator, I want to enter a workspace name without logging in, so that I can reach my team’s namespace quickly.
3. As an Annotator, I want to confirm **Create workspace** when the workspace does not exist, so that typos do not create junk workspaces.
4. As an Annotator, I want to enter a project name after choosing a workspace, so that I can scope work to one effort.
5. As an Annotator, I want to confirm **Create project** when the project does not exist, so that typos do not create empty projects.
6. As an Annotator, I want the browser URL to reflect my workspace and project after I open them, so that refresh and bookmarks return me to the same project.
7. As an Annotator, I want the instance to never list all workspaces or projects, so that name-based privacy is preserved.
8. As an Annotator, I want anyone who knows my workspace and project names to access the same data on the team instance, so that we share one source of truth without accounts.

### Project and session navigation

9. As an Annotator, I want to see a list of markup sessions in my project with thumbnail, session title, and created time, so that I can find the right screenshot in a busy project.
10. As an Annotator, I want to create a new markup session by uploading a base image and providing a required session title, so that each screenshot is labeled meaningfully.
11. As an Annotator, I want to edit a session title later, so that I can fix naming mistakes without losing the session.
12. As an Annotator, I want the URL to include a stable session id when I open a session, so that bookmarks and shared links open the exact canvas even if the title changes.
13. As an Annotator, I want to open a session from the list and land on the canvas editor, so that I can continue annotating.
14. As an Annotator, I want to delete a markup session I no longer need, so that the project stays tidy.
15. As an Annotator, I want to delete an entire project after re-typing its name, so that I can remove mistaken or finished investigations deliberately.
16. As an Annotator, I want workspace deletion to be unavailable in the UI, so that I cannot accidentally wipe an entire namespace.

### Base image

17. As an Annotator, I want to upload PNG, JPEG, or WebP as the base image, so that common screenshots and photos work.
18. As an Annotator, I want the base image to sit under all markup and not be selectable as a markup object, so that I only edit annotations.
19. As an Annotator, I want to replace the base image in an existing session after explicit confirmation, so that I can fix a wrong upload.
20. As an Annotator, I want replace base image to clear all markup, so that misaligned annotations are not left on a new image.
21. As an Annotator, I want to delete the session and start over as an alternative to replace, so that I can recover from bad state.

### Canvas viewport and artboard

22. As an Annotator, I want the artboard (white frame around the image) to fit the viewport when I open a session, so that I see the whole screenshot first.
23. As an Annotator, I want to pan and zoom the canvas (Space+drag, Alt+drag, or scroll wheel toward the cursor), so that I can annotate small UI details on large images.
24. As an Annotator, I want markup objects to stay aligned with the image inside **frame content** when I pan and zoom, so that annotations remain correct.
25. As an Annotator, I want to select the frame by clicking the base image or artboard padding with the select tool, so that the editor feels like a familiar design canvas.
26. As an Annotator, I want drawing tools to only place markup inside the image area, so that annotations stay on the screenshot.

### Markup tools — rectangle

27. As an Annotator, I want to draw a rectangle markup object, so that I can highlight a region.
28. As an Annotator, I want to set stroke color and width on rectangles, so that highlights are visible.
29. As an Annotator, I want to toggle optional semi-transparent fill on rectangles, so that I can use outline-only or filled highlights.
30. As an Annotator, I want a sensible default (light fill) when creating rectangles, so that region highlights work without extra clicks.

### Markup tools — arrow

31. As an Annotator, I want to draw a straight arrow between two points, so that I can point at a specific element.
32. As an Annotator, I want to set stroke color and width on arrows, so that arrows match my annotation style.
33. As an Annotator, I want only straight arrows in v1, so that the tool stays simple and predictable.

### Markup tools — text

34. As an Annotator, I want to place text markup for short labels, so that I can say “click here” or describe a step.
35. As an Annotator, I want to set font size and color on text, so that labels are readable.
36. As an Annotator, I want bold and italic on text, so that I can emphasize words.
37. As an Annotator, I want a simple background pill behind text, so that labels stay readable on busy screenshots.
38. As an Annotator, I want text alignment controls, so that labels line up cleanly.
39. As an Annotator, I want one built-in sans font without a font picker, so that v1 stays minimal.

### Markup tools — freehand

40. As an Annotator, I want to draw freehand strokes with the pen tool, so that I can circle or underline quickly.
41. As an Annotator, I want each pen-down to pen-up stroke to be one markup object, so that I can select and delete strokes independently.
42. As an Annotator, I want no eraser tool in v1, so that removal is via selection, delete, or undo.
43. As an Annotator, I want to set stroke color and width for freehand strokes, so that pen matches other tools.

### Selection and stack order

44. As an Annotator, I want to select a single markup object, so that I can move or style it.
45. As an Annotator, I want to multi-select via shift-click and marquee, so that I can move or delete several objects at once.
46. As an Annotator, I want to move selected objects on the canvas, so that I can adjust layout after drawing.
47. As an Annotator, I want to delete selected objects, so that I can remove mistakes.
48. As an Annotator, I want to reorder objects in the markup stack (bring forward / send back), so that overlapping annotations look correct.
49. As an Annotator, I want no persistent groups in v1, so that the mental model stays flat objects plus z-order.

### Undo and persistence

50. As an Annotator, I want undo and redo for my edits within the current session, so that I can recover from mistakes.
51. As an Annotator, I want undo to cover add, delete, move, and style changes, so that common edits are reversible.
52. As an Annotator, I want my undo stack to be local to my editor in v1, so that expectations match last-write-wins persistence.
53. As an Annotator, I want markup changes saved to the team instance (debounced or on meaningful actions), so that others can see my work when they open the session.
54. As an Annotator, I want concurrent edits on the same session to resolve with last write wins, so that we do not need real-time infrastructure in v1.
55. As an Annotator, I want no live cursors or live object sync in v1, so that the product remains simple to build and operate.

### Export

56. As an Annotator, I want to export the current session as PNG, so that I can paste or attach it elsewhere.
57. As an Annotator, I want export to render the full base image at original resolution with all markup, so that recipients see the entire screenshot annotated correctly.
58. As an Annotator, I want export to ignore my current zoom and pan, so that export is always the full canvas (artboard padding is editor chrome only).
59. As a recipient (outside the product), I want to receive a flat image only, so that I can view annotations without opening the app.

### Collaboration and security expectations

60. As an Annotator, I want anyone with the project path to create sessions and edit any markup, so that the team collaborates openly in v1.
61. As an Annotator, I want to rely on unguessable workspace and project names for access control, so that we avoid login while accepting security trade-offs documented in the ADR.
62. As an Annotator, I want to understand that short or predictable names are unsafe, so that I choose names accordingly.

### Open collaboration edge cases

63. As an Annotator, I want another Annotator’s saved changes to appear when I refresh or reopen a session, so that the team instance stays shared.
64. As an Annotator, I want to accept that another Annotator may overwrite my recent changes if we edit simultaneously, so that expectations match last-write-wins.

## Implementation Decisions

### Architectural shape

- **Two-tier deployment:** Browser UI (SPA or equivalent) + HTTP API backing service on a **team instance**. Developers may run a local instance for dev; production is one shared instance per team (LAN or small server).
- **Persistence:** SQLite on the server for workspaces, projects, markup sessions, base image blobs (or filesystem paths), and serialized markup stacks. Aligns with option C from discovery (browser UI + local/team service).
- **Authorization:** No login. API validates **project path** and **session path** segments; mutating operations require knowing correct names. No global listing endpoints.
- **Collaboration model:** Per ADR 0001 — name-based access, open collaboration, last-write-wins on persisted session document.

### Proposed modules (deep where possible)

| Module | Responsibility | Interface sketch |
|--------|----------------|------------------|
| **Markup document** | In-memory model of one session: base image reference + ordered markup stack; add/update/delete objects; z-order; serialize/deserialize for API | `load(snapshot) → doc`, `apply(op) → doc`, `toSnapshot()` |
| **Undo history** | Command stack on top of markup document for one editor session | `execute(cmd, doc)`, `undo(doc)`, `redo(doc)` |
| **Canvas viewport** | Map image coordinates ↔ screen; fit-on-open; pan/zoom state (UI-facing) | `fitToView(imageSize, viewSize)`, `screenToImage(pt)`, `imageToScreen(pt)` |
| **Hit testing & selection** | Given point/rect in image space, which markup objects are hit; marquee selection | `hitTest(doc, pt)`, `selectInRect(doc, rect)` |
| **Tool controllers** | Rectangle, arrow, text, freehand creation gestures → new markup objects | Each returns partial object or completed object on gesture end |
| **Export compositor** | Deterministic render: base image pixels + markup stack → PNG buffer at base image dimensions | `render(baseImage, markupStack) → pngBytes` (no DOM; testable with canvas headless or sharp/node-canvas) |
| **Session repository** | CRUD workspaces, projects, sessions; store blobs and markup JSON | Repository pattern over SQLite |
| **HTTP API** | REST (or RPC) for entry, project session list, session load/save, image upload, export, deletes | Documented request/response contracts per resource |
| **Routing shell** | Entry flow, project session list, editor route with workspace/project/session id in URL | Front-end routes mirror **entry flow**, **project path**, **session path** |
| **Editor shell** | Composes viewport, tool rail, left sidebar (sessions + layers tree), right properties panel, selection handles, save loop to API | Orchestrates modules above |

**Module check (for you):** Does this split match how you want to build it? When implementation starts, specify which modules should get automated tests (recommended deep modules: **Markup document**, **Undo history**, **Export compositor**, **Session repository**).

### Data model (logical)

- **Workspace:** `name` (unique per instance), `createdAt`
- **Project:** `workspaceName`, `name` (unique per workspace), `createdAt`
- **Markup session:** `sessionId` (stable id), `projectRef`, `title`, `createdAt`, `baseImage` (format, bytes or storage key, width, height), `markupStack` (ordered JSON array of markup objects)
- **Markup object (discriminated union):** common fields `id`, `type`, `zIndex`, `strokeColor`, `strokeWidth`; type-specific geometry in **image coordinates** (not screen pixels)

Markup object types v1:

- `rectangle`: `x`, `y`, `width`, `height`, `fillColor`, `fillEnabled`
- `arrow`: `x1`, `y1`, `x2`, `y2`
- `text`: `x`, `y`, `content`, `fontSize`, `color`, `bold`, `italic`, `backgroundEnabled`, `alignment`
- `freehand`: `points[]` (polyline in image space)

### API contracts (behavioral)

- `GET /workspaces/:name/exists` or fold into create flow — optional; UI can POST create after “not found”
- `POST /workspaces` — create workspace (explicit)
- `GET /workspaces/:ws/projects/:name` — open project metadata + session list (thumbnails)
- `POST /workspaces/:ws/projects` — create project
- `DELETE /workspaces/:ws/projects/:name` — delete project (body: confirm name)
- `POST .../sessions` — create session (multipart: image + title) → returns `sessionId`
- `GET .../sessions/:sessionId` — full session (image URL + markup stack)
- `PUT .../sessions/:sessionId` — save markup stack (last write wins)
- `PUT .../sessions/:sessionId/title`
- `PUT .../sessions/:sessionId/base-image` — replace + clear markup (confirm flag)
- `DELETE .../sessions/:sessionId`
- `GET .../sessions/:sessionId/export` — PNG full canvas

Thumbnails: server-generated on upload or on first list access; small JPEG/PNG stored alongside session.

### Editor interactions

- Toolbar selects active **markup tool**; properties panel edits selection or defaults for new objects.
- Save: debounced `PUT` of markup stack after local edits; editor reloads on manual refresh if another Annotator saved.
- Multi-select: shift-click toggle; marquee adds to selection; move/delete applies to all selected.
- Replace base image: modal with strong confirm; API clears stack server-side.

### Technology (decided)

- **Next.js** (App Router): UI + API Route Handlers in one deployable **team instance**. See [ADR 0002](./adr/0002-nextjs-full-stack.md).
- **SQLite** on the server; **Sharp** for thumbnails and **export compositor**.
- Canvas layer: HTML canvas or SVG in image space with viewport transform.
- **Implementation issues:** [docs/issues/README.md](./issues/README.md)

## Testing Decisions

**What makes a good test:** Assert observable behavior at module boundaries — given inputs, expect outputs or persisted state. Do not assert internal private helpers or framework render trees unless testing UI contracts.

| Module | Test? | What to verify |
|--------|-------|----------------|
| **Markup document** | Yes | Stack order, CRUD objects, serialization round-trip |
| **Undo history** | Yes | Undo/redo restores document; branch cleared on new command after undo |
| **Export compositor** | Yes | Output dimensions match base image; known fixture image + objects → snapshot PNG hash or pixel probe |
| **Hit testing & selection** | Yes | Point and rect selection against fixture stack |
| **Session repository** | Yes | Integration tests against SQLite in memory: create workspace/project/session, cascade delete project |
| **HTTP API** | Yes (subset) | Contract tests for happy paths and 404 on wrong paths; no global list endpoints |
| **Tool controllers** | Optional | Gesture → object geometry for arrow/rectangle |
| **Editor shell / Routing** | Playwright E2E | Per-slice specs in `e2e/`; headful default (`npm run e2e`) |

**Prior art:** Greenfield. **Playwright** E2E per vertical slice ([E2E.md](./issues/E2E.md)); unit tests for markup document and export compositor.

## Out of Scope

- Login, accounts, passwords, OAuth
- Viewer vs editor roles; read-only share links (deferred **shareable link**)
- Real-time sync, live cursors, CRDT/OT
- Global workspace or project directory UI
- Workspace deletion in UI
- Multi-page files; multiple base images per session
- Pixel editing of base image (crop, filters, heal)
- SVG or GIF as base image; animated GIF
- Ellipse tool; elbow/curved arrows; eraser tool; persistent groups
- Named layer groups in markup stack
- Blur/redact tool; numbered pins
- Font family picker; rich text paragraphs
- Viewport-only export; JPEG export (PNG only v1)
- Cloud-hosted multi-tenant SaaS hardening (rate limits, abuse scanning) beyond team-instance deployment
- Copy/paste markup between sessions; keyboard shortcut catalog as spec’d feature
- Maximum upload size and retention policies (to be set during implementation unless product adds limits)

## Further Notes

- **Issue tracker:** Work is tracked locally under [docs/issues/](./issues/). When GitHub is ready, copy each issue body and label `ready-for-agent`.
- **Security:** Review ADR 0001 with operators; encourage long random project names for sensitive screenshots.
- **v2 (in progress):** [Richer markup and polish](./PRD-v2-markup-and-polish.md)
- **Deferred:** [View-only sharing](./PRD-v2-view-only-sharing.md)
- **Later candidates:** Auth, real-time sync, LAN discovery, share links.
