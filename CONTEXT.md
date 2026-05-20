# Screen design (evolving)

A lightweight screen-layout product for phone, tablet, and desktop sizes—vector shapes, text, and placed images—with export for handoff. Screenshot annotation remains supported but is no longer the main story. Deep pixel editing (Photoshop-class) is out of scope for the core product.

## Language

**Designer**:
Anyone using the product to create or edit screen layouts (and legacy markup). Not verified by login; they type a workspace name and project name to enter a scope.
_Avoid_: User (when meaning authenticated account), Annotator (legacy name), creator, editor

**Annotator** _(legacy)_:
Former name for **Designer** while the product was annotation-first. Prefer **Designer** in new docs and UI copy.
_Avoid_: User, creator, editor

**Workspace**:
A top-level namespace identified only by a name the **Designer** types (e.g. a team name). Groups **projects**. **Shared namespace**: the same name always refers to the same workspace on the instance. No password—knowing the exact name is the only gate.
_Avoid_: User, account, tenant, org

**Project**:
A container under a workspace for related work. Holds many **design files** over time (e.g. one checkout flow with phone and desktop frames). Access requires knowing both workspace name and project name.
_Avoid_: File (when meaning one design file), document, deck

**Design file**:
One editable canvas document inside a project: zero or more **device frames**, optional **image layers**, and **scene objects**. Identified by a **design file title** (editable), thumbnail, and created timestamp. Stable **session id** in the URL until routes are renamed.
_Avoid_: Page, markup session (prefer in new copy), canvas (the whole app)

**Markup session** _(legacy)_:
Same persisted document as a **design file**. Prefer **design file** in UI and docs.
_Avoid_: Session (ambiguous), file

**Device frame**:
A fixed-width, fixed-height **artboard** sized for a **device category** (phone, tablet, or desktop), usually created from a **device preset**. May be **blank** or contain an **image layer** and **scene objects**. Multiple device frames can sit on one canvas at different positions.
_Avoid_: Breakpoint, responsive variant, viewport (browser)

**Device preset**:
A named template that creates a **device frame** at standard pixel dimensions (e.g. Phone 390×844, Tablet 768×1024, Desktop 1440×900). Custom sizes use the generic frame tool instead.
_Avoid_: Artboard size (generic), breakpoint

**Device category**:
One of phone, tablet, or desktop—the class of screen a **device preset** targets. Not a live preview of another frame’s layout.
_Avoid_: Breakpoint, platform

**Blank frame**:
A **device frame** with no **image layer**—white **frame content** only. Default starting point for layout-first work after the pivot.
_Avoid_: Empty artboard, template

**Artboard**:
The Figma-style white frame on the canvas: fixed pixel width and height, optional **image layer**, and **scene objects** in **frame content**. **Export** renders one artboard at its stored dimensions. Generic frames and **device frames** are both artboards.
_Avoid_: Canvas (the whole app), design file, export bounds

**Frame content**:
The rectangular region inside an **artboard** where content is drawn. Coordinates are measured in frame pixels (origin top-left). An **image layer**, when present, is laid out inside this region; **scene objects** stack above it.
_Avoid_: Layer (Photoshop sense), viewport

**Design file title** _(UI; legacy: session title)_:
A short human-chosen label for one **design file** (e.g. "Login v2"). Editable; not the stable link identifier.
_Avoid_: Filename, slug

**Session id** _(stable id; rename deferred)_:
An instance-assigned identifier for one **design file**. Appears in the browser URL so refresh and bookmarks reopen the same document.
_Avoid_: Slug, UUID (in glossary), design file title

**Session path** _(legacy route shape)_:
The triple (workspace name, project name, session id) that selects exactly one **design file**.
_Avoid_: URL, deep link

**Image layer**:
An optional bitmap placed inside **frame content** (PNG, JPEG, WebP). Shown as **Image** in the **layers panel**. Supports **light image edit** (crop, opacity, corner radius; more in later phases)—not destructive Photoshop editing.
_Avoid_: Base image (legacy), background, canvas

**Base image** _(legacy)_:
Former term for the required screenshot in annotation-first flows. After the pivot, use **image layer**; uploads are optional when creating a **design file**.
_Avoid_: Background layer, layer zero

**Replace image** _(UI; legacy: replace base image)_:
Swaps the **image layer** on a frame. Same dimensions can keep **scene objects**; different dimensions may prompt to clear objects that would no longer align.
_Avoid_: Re-upload, pixel edit

