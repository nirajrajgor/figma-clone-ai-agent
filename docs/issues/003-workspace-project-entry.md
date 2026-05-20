# 003 — Workspace and project entry flow

**Type:** AFK  
**Status:** Open  
**Triage:** ready-for-agent  
**Blocked by:** #002

## Parent

[PRD v1: Team Image Annotation](../PRD-v1-image-annotation.md)

## What to build

**Entry flow** end-to-end: Annotator enters **workspace** name → if missing, explicit **Create workspace** → enters **project** name → if missing, explicit **Create project** → lands on project route. Browser URL reflects `/{workspace}/{project}`. Refresh returns to the same project.

No endpoint or UI lists all workspaces or projects on the **instance** (name-based privacy).

## Acceptance criteria

- [ ] Unknown workspace shows confirm UI; only creates workspace on explicit confirm (US 3)
- [ ] Unknown project shows confirm UI; only creates project on explicit confirm (US 5)
- [ ] URL updates to workspace + project segments; bookmark/refresh works (US 6)
- [ ] No global workspace/project directory API or page (US 7)
- [ ] Two browsers using same names reach the same project data (US 8)
- [ ] Workspace deletion not exposed in UI (US 16)

## Blocked by

- #002 — Runnable team instance shell

## User stories

2, 3, 4, 5, 6, 7, 8, 16, 59, 60
