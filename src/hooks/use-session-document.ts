import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import type { MarkupObject } from "@/lib/markup/types";
import { layoutFromArtboard } from "@/lib/markup/artboard-layout";
import {
  activeMarkupStack,
  createArtboardFromDrag,
  createEmptyArtboard,
  findArtboardAt,
  getActiveArtboard,
  moveImageBetweenArtboards,
  placementForNewArtboard,
  updateArtboardInDocument,
  type ClientSessionDocument,
} from "@/lib/markup/session-document";
import { resolveImageCrop } from "@/lib/markup/image-crop";
import { UndoStack } from "@/lib/markup/undo-stack";

export function useSessionDocument(
  initialDocument: ClientSessionDocument,
  save: (document: ClientSessionDocument) => Promise<boolean>,
) {
  const [document, setDocumentState] = useState(initialDocument);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [pendingSave, setPendingSave] = useState(false);

  const setDocument = useCallback((action: SetStateAction<ClientSessionDocument>) => {
    setPendingSave(true);
    setSaveStatus((status) => (status === "error" ? "error" : "saving"));
    setDocumentState(action);
  }, []);
  const [markupPreview, setMarkupPreview] = useState<MarkupObject[] | null>(null);
  const markupPreviewRef = useRef<MarkupObject[] | null>(null);

  useEffect(() => {
    markupPreviewRef.current = markupPreview;
  }, [markupPreview]);

  const activeArtboard = getActiveArtboard(document);
  const activeImage = activeArtboard?.imageId
    ? (document.images[activeArtboard.imageId] ?? null)
    : null;
  const layout = activeArtboard
    ? (() => {
        const crop = resolveImageCrop(
          activeArtboard,
          activeImage?.width ?? 0,
          activeImage?.height ?? 0,
        );
        return layoutFromArtboard(
          activeArtboard,
          activeImage?.width ?? 0,
          activeImage?.height ?? 0,
          crop.width,
          crop.height,
        );
      })()
    : null;
  const objects = markupPreview ?? activeMarkupStack(document);

  const undoRef = useRef(new UndoStack(activeMarkupStack(initialDocument)));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncHistory = useCallback(() => {
    setCanUndo(undoRef.current.canUndo());
    setCanRedo(undoRef.current.canRedo());
  }, []);

  const flushActiveMarkup = useCallback(
    (doc: ClientSessionDocument, stack: MarkupObject[]) => {
      if (!doc.activeArtboardId) return doc;
      return updateArtboardInDocument(doc, doc.activeArtboardId, { markupStack: stack });
    },
    [],
  );

  const withFlushedMarkup = useCallback(
    (doc: ClientSessionDocument) =>
      flushActiveMarkup(
        doc,
        markupPreviewRef.current ?? activeMarkupStack(doc),
      ),
    [flushActiveMarkup],
  );

  const resetHistory = useCallback((stack: MarkupObject[]) => {
    undoRef.current = new UndoStack(stack);
    setMarkupPreview(null);
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const commit = useCallback(
    (next: MarkupObject[]) => {
      undoRef.current.push(next);
      setMarkupPreview(null);
      setDocument((prev) => flushActiveMarkup(prev, next));
      syncHistory();
    },
    [flushActiveMarkup, setDocument, syncHistory],
  );

  const previewMarkup = useCallback((next: MarkupObject[]) => {
    setMarkupPreview(next);
  }, []);

  const undo = useCallback(() => {
    const next = undoRef.current.undo();
    if (!next) return null;
    setMarkupPreview(null);
    setDocument((prev) => flushActiveMarkup(prev, next));
    syncHistory();
    return next;
  }, [flushActiveMarkup, setDocument, syncHistory]);

  const redo = useCallback(() => {
    const next = undoRef.current.redo();
    if (!next) return null;
    setMarkupPreview(null);
    setDocument((prev) => flushActiveMarkup(prev, next));
    syncHistory();
    return next;
  }, [flushActiveMarkup, setDocument, syncHistory]);

  const selectArtboard = useCallback(
    (artboardId: string) => {
      let nextStack: MarkupObject[] = [];
      setDocument((prev) => {
        const withMarkup = withFlushedMarkup(prev);
        nextStack =
          withMarkup.artboards.find((a) => a.id === artboardId)?.markupStack ?? [];
        return { ...withMarkup, activeArtboardId: artboardId };
      });
      undoRef.current = new UndoStack(nextStack);
      setMarkupPreview(null);
      setCanUndo(false);
      setCanRedo(false);
    },
    [setDocument, withFlushedMarkup],
  );

  const patchActiveArtboard = useCallback(
    (patch: Parameters<typeof updateArtboardInDocument>[2]) => {
      setDocument((prev) => {
        const flushed = withFlushedMarkup(prev);
        return updateArtboardInDocument(flushed, flushed.activeArtboardId, patch);
      });
      setMarkupPreview(null);
    },
    [setDocument, withFlushedMarkup],
  );

  const patchArtboard = useCallback(
    (artboardId: string, patch: Parameters<typeof updateArtboardInDocument>[2]) => {
      setDocument((prev) => {
        const flushed = withFlushedMarkup(prev);
        return updateArtboardInDocument(flushed, artboardId, patch);
      });
      setMarkupPreview(null);
    },
    [setDocument, withFlushedMarkup],
  );

  const addEmptyArtboard = useCallback(() => {
    setDocument((prev) => {
      const flushed = withFlushedMarkup(prev);
      const spot = placementForNewArtboard(flushed.artboards);
      const artboard = createEmptyArtboard(flushed.artboards, spot.x, spot.y);
      return {
        ...flushed,
        artboards: [...flushed.artboards, artboard],
        activeArtboardId: artboard.id,
      };
    });
    resetHistory([]);
  }, [resetHistory, setDocument, withFlushedMarkup]);

  const createArtboardAtDrag = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      setDocument((prev) => {
        const flushed = withFlushedMarkup(prev);
        const artboard = createArtboardFromDrag(flushed.artboards, x1, y1, x2, y2);
        return {
          ...flushed,
          artboards: [...flushed.artboards, artboard],
          activeArtboardId: artboard.id,
        };
      });
      resetHistory([]);
    },
    [resetHistory, setDocument, withFlushedMarkup],
  );

  const transferImageToArtboard = useCallback(
    (sourceArtboardId: string, targetArtboardId: string) => {
      setDocument((prev) =>
        moveImageBetweenArtboards(withFlushedMarkup(prev), sourceArtboardId, targetArtboardId),
      );
      resetHistory([]);
    },
    [resetHistory, setDocument, withFlushedMarkup],
  );

  const artboardAtCanvasPoint = useCallback(
    (canvasX: number, canvasY: number) => findArtboardAt(document, canvasX, canvasY),
    [document],
  );

  useEffect(() => {
    if (!pendingSave) return;
    const t = setTimeout(() => {
      void save(document).then((ok) => {
        setSaveStatus(ok ? "saved" : "error");
        if (ok) setPendingSave(false);
      });
    }, 500);
    return () => clearTimeout(t);
  }, [document, pendingSave, save]);

  return {
    document,
    activeArtboard,
    activeImage,
    layout,
    objects,
    commit,
    previewMarkup,
    undo,
    redo,
    selectArtboard,
    patchActiveArtboard,
    patchArtboard,
    addEmptyArtboard,
    createArtboardAtDrag,
    transferImageToArtboard,
    artboardAtCanvasPoint,
    canUndo,
    canRedo,
    saveStatus,
  };
}