**Light image edit**:
Non-destructive adjustments to an **image layer** (crop, opacity, corner radius; later brightness/saturation)—not clone stamp, healing, or channel masks.
_Avoid_: Retouch, Photoshop, filter stack

**Scene object**:
Any selectable item on a frame except the frame chrome itself: rectangles, ellipses, lines, text, **image layer** (as a row), and legacy markup types. Each can be moved, resized, and reordered; multi-select via marquee or shift-click. Persistent **groups** come in a later phase.
_Avoid_: Layer (ambiguous), element, node

**Markup object** _(legacy subtype)_:
A **scene object** created for annotation-style work (arrow, freehand, redact, etc.). Layout primitives (rectangle, ellipse, line, text) serve both design and review.
_Avoid_: Shape (generic), widget

**Object stack** _(legacy: markup stack)_:
The ordered list of **scene objects** above the **image layer** (if any), back to front. Reorder with bring forward / send backward.
_Avoid_: Scene graph, layers panel

**Layers panel**:
The left-sidebar tree below the design-file list (Figma-style). Each **artboard** is a root **Frame** row; expand for **image layer** (if any) and **scene objects**. Click to select; order matches z-order. Properties live in the **inspector**.
_Avoid_: Photoshop layer groups (until **groups** ship)

**Design tool**:
A toolbar mode that creates or edits **scene objects** (select, frame, rectangle, ellipse, line, text, etc.).
_Avoid_: Markup tool (legacy), brush

**Review tool**:
A **design tool** aimed at the **secondary job**: arrow, freehand, redact—annotate screenshots rather than build UI from scratch. Kept in the product; not the default onboarding path after the pivot.
_Avoid_: Markup tool (when meaning review only), comment tool

**Markup tool** _(legacy)_:
Former umbrella for all tools. Prefer **design tool** or **review tool**.
_Avoid_: Brush, filter

**Text markup**:
A markup object for short labels. v1 styling: content, font size, color, bold and italic, simple background pill for contrast, and text alignment. One built-in sans font family—no font picker.
_Avoid_: Rich text, paragraph, Word (document)

**Arrow markup**:
A straight line with an arrowhead at the end, defined by start and end points. No elbow connectors or curved paths in v1.
_Avoid_: Connector, line (generic), vector path

**Rectangle markup**:
A rectangular markup object with stroke color and width. Fill is optional: Annotator can use outline-only or a semi-transparent fill (default favors a light fill for region highlights).
_Avoid_: Box, region, highlight (verb)

**Ellipse markup**:
An elliptical markup object defined by a bounding box (same drag gesture as rectangle). Stroke and optional semi-transparent fill behave like **rectangle markup**.
_Avoid_: Circle tool (when meaning perfect circle only), oval (generic)

**Line markup**:
A straight segment between two points with no arrowhead—stroke color and width only. For underlines and dividers; use **arrow markup** when the end needs a pointer.
_Avoid_: Arrow (generic), connector, vector path

**Redact markup**:
A rectangular region drawn to hide sensitive content on the **base image** in the canvas and in **export**. Renders as an opaque neutral overlay (not a preview of blurred pixels). Does not delete base-image pixels on the server.
_Avoid_: Blur tool, mosaic, crop, pixel edit

**Freehand markup**:
One continuous pen stroke from pointer down to pointer up is one markup object. No eraser tool in v1—remove via selection + delete or **Undo**.
_Avoid_: Brush, path (generic), drawing layer

**Instance**:
One running deployment of the product (browser UI + backing service) used by a team. Reachable on the network without login. Workspaces and projects on that instance are shared by everyone who can reach it and knows the names. Typical setup: a single team instance on a LAN or small server; developers may run a separate local instance for dev only.
_Avoid_: Localhost, server, deployment, environment (technical)

**Entry flow**:
First visit: **Designer** types workspace name, then project name—no global directory of workspaces. After opening a project, the URL reflects workspace and project. The instance never lists all workspace or project names.
_Avoid_: Sign up, login, home dashboard, gallery of all projects

**Project path**:
The pair (workspace name, project name) that selects exactly one project on the instance when both are known.
_Avoid_: URL, route, deep link

**Workspace creation**:
A workspace does not exist until a **Designer** confirms **Create workspace** after entering a new name. Same pattern as **Project creation**.
_Avoid_: Auto-provision, sign up

