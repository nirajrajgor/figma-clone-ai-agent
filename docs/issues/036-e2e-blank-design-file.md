# 036 — E2E: blank design file + preset create

**Type:** AFK  
**Status:** Ready  
**Triage:** ready-for-agent  
**Blocked by:** [032](./032-create-dialog-presets.md)  
**Parallel wave:** 3

## Parent

[README v4](./README-v4.md) · [E2E conventions](./E2E.md)

## What to build

Playwright spec `e2e/030-v4-blank-design-file.spec.ts` (or `e2e/v4-blank-design-file.spec.ts`):

1. Create project → **new design file** with Phone preset, **no image**
2. Editor loads; active frame visible; `base-image` absent or hidden
3. Draw rectangle; export PNG; assert reasonable dimensions (390×844 at 1x or scaled per export options)
4. Optional: add Tablet frame from editor (if 034 merged), assert two frames visible

Extend `e2e/helpers.ts` with `createBlankDesignFile(page, preset?)`.

## Acceptance criteria

- [ ] `npm run e2e -- e2e/...blank-design-file...` passes headful
- [ ] Test names map to issue acceptance criteria
- [ ] No changes to production code except `data-testid` gaps

## User stories covered

- End-to-end verification of phase 1 tracer bullet.

## Blocked by

032 must be merged (create flow). 034 optional for second test.
