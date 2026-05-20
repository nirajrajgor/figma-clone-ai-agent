# 039 — Markup groups (group / ungroup)

**Type:** AFK  
**Status:** Done  
**Triage:** ready-for-agent  
**Blocked by:** [038](./038-markup-context-menu.md)

## Parent

[PRD v4: Screen design pivot](../PRD-v4-screen-design-pivot.md) — Phase 3 structure (minimal slice)

## What to build

Figma-style **groups** for markup on a frame:

- `group` object in markup stack; children reference `groupId`
- Group / Ungroup via context menu and `Cmd/Ctrl+G`, `Cmd/Ctrl+Shift+G`
- Move, duplicate, delete, z-order apply to the whole group
- Nested **Group** row in layers panel with collapsible children
- Export renders children (group is organizational only)

## Acceptance criteria

- [x] Group 2+ ungrouped shapes into a named Group layer
- [x] Ungroup restores flat layers
- [x] Clicking any group member selects the group; drag moves all children
- [x] Layers panel shows nested group tree
- [x] Unit: `src/lib/markup/groups.test.ts`
- [x] E2E: `e2e/markup-groups.spec.ts`

## Notes

- Copy/paste preserves **group structure** via `src/lib/markup/clipboard.ts`
- **Group resize** scales all members from the group bounding box (`applyResize` on group selection)
