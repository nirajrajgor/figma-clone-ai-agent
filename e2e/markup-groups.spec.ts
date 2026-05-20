import { expect, test } from "@playwright/test";
import {
  countMovedBoxes,
  createSession,
  deleteTestProject,
  clickFrameContent,
  doubleClickFrameContent,
  dragFrameContent,
  drawLineAndRectangle,
  drawRectangleAndEllipse,
  expandFirstGroupInLayers,
  fetchMarkupStack,
  focusEditor,
  getShapeBoxes,
  groupViaCanvasMenu,
  markupShapes,
  openCanvasContextMenu,
  openLayerContextMenu,
  openSession,
  selectGroupRows,
  selectLayerItems,
  setupProject,
  shiftUndoMod,
  totalBoxMovement,
  undoMod,
  waitForSaved,
} from "./helpers";

const ws = "e2e-groups";
const project = "markup-groups";

test.describe("Markup groups — full flow", () => {
  test.beforeAll(async ({ request }) => {
    await setupProject(request, ws, project);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestProject(request, ws, project);
  });

  test.describe("Create & dissolve", () => {
    test("group and ungroup via canvas context menu", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-ungroup-menu");
      await openSession(page, ws, project, sessionId);

      await page.getByTestId("tool-rectangle").click();
      await dragFrameContent(page, 0.2, 0.2, 0.35, 0.35);
      await page.waitForTimeout(350);
      await page.getByTestId("tool-line").click();
      await dragFrameContent(page, 0.5, 0.2, 0.7, 0.35);
      await page.waitForTimeout(350);

      await page.getByTestId("tool-select").click();
      await selectLayerItems(page, ["rectangle", "line"]);
      await groupViaCanvasMenu(page);

      await expect(page.getByTestId("layer-group")).toHaveCount(1);
      await expect(page.locator(markupShapes)).toHaveCount(2);

      await openCanvasContextMenu(page, 0.25, 0.25);
      await page.getByTestId("context-menu-ungroup").click();
      await page.waitForTimeout(400);

      await expect(page.getByTestId("layer-group")).toHaveCount(0);
      await expect(page.locator(markupShapes)).toHaveCount(2);
    });

    test("group via layers panel context menu on multi-selection", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-layers-menu");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await openLayerContextMenu(page, "rectangle");
      await page.getByTestId("context-menu-group").click();
      await page.waitForTimeout(400);
      await expect(page.getByTestId("layer-group")).toHaveCount(1);
    });

    test("group via Cmd/Ctrl+G after layer multi-select", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-shortcut");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await page.keyboard.press(`${undoMod}+g`);
      await page.waitForTimeout(400);
      await expect(page.getByTestId("layer-group")).toHaveCount(1);
    });

    test("ungroup via Cmd/Ctrl+Shift+G", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "ungroup-shortcut");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);
      await page.keyboard.press(`${shiftUndoMod}+g`);
      await page.waitForTimeout(400);
      await expect(page.getByTestId("layer-group")).toHaveCount(0);
    });

    test("group is disabled with only one shape selected", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-disabled");
      await openSession(page, ws, project, sessionId);
      await page.getByTestId("tool-rectangle").click();
      await dragFrameContent(page, 0.2, 0.2, 0.35, 0.35);
      await page.waitForTimeout(350);
      await page.getByTestId("tool-select").click();
      await openCanvasContextMenu(page, 0.25, 0.25);
      await expect(page.getByTestId("context-menu-group")).toHaveAttribute("aria-disabled", "true");
    });
  });

  test.describe("Selection", () => {
    test("select grouped child from layers panel", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-child-select");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);
      await expandFirstGroupInLayers(page);

      const sidebar = page.getByTestId("app-sidebar");
      await sidebar.locator('[data-testid="layer-item"][data-layer-type="ellipse"]').click();
      await expect(
        sidebar.locator('[data-testid="layer-item"][data-layer-type="ellipse"]'),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(sidebar.getByTestId("layer-group-row")).toHaveAttribute("aria-pressed", "false");
    });

    test("select group row highlights group only", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-row-select");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);

      await page.getByTestId("app-sidebar").getByTestId("layer-group-row").click();
      await expect(page.getByTestId("app-sidebar").getByTestId("layer-group-row")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    test("canvas click on grouped shape selects the group", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "canvas-group-select");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);

      await page.getByTestId("tool-select").click();
      await clickFrameContent(page, 0.22, 0.22);
      await expect(page.getByTestId("app-sidebar").getByTestId("layer-group-row")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    test("double-click on canvas drills into grouped child", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-drill-in");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);

      await doubleClickFrameContent(page, 0.52, 0.22);
      await page.waitForTimeout(300);

      const sidebar = page.getByTestId("app-sidebar");
      await expandFirstGroupInLayers(page);
      await expect(
        sidebar.locator('[data-testid="layer-item"][data-layer-type="ellipse"]'),
      ).toHaveAttribute("aria-pressed", "true");
    });
  });

  test.describe("Move", () => {
    test("dragging grouped selection moves all members", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-move");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);

      await page.getByTestId("app-sidebar").getByTestId("layer-group-row").click();
      const before = await getShapeBoxes(page);
      await dragFrameContent(page, 0.22, 0.22, 0.4, 0.4);
      await page.waitForTimeout(500);
      const after = await getShapeBoxes(page);

      expect(totalBoxMovement(before, after)).toBeGreaterThan(8);
    });

    test("dragging one grouped child moves only that child", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-child-drag");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);
      await expandFirstGroupInLayers(page);
      await waitForSaved(page);

      let stack = await fetchMarkupStack(request, ws, project, sessionId);
      const group = stack.find((o) => o.type === "group")!;
      const rectBefore = stack.find(
        (o) => o.groupId === group.id && o.type === "rectangle",
      )!;
      const ellipseBefore = stack.find(
        (o) => o.groupId === group.id && o.type === "ellipse",
      )!;

      await page
        .getByTestId("app-sidebar")
        .locator('[data-testid="layer-item"][data-layer-type="ellipse"]')
        .click();
      await dragFrameContent(page, 0.52, 0.22, 0.65, 0.35);
      await waitForSaved(page);

      stack = await fetchMarkupStack(request, ws, project, sessionId);
      const rectAfter = stack.find((o) => o.id === rectBefore.id)!;
      const ellipseAfter = stack.find((o) => o.id === ellipseBefore.id)!;
      expect(ellipseAfter.x).not.toBe(ellipseBefore.x);
      expect(rectAfter.x).toBe(rectBefore.x);
      expect(rectAfter.y).toBe(rectBefore.y);
    });
  });

  test.describe("Layer order", () => {
    test("bring forward on grouped child reorders within the group", async ({
      page,
      request,
    }) => {
      const sessionId = await createSession(request, ws, project, "group-z-within");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);
      await expandFirstGroupInLayers(page);
      await waitForSaved(page);

      let stack = await fetchMarkupStack(request, ws, project, sessionId);
      const group = stack.find((o) => o.type === "group")!;
      const members = stack.filter((o) => o.groupId === group.id);
      const rect = members.find((o) => o.type === "rectangle")!;
      const ellipse = members.find((o) => o.type === "ellipse")!;
      expect(rect.zIndex).toBeLessThan(ellipse.zIndex);

      await page
        .getByTestId("app-sidebar")
        .locator('[data-testid="layer-item"][data-layer-type="rectangle"]')
        .click();
      await page.getByTestId("bring-forward").click();
      await waitForSaved(page);

      stack = await fetchMarkupStack(request, ws, project, sessionId);
      const rectAfter = stack.find((o) => o.id === rect.id)!;
      const ellipseAfter = stack.find((o) => o.id === ellipse.id)!;
      expect(rectAfter.zIndex).toBeGreaterThan(ellipseAfter.zIndex);
    });

    test("bring forward moves whole group above an external shape", async ({
      page,
      request,
    }) => {
      const sessionId = await createSession(request, ws, project, "group-z-external");
      await openSession(page, ws, project, sessionId);

      await page.getByTestId("tool-rectangle").click();
      await dragFrameContent(page, 0.1, 0.1, 0.25, 0.25);
      await page.waitForTimeout(350);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);
      await waitForSaved(page);

      let stack = await fetchMarkupStack(request, ws, project, sessionId);
      const group = stack.find((o) => o.type === "group")!;
      const members = stack.filter((o) => o.groupId === group.id);
      const external = stack.find((o) => o.type === "rectangle" && !o.groupId)!;
      const maxGroupZ = Math.max(...members.map((o) => o.zIndex));
      expect(maxGroupZ).toBeGreaterThan(external.zIndex);

      await page.getByTestId("app-sidebar").getByTestId("layer-group-row").click();
      await page.getByTestId("send-back").click();
      await waitForSaved(page);

      stack = await fetchMarkupStack(request, ws, project, sessionId);
      const externalAfter = stack.find((o) => o.id === external.id)!;
      const maxGroupZAfter = Math.max(
        ...stack.filter((o) => o.groupId === group.id).map((o) => o.zIndex),
      );
      expect(maxGroupZAfter).toBeLessThan(externalAfter.zIndex);

      await page.getByTestId("bring-forward").click();
      await waitForSaved(page);

      stack = await fetchMarkupStack(request, ws, project, sessionId);
      const externalFinal = stack.find((o) => o.id === external.id)!;
      const maxGroupZUp = Math.max(
        ...stack.filter((o) => o.groupId === group.id).map((o) => o.zIndex),
      );
      expect(maxGroupZUp).toBeGreaterThan(externalFinal.zIndex);
    });

    test("send backward on grouped child reorders within the group", async ({
      page,
      request,
    }) => {
      const sessionId = await createSession(request, ws, project, "group-send-within");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);
      await expandFirstGroupInLayers(page);
      await waitForSaved(page);

      let stack = await fetchMarkupStack(request, ws, project, sessionId);
      const group = stack.find((o) => o.type === "group")!;
      const members = stack.filter((o) => o.groupId === group.id);
      const rect = members.find((o) => o.type === "rectangle")!;
      const ellipse = members.find((o) => o.type === "ellipse")!;
      expect(rect.zIndex).toBeLessThan(ellipse.zIndex);

      await page
        .getByTestId("app-sidebar")
        .locator('[data-testid="layer-item"][data-layer-type="ellipse"]')
        .click();
      await page.getByTestId("send-back").click();
      await waitForSaved(page);

      stack = await fetchMarkupStack(request, ws, project, sessionId);
      const rectAfter = stack.find((o) => o.id === rect.id)!;
      const ellipseAfter = stack.find((o) => o.id === ellipse.id)!;
      expect(ellipseAfter.zIndex).toBeLessThan(rectAfter.zIndex);
    });

    test("send backward moves whole group below an external shape", async ({
      page,
      request,
    }) => {
      const sessionId = await createSession(request, ws, project, "group-send-external");
      await openSession(page, ws, project, sessionId);

      await page.getByTestId("tool-rectangle").click();
      await dragFrameContent(page, 0.1, 0.1, 0.25, 0.25);
      await page.waitForTimeout(350);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);
      await waitForSaved(page);

      let stack = await fetchMarkupStack(request, ws, project, sessionId);
      const group = stack.find((o) => o.type === "group")!;
      const external = stack.find((o) => o.type === "rectangle" && !o.groupId)!;
      expect(external).toBeTruthy();
      const maxGroupZ = Math.max(
        ...stack.filter((o) => o.groupId === group.id).map((o) => o.zIndex),
      );
      expect(maxGroupZ).toBeGreaterThan(external.zIndex);

      await page.getByTestId("app-sidebar").getByTestId("layer-group-row").click();
      await page.getByTestId("send-back").click();
      await waitForSaved(page);

      stack = await fetchMarkupStack(request, ws, project, sessionId);
      const externalAfter = stack.find((o) => o.id === external.id)!;
      const maxGroupZAfter = Math.max(
        ...stack.filter((o) => o.groupId === group.id).map((o) => o.zIndex),
      );
      expect(maxGroupZAfter).toBeLessThan(externalAfter.zIndex);
    });
  });

  test.describe("Nested groups", () => {
    test("group two existing groups into a parent group", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "nested-groups");
      await openSession(page, ws, project, sessionId);

      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);
      await drawLineAndRectangle(page);
      await selectLayerItems(page, ["line", "rectangle"]);
      await groupViaCanvasMenu(page, { x: 0.45, y: 0.6 });

      await selectGroupRows(page, [0, 1]);
      await focusEditor(page);
      await page.keyboard.press(`${undoMod}+g`);
      await waitForSaved(page);

      const stack = await fetchMarkupStack(request, ws, project, sessionId);
      const topGroups = stack.filter((o) => o.type === "group" && !o.groupId);
      expect(topGroups).toHaveLength(1);
      const nestedGroups = stack.filter(
        (o) => o.type === "group" && o.groupId === topGroups[0]!.id,
      );
      expect(nestedGroups).toHaveLength(2);
      expect(stack.filter((o) => o.type === "group")).toHaveLength(3);
    });

    test("nested group expands to show child groups in layers panel", async ({
      page,
      request,
    }) => {
      const sessionId = await createSession(request, ws, project, "nested-layers");
      await openSession(page, ws, project, sessionId);

      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);
      await drawLineAndRectangle(page);
      await selectLayerItems(page, ["line", "rectangle"]);
      await groupViaCanvasMenu(page, { x: 0.45, y: 0.6 });
      await selectGroupRows(page, [0, 1]);
      await focusEditor(page);
      await page.keyboard.press(`${undoMod}+g`);
      await waitForSaved(page);

      await expandFirstGroupInLayers(page);
      await expect(page.getByTestId("app-sidebar").getByTestId("layer-group-row")).toHaveCount(3);
    });
  });

  test.describe("Keyboard nudge", () => {
    test("arrow keys nudge a grouped child without moving siblings", async ({
      page,
      request,
    }) => {
      const sessionId = await createSession(request, ws, project, "group-nudge-child");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);
      await expandFirstGroupInLayers(page);
      await waitForSaved(page);

      let stack = await fetchMarkupStack(request, ws, project, sessionId);
      const group = stack.find((o) => o.type === "group")!;
      const rectBefore = stack.find(
        (o) => o.groupId === group.id && o.type === "rectangle",
      )!;
      const ellipseBefore = stack.find(
        (o) => o.groupId === group.id && o.type === "ellipse",
      )!;

      await page
        .getByTestId("app-sidebar")
        .locator('[data-testid="layer-item"][data-layer-type="ellipse"]')
        .click();
      await focusEditor(page);
      await page.getByTestId("annotation-editor").press("ArrowRight");
      await page.getByTestId("annotation-editor").press("ArrowDown");
      await waitForSaved(page);

      stack = await fetchMarkupStack(request, ws, project, sessionId);
      const rectAfter = stack.find((o) => o.id === rectBefore.id)!;
      const ellipseAfter = stack.find((o) => o.id === ellipseBefore.id)!;
      expect(ellipseAfter.x).toBe((ellipseBefore.x ?? 0) + 1);
      expect(ellipseAfter.y).toBe((ellipseBefore.y ?? 0) + 1);
      expect(rectAfter.x).toBe(rectBefore.x);
      expect(rectAfter.y).toBe(rectBefore.y);
    });

    test("shift+arrow nudges whole group selection", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-nudge-all");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);
      await waitForSaved(page);

      let stack = await fetchMarkupStack(request, ws, project, sessionId);
      const group = stack.find((o) => o.type === "group")!;
      const rectBefore = stack.find(
        (o) => o.groupId === group.id && o.type === "rectangle",
      )!;
      const ellipseBefore = stack.find(
        (o) => o.groupId === group.id && o.type === "ellipse",
      )!;

      await page.getByTestId("app-sidebar").getByTestId("layer-group-row").click();
      await focusEditor(page);
      await page.getByTestId("annotation-editor").press("Shift+ArrowLeft");
      await waitForSaved(page);

      stack = await fetchMarkupStack(request, ws, project, sessionId);
      const rectAfter = stack.find((o) => o.id === rectBefore.id)!;
      const ellipseAfter = stack.find((o) => o.id === ellipseBefore.id)!;
      expect(rectAfter.x).toBe((rectBefore.x ?? 0) - 10);
      expect(ellipseAfter.x).toBe((ellipseBefore.x ?? 0) - 10);
    });
  });

  test.describe("Clipboard & duplicate", () => {
    test("copy and paste preserves group structure", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-paste");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);

      await openCanvasContextMenu(page, 0.22, 0.22);
      await page.getByTestId("context-menu-copy").click();
      await openCanvasContextMenu(page, 0.7, 0.7);
      await page.getByTestId("context-menu-paste").click();
      await page.waitForTimeout(500);

      await expect(page.getByTestId("layer-group")).toHaveCount(2);
      await expect(page.locator(markupShapes)).toHaveCount(4);
    });

    test("duplicate group via context menu", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-duplicate");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);

      await openCanvasContextMenu(page, 0.22, 0.22);
      await page.getByTestId("context-menu-duplicate").click();
      await page.waitForTimeout(500);

      await expect(page.getByTestId("layer-group")).toHaveCount(2);
      await expect(page.locator(markupShapes)).toHaveCount(4);
    });
  });

  test.describe("Delete", () => {
    test("delete group removes all members", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-delete");
      await openSession(page, ws, project, sessionId);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);

      await page.getByTestId("app-sidebar").getByTestId("layer-group-row").click();
      await openCanvasContextMenu(page, 0.22, 0.22);
      await page.getByTestId("context-menu-delete").click();
      await page.waitForTimeout(500);

      await expect(page.getByTestId("layer-group")).toHaveCount(0);
      await expect(page.locator(markupShapes)).toHaveCount(0);
    });
  });

  test.describe("Mixed scene (group + ungrouped sibling)", () => {
    test("ungrouped shape and group coexist in layers", async ({ page, request }) => {
      const sessionId = await createSession(request, ws, project, "group-mixed");
      await openSession(page, ws, project, sessionId);

      await page.getByTestId("tool-rectangle").click();
      await dragFrameContent(page, 0.1, 0.55, 0.25, 0.7);
      await page.waitForTimeout(350);
      await drawRectangleAndEllipse(page);
      await selectLayerItems(page, ["rectangle", "ellipse"]);
      await groupViaCanvasMenu(page);

      await expect(page.getByTestId("layer-group")).toHaveCount(1);
      await expect(page.locator(markupShapes)).toHaveCount(3);
      await waitForSaved(page);

      const stack = await fetchMarkupStack(request, ws, project, sessionId);
      expect(stack.filter((o) => o.type === "group")).toHaveLength(1);
      const group = stack.find((o) => o.type === "group")!;
      expect(stack.filter((o) => o.groupId === group.id)).toHaveLength(2);
      expect(stack.filter((o) => o.type === "rectangle" && !o.groupId)).toHaveLength(1);
    });
  });
});
