import type { MarkupObject } from "./types";

export class UndoStack {
  private past: MarkupObject[][] = [];
  private future: MarkupObject[][] = [];

  constructor(private current: MarkupObject[]) {}

  push(next: MarkupObject[]) {
    this.past.push(this.current);
    this.current = next;
    this.future = [];
  }

  undo(): MarkupObject[] | null {
    if (this.past.length === 0) return null;
    this.future.push(this.current);
    this.current = this.past.pop()!;
    return this.current;
  }

  redo(): MarkupObject[] | null {
    if (this.future.length === 0) return null;
    this.past.push(this.current);
    this.current = this.future.pop()!;
    return this.current;
  }

  canUndo() {
    return this.past.length > 0;
  }

  canRedo() {
    return this.future.length > 0;
  }
}
