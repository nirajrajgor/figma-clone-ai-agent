# 026 — Fill / Fit / Crop fill modes

**Type:** AFK  
**Status:** Done  
**Triage:** ready-for-agent  
**Blocked by:** [025](./025-basic-crop.md)

## Parent

[README v3](./README-v3.md)

## Problem

Image layout is manual width/height/offset. Figma uses Fill, Fit, Crop, Tile modes with predictable resize behavior.

## What to build

- Fill mode enum on artboard image layout
- Inspector dropdown: Fill, Fit, Crop (Tile optional)
- Resizing frame recalculates image display per mode
- Migrate existing sessions to default mode matching current 100% fit

## Acceptance criteria

- [x] Mode switch updates image display immediately
- [x] Frame resize preserves mode semantics
- [x] Unit tests for layout resolver per mode

## Mode semantics

- **Fit** (default for new sessions): Contain the cropped image region inside the frame padding area, preserving aspect ratio and centering. Matches legacy 100% intrinsic sizing when the frame was sized to the image.
- **Fill**: Cover the frame padding area with the cropped image region, preserving aspect ratio and centering; overflow is clipped.
- **Crop**: Manual layout using stored `imageOffsetX/Y` and `imageDisplayWidth/Height`. Frame resize does not rescale the image viewport; image can be moved and resized on canvas.

Legacy sessions without `imageFillMode` are migrated on load: layouts matching Fit or Fill are tagged accordingly; otherwise Crop is inferred to preserve manual layouts.
