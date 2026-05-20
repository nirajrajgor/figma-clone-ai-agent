# Screen-design pivot (device frames, not responsive engine)

The product pivots from screenshot annotation to lightweight screen layout for phone, tablet, and desktop. Each target size is a separate **device frame** (fixed pixel dimensions) on one infinite canvas inside a **design file**—the Figma pattern, not a single artboard with breakpoint toggles or linked responsive variants.

**Considered:** breakpoint preview mode, separate files per device, rebuilding as a full Figma/Photoshop clone.

**Rejected because:** the codebase already stores multiple positioned artboards per session; breakpoint/responsive systems are a multi-quarter scope trap; separate files fragment one feature across sessions.

**Consequences:** new files may start with an empty device frame (no upload); annotation tools remain but are secondary; Photoshop-class editing stays out of core scope; URLs and storage may keep `session` naming until a later rename.