**Project creation**:
A project does not exist until a **Designer** confirms **Create project** after entering a new name.
_Avoid_: Auto-provision, sign up

**Name-based access**:
Authorization in v1: no accounts or passwords. Anyone who can reach the instance and knows the exact workspace name and project name can open that project. Security relies on unguessable names, not identity proof.
_Avoid_: Auth, login, RBAC, public/private flag

**Open collaboration**:
Within a known project, every **Designer** has the same powers: create **design files**, edit any **scene object**, reorder stacks, and delete files or objects. No viewer/editor distinction (see deferred **view link**).
_Avoid_: Read-only, permissions, role

**Design file deletion** _(legacy: session deletion)_:
Any **Designer** with the project path can permanently remove one **design file** and all its frames and objects.

**Project deletion**:
Removes the project and all its **design files**. Requires explicit confirmation (e.g. re-typing the project name).

**Workspace deletion**:
Not offered in v1—workspaces are retired only via operator/server tooling later if needed.
_Avoid_: Archive, soft delete

**Concurrent editing**:
When multiple **Designers** edit the same **design file**, saves persist to the instance; latest write wins on conflict. No live cursors or CRDT in core scope.
_Avoid_: Real-time, multiplayer, OT

**Canvas viewport**:
How the **Designer** sees frames on the infinite canvas: gray workspace, white frames, pan, and zoom. Pan with Space+drag or Alt+drag; scroll wheel zooms toward the cursor. **Scene objects** are fixed to **frame content**, not the browser window.
_Avoid_: Scroll container, camera (implementation)

**Undo**:
Reverses the **Designer**'s recent edits in the current **design file** (local editor history—not shared across collaborators or files).
_Avoid_: History, version control, revert (project)

**Export**:
A flat raster (PNG default; JPEG/WebP optional) of the active **artboard** at frame pixel size: background, **image layer** if any, and all **scene objects** (including **redact markup**). Ignores viewport zoom/pan. Primary handoff to devs or stakeholders.
_Avoid_: Share link, viewport screenshot, editable handoff

**Keyboard shortcut**:
A key chord in the session editor that runs an action without using the toolbar (e.g. switch **markup tool**, undo, delete selection, duplicate). Shortcuts are disabled while focus is in a text field.
_Avoid_: Hotkey (implementation), accelerator

**Save status**:
Feedback showing whether changes to the **design file** are saved, in flight, or failed.
_Avoid_: Sync indicator, online status

## Out of scope (pivot)

**Component**:
A reusable master with instances and overrides (Figma-style). Not in phase 1–2.
_Avoid_: Symbol, widget library

**Prototype**:
Clickable flows between frames. Not in core scope.
_Avoid_: Interaction, hotspot

**Responsive variant**:
One layout that reflows across breakpoints with constraints. Replaced by separate **device frames** per size in phase 1.
_Avoid_: Breakpoint, auto-layout

**Design token**:
Named variables for color, spacing, and type shared across files. Deferred.
_Avoid_: Theme, variable collection

**View link** _(deferred)_:
Future: a URL with an opaque token to open one markup session read-only without workspace/project names. Not in v2.
_Avoid_: Shareable link, public URL, embed

**Primary job**:
Design screen layouts for mobile, tablet, and desktop sizes so others can review or implement the UI—starting from device-sized frames, not from a required screenshot upload.
_Avoid_: Retouch photos, build production apps, replace Figma entirely

**Secondary job** _(legacy, retained)_:
Explain or highlight something on an image (arrows, redact, markup over a screenshot) when a **Designer** is reviewing or sharing findings—not the headline use case after the pivot.
_Avoid_: Primary job, full image editor

## Example dialogue

> **Dev:** Is a project one screen or many?
> **Expert:** Many **design files** per project. One file might hold phone and desktop **device frames** side by side for the same login flow.
> **Dev:** Do I need a screenshot to start?
> **Expert:** No—pick a **device preset**, get a **blank frame**, draw rectangles and text. Drop an **image layer** only if you need a photo or screenshot under the layout.
> **Dev:** How is tablet different from responsive design?
> **Expert:** Separate **device frames** with fixed sizes—not one frame that morphs at breakpoints.
> **Dev:** How do we hide a password in a screenshot review?
> **Expert:** **Review tool** → **redact markup**. Shows in **export**. That's the **secondary job**, not building the UI from scratch.
