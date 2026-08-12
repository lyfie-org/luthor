/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  createEditor,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  $isTextNode,
  UNDO_COMMAND,
  REDO_COMMAND,
  ParagraphNode,
  TextNode,
  type LexicalEditor,
} from "lexical";
import { registerHistory, createEmptyHistoryState } from "@lexical/history";
import {
  BlockAnchorNode,
  registerBlockAnchorAutoStamp,
} from "../extensions/embeds/BlockAnchorNode";

/**
 * History corruption is a data-loss bug: an undo that restores the wrong
 * state, or a transformer-generated change that becomes separately
 * undoable, loses the user's work. These drive the real history plugin
 * rather than asserting on internal stacks.
 */

function createHistoryEditor(extraNodes: never[] = []): LexicalEditor {
  const editor = createEditor({
    namespace: "history-test",
    nodes: [ParagraphNode, TextNode, ...extraNodes],
    onError: (error) => {
      throw error;
    },
  });
  const rootElement = document.createElement("div");
  rootElement.contentEditable = "true";
  document.body.appendChild(rootElement);
  editor.setRootElement(rootElement);
  // Delay 0 so each discrete update lands as its own history entry.
  registerHistory(editor, createEmptyHistoryState(), 0);
  return editor;
}

/**
 * Structural edits, one per call. Consecutive text edits to the same node
 * are deliberately merged by Lexical's history into a single entry, so a
 * chain-depth test has to add nodes to produce distinct entries.
 */
function appendParagraph(editor: LexicalEditor, text: string): void {
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(text));
      $getRoot().append(paragraph);
    },
    { discrete: true },
  );
}

function countParagraphs(editor: LexicalEditor): number {
  let count = 0;
  editor.getEditorState().read(() => {
    count = $getRoot().getChildren().length;
  });
  return count;
}

function setText(editor: LexicalEditor, text: string): void {
  editor.update(
    () => {
      const paragraph = $getRoot().getFirstChild();
      if (!$isElementNode(paragraph)) {
        const created = $createParagraphNode();
        created.append($createTextNode(text));
        $getRoot().clear();
        $getRoot().append(created);
        return;
      }
      const textNode = paragraph.getFirstChild();
      if ($isTextNode(textNode)) {
        textNode.setTextContent(text);
      } else {
        paragraph.append($createTextNode(text));
      }
    },
    { discrete: true },
  );
}

function readText(editor: LexicalEditor): string {
  let text = "";
  editor.getEditorState().read(() => {
    text = $getRoot().getTextContent();
  });
  return text;
}

function undo(editor: LexicalEditor): void {
  editor.dispatchCommand(UNDO_COMMAND, undefined);
}

function redo(editor: LexicalEditor): void {
  editor.dispatchCommand(REDO_COMMAND, undefined);
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("long undo chains", () => {
  it("walks back and forward through 100 edits without losing a step", async () => {
    const editor = createHistoryEditor();

    for (let step = 0; step < 100; step += 1) {
      appendParagraph(editor, `step-${step}`);
    }
    await flush();
    expect(countParagraphs(editor)).toBe(100);
    expect(readText(editor)).toContain("step-99");

    for (let step = 0; step < 99; step += 1) {
      undo(editor);
      // Each undo is its own committed update; batching them without a
      // flush collapses the chain being measured.
      await flush();
    }
    expect(countParagraphs(editor)).toBe(1);
    expect(readText(editor)).toContain("step-0");

    for (let step = 0; step < 99; step += 1) {
      redo(editor);
      await flush();
    }
    expect(countParagraphs(editor)).toBe(100);
    expect(readText(editor)).toContain("step-99");
  });

  it("keeps the earliest state when undone past the start of history", async () => {
    const editor = createHistoryEditor();
    setText(editor, "only-state");
    await flush();

    // Far more undos than there are entries.
    for (let step = 0; step < 50; step += 1) {
      undo(editor);
      await flush();
    }

    // Excess undos stop at the first entry rather than walking off the end
    // into an empty document — silent content loss is the worst available
    // outcome and must be unreachable.
    expect(readText(editor)).toBe("only-state");

    redo(editor);
    await flush();
    expect(readText(editor)).toBe("only-state");
  });
});

describe("undo across programmatic document replacement", () => {
  it("restores the pre-replacement document in one undo", async () => {
    const editor = createHistoryEditor();
    setText(editor, "user typed this");
    await flush();

    // Stand-in for setMarkdown/injectJSON: a wholesale root replacement.
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode("remote revision"));
        $getRoot().clear();
        $getRoot().append(paragraph);
      },
      { discrete: true },
    );
    await flush();
    expect(readText(editor)).toBe("remote revision");

    undo(editor);
    await flush();
    expect(readText(editor)).toBe("user typed this");
  });
});

describe("transformer-generated changes and history", () => {
  it("does not make an auto-stamped block anchor separately undoable", async () => {
    const editor = createHistoryEditor([BlockAnchorNode] as never[]);
    registerBlockAnchorAutoStamp(editor, () => "anchor-id");

    setText(editor, "first");
    await flush();
    setText(editor, "second");
    await flush();

    expect(readText(editor)).toContain("second");

    // Stamping runs with the history-merge tag, so it folds into the edit
    // that triggered it. One undo must reach the previous user state, not
    // an intermediate "text changed but not yet stamped" state — and the
    // restored state keeps its anchor rather than losing it.
    undo(editor);
    await flush();
    expect(readText(editor)).toContain("first");
    expect(readText(editor)).not.toContain("second");
    expect(readText(editor)).toContain("anchor-id");
  });
});
