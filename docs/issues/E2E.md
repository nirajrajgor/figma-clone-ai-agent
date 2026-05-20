# E2E testing (Playwright)

Every vertical-slice issue should add or extend specs under `e2e/` so the slice is verifiable **through the browser**, not only via unit tests.

## Agent workflow (required)

When implementing a slice that has UI or full-stack behavior:

1. **Write or extend** a Playwright spec under `e2e/` (map in the table below).
2. **Run headful** so the user can watch: `npm run e2e` (never only headless for “done” on their machine).
3. Optionally filter one file: `npm run e2e -- e2e/003-workspace-project.spec.ts`
4. Fix failures until green before marking the issue done.

Use `npm run e2e:headless` only for quick checks in environments without a display (e.g. sandbox CI). On the user’s machine, **headed is the default verification**.

## Commands

| Command | Mode | Use |
|---------|------|-----|
| `npm run e2e` | **Headful** (browser visible) | **Default** — implementation verification; user watches |
| `npm run e2e:headless` | Headless | CI / no display |
| `npm run e2e:ui` | Playwright UI mode | Debug steps |
| `npm run e2e:report` | Open HTML report | After a run |

## Conventions

- One spec file per issue where practical: `e2e/003-workspace-project.spec.ts`
- Use `data-testid` for stable selectors
- `test.describe` title references local issue id: `Issue #003 — …`
- Acceptance criteria in the issue should map 1:1 to `test()` names where possible

## Running against an existing dev server

```bash
npm run dev
# another terminal:
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run e2e
```

## Per-issue spec map

| Issue | Spec file | Status |
|-------|-----------|--------|
| 002 | `e2e/instance-shell.spec.ts` | Done |
| 003 | `e2e/003-workspace-project.spec.ts` | Done |
| 004 | `e2e/004-session-list.spec.ts` | Done |
| 005 | `e2e/005-view-canvas.spec.ts` | Done |
| Artboard frame | `e2e/artboard-frame.spec.ts` | Done |
| 006–013 | `e2e/006-013-annotation.spec.ts` | Done |
| 021 | `e2e/v3-selection-properties.spec.ts` | Done |
| 022 | `e2e/v3-layers-panel.spec.ts` | Done |
| 023 | `e2e/v3-inline-text.spec.ts` | Done |
| 024 | `e2e/v3-export-artboard.spec.ts` | Done |
| 025 | `e2e/v3-basic-crop.spec.ts` | Done |
| 027 | `e2e/v3-replace-image.spec.ts` | Done |
| 029 | `e2e/v3-export-formats.spec.ts` | Done |
| 036 | `e2e/v4-blank-design-file.spec.ts` | Done |
