# 035 — Export blank frame (no image layer)

**Type:** AFK  
**Status:** Ready  
**Triage:** ready-for-agent  
**Blocked by:** None — can start immediately (rebase after 031 if export fails without it)  
**Parallel wave:** 2

## Parent

[README v4](./README-v4.md)

## What to build

Verify and fix **export** for artboards with `imageId: null` (**blank frame**):

- White (or artboard background) canvas at frame dimensions
- All **scene objects** / markup still composited
- No crash when `images` record is empty

Add/update tests in `lib/export/compositor.test.ts`. Manual check via export route optional.

## Acceptance criteria

- [ ] Compositor test: blank artboard + one rectangle exports non-empty PNG buffer
- [ ] Compositor test: blank artboard only exports correct dimensions
- [ ] Existing export tests still pass

## User stories covered

- As a **Designer**, I can export a wireframe I drew without ever adding an image.

## Do not edit

Editor UI components
