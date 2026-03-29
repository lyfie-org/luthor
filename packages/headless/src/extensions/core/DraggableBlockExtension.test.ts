/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { describe, expect, it, vi } from "vitest";
import type { LexicalEditor } from "lexical";
import { DraggableBlockExtension } from "./DraggableBlockExtension";

function createEditorStub(editable: boolean): {
  editor: LexicalEditor;
  update: ReturnType<typeof vi.fn>;
} {
  const update = vi.fn();
  const editor = {
    isEditable: () => editable,
    update,
  } as unknown as LexicalEditor;

  return { editor, update };
}

describe("DraggableBlockExtension commands", () => {
  it("does not reorder blocks when editor is non-editable", () => {
    const extension = new DraggableBlockExtension();
    const { editor, update } = createEditorStub(false);
    const commands = extension.getCommands(editor);

    commands.moveBlock("source", "target", true);
    commands.moveCurrentBlockUp();
    commands.moveCurrentBlockDown();

    expect(update).not.toHaveBeenCalled();
  });

  it("dispatches reorder updates only when editor is editable", () => {
    const extension = new DraggableBlockExtension();
    const { editor, update } = createEditorStub(true);
    const commands = extension.getCommands(editor);

    commands.moveBlock("source", "target", true);
    commands.moveCurrentBlockUp();
    commands.moveCurrentBlockDown();

    expect(update).toHaveBeenCalledTimes(3);
  });
});
