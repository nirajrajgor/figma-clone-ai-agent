"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { MarkupObject } from "@/lib/markup/types";

export type ArtboardLayersNode = {
  id: string;
  title: string;
  hasImage: boolean;
  objects: MarkupObject[];
  isActive: boolean;
};

export type EditorSidebarLayers = {
  artboards: ArtboardLayersNode[];
  activeArtboardId: string;
  selectedIds: Set<string>;
  frameSelected: boolean;
  imageSelected: boolean;
  onSelectFrame: (artboardId: string) => void;
  onSelectImage: (artboardId: string) => void;
  onSelectLayer: (id: string, additive: boolean) => void;
};

type EditorSidebarContextValue = {
  layers: EditorSidebarLayers | null;
  setLayers: (layers: EditorSidebarLayers | null) => void;
};

const EditorSidebarContext = createContext<EditorSidebarContextValue | null>(null);

export function EditorSidebarProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<EditorSidebarLayers | null>(null);
  const value = useMemo(() => ({ layers, setLayers }), [layers]);
  return (
    <EditorSidebarContext.Provider value={value}>{children}</EditorSidebarContext.Provider>
  );
}

export function useEditorSidebar() {
  const ctx = useContext(EditorSidebarContext);
  if (!ctx) {
    throw new Error("useEditorSidebar must be used within EditorSidebarProvider");
  }
  return ctx;
}
