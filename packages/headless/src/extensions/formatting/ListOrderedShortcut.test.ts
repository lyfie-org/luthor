/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  KEY_SPACE_COMMAND,
  type LexicalEditor,
} from "lexical";
import { $isListNode, ListItemNode, ListNode, registerList } from "@lexical/list";
import { ListExtension } from "./ListExtension";

function createListEditor(text: string): LexicalEditor {
  const editor = createEditor({
    namespace: "list-shortcut-test",
    nodes: [ListNode, ListItemNode],
    onError: (error) => {
      throw error;
    },
  });
  const root = window.document.createElement("div");
  root.contentEditable = "true";
  window.document.body.appendChild(root);
  editor.setRootElement(root);
  registerList(editor);
  new ListExtension().register(editor);

  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      const node = $createTextNode(text);
      paragraph.append(node);
      $getRoot().clear().append(paragraph);
      node.select(text.length, text.length);
    },
    { discrete: true },
  );
  return editor;
}

function pressSpace(editor: LexicalEditor): { preventDefault: ReturnType<typeof vi.fn> } {
  const event = { preventDefault: vi.fn() };
  editor.update(
    () => {
      editor.dispatchCommand(KEY_SPACE_COMMAND, event as unknown as KeyboardEvent);
    },
    { discrete: true },
  );
  return event;
}

describe("ListExtension ordered-list shortcut", () => {
  it("converts \"1.\" + Space and cancels the space", () => {
    const editor = createListEditor("1.");
    const event = pressSpace(editor);

    // Uncancelled, the browser types the space into the fresh list item and
    // every numbered list started by typing begins with " ".
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    editor.getEditorState().read(() => {
      const list = $getRoot().getFirstChild();
      expect($isListNode(list) && list.getListType()).toBe("number");
      expect($getRoot().getTextContent()).toBe("");
    });
  });

  it("leaves an ordinary space alone", () => {
    const editor = createListEditor("Hello");
    const event = pressSpace(editor);

    expect(event.preventDefault).not.toHaveBeenCalled();
    editor.getEditorState().read(() => {
      expect($isListNode($getRoot().getFirstChild())).toBe(false);
    });
  });
});
