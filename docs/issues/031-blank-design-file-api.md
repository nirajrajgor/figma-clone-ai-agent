# 031 — Create design file without image (API)

**Type:** AFK  
**Status:** Ready  
**Triage:** ready-for-agent  
**Blocked by:** None — can start immediately  
**Parallel wave:** 1

## Parent

[README v4](./README-v4.md)

## What to build

End-to-end **backend** path to create a **design file** (persisted markup session) with a **blank frame** and **no image layer**.

1. Add `createBlankInitialSessionDocument(title, frameSize?)` in `session-document.ts` using existing `createEmptyArtboard` / default size (640×480) or optional size param.
2. Extend `createSession` in `repository.ts` to accept optional image; when omitted, store document with `imageId: null`, no entries in `images`, sensible placeholder thumbnail or null thumbnail path.
3. `POST .../sessions`: accept `title` + optional `image` file + optional `preset` (or `frameWidth`/`frameHeight`). If no image, create blank document. If `preset` provided, use sizes from `device-presets` (import 030 or inline sizes if 030 not merged yet—prefer importing 030).

Request shapes (pick one and document in code):

- **A:** `multipart` with only `title` + optional `preset=phone|tablet|desktop`
- **B:** JSON body for blank create — only if consistent with existing FormData flow

Keep existing image upload path unchanged.

## Acceptance criteria

- [ ] `POST` with title only returns `201` and valid `sessionId`
- [ ] Stored document has one artboard, `imageId: null`, empty `markupStack`
- [ ] `POST` with title + image still works as today
- [ ] Vitest for `createBlankInitialSessionDocument` and repository create without image
- [ ] No UI changes in this slice

## User stories covered

- As a **Designer**, I want to start a layout without uploading a screenshot.

## Do not edit

`session-create-dialog.tsx`, `annotation-editor.tsx`, `annotation-tools.tsx`
