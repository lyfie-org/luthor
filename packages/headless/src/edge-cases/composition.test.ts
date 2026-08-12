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
  $setCompositionKey,
  $isElementNode,
  $isTextNode,
  ParagraphNode,
  TextNode,
  type LexicalEditor,
} from "lexical";
import {
  BlockAnchorNode,
  registerBlockAnchorAutoStamp,
} from "../extensions/embeds/BlockAnchorNode";
import { detectEditorDomDivergence } from "../utils/editorDomWatchdog";

/**
 * IME composition (CJK, Vietnamese, Indic) turns one "character" into a
 * multi-keystroke sequence during which the DOM holds provisional text
 * that is not yet settled in the model. Anything that writes to the
 * document, or compares model against DOM, must stand down until
 * composition ends — otherwise it either corrupts the in-flight text or
 * reports a phantom divergence.
 *
 * `editor.isComposing()` is the guard, driven here through Lexical's own
 * `$setCompositionKey` rather than a stub, so these fail if the guard is
 * removed.
 */

function createTestEditor(extraNodes: never[] = []): {
  editor: LexicalEditor;
  rootElement: HTMLElement;
} {
  const editor = createEditor({
    namespace: "composition-test",
    nodes: [ParagraphNode, TextNode, ...extraNodes],
    onError: (error) => {
      throw error;
    },
  });
  // A rootless editor never commits updates, so the DOM must be attached.
  const rootElement = document.createElement("div");
  rootElement.contentEditable = "true";
  document.body.appendChild(rootElement);
  editor.setRootElement(rootElement);
  return { editor, rootElement };
}

function seedParagraph(editor: LexicalEditor, text: string): void {
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(text));
      $getRoot().clear();
      $getRoot().append(paragraph);
      paragraph.selectEnd();
    },
    { discrete: true },
  );
}

function setFirstParagraphText(editor: LexicalEditor, text: string): void {
  editor.update(
    () => {
      const paragraph = $getRoot().getFirstChild();
      if (!$isElementNode(paragraph)) {
        return;
      }
      const textNode = paragraph.getFirstChild();
      if ($isTextNode(textNode)) {
        textNode.setTextContent(text);
      }
    },
    { discrete: true },
  );
}

function endComposition(editor: LexicalEditor): void {
  editor.update(
    () => {
      $setCompositionKey(null);
    },
    { discrete: true },
  );
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function countAnchors(editor: LexicalEditor): number {
  let count = 0;
  editor.getEditorState().read(() => {
    for (const block of $getRoot().getChildren()) {
      if (!$isElementNode(block)) {
        continue;
      }
      for (const child of block.getChildren()) {
        if (child instanceof BlockAnchorNode) {
          count += 1;
        }
      }
    }
  });
  return count;
}

describe("block-anchor auto-stamp during IME composition", () => {
  it("does not stamp while a composition is in flight, and resumes after", async () => {
    const { editor } = createTestEditor([BlockAnchorNode] as never[]);
    registerBlockAnchorAutoStamp(editor, () => "fixed-id");

    // The block is created and put into composition in a single update, so
    // the auto-stamp listener never sees it outside a composition.
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode("ほ");
        paragraph.append(textNode);
        $getRoot().clear();
        $getRoot().append(paragraph);
        $setCompositionKey(textNode.getKey());
      },
      { discrete: true },
    );
    await flush();
    expect(editor.isComposing()).toBe(true);
    expect(countAnchors(editor)).toBe(0);

    // Provisional composition text arriving mid-composition.
    setFirstParagraphText(editor, "ほn");
    await flush();
    setFirstParagraphText(editor, "ほん");
    await flush();

    expect(countAnchors(editor)).toBe(0);

    endComposition(editor);
    expect(editor.isComposing()).toBe(false);

    setFirstParagraphText(editor, "ほんとう");
    await flush();

    // Composition is over, so the settled block finally gets its anchor.
    expect(countAnchors(editor)).toBe(1);
  });
});

describe("DOM watchdog composition guard", () => {
  /**
   * KNOWN GAP — not testable end-to-end under jsdom.
   *
   * The watchdog only reports after a settle window (MutationObserver ->
   * setTimeout). Lexical's own mutation handling restores an externally
   * written DOM back to the model within ~2ms, so by the time the window
   * closes there is no divergence left to find; the observer path cannot
   * be driven from a test. Verified directly: divergence is present
   * synchronously after the write and null 2ms later.
   *
   * What is covered here is the detection function the guard wraps. The
   * isComposing() early-return in registerEditorDomWatchdog's check() is
   * reviewed, not asserted; it needs a real browser (or a Lexical build
   * with reconciliation disabled) to exercise.
   */
  it("detects a model/DOM divergence and reports both sides", async () => {
    const { editor, rootElement } = createTestEditor();
    seedParagraph(editor, "hello");
    await flush();

    expect(detectEditorDomDivergence(editor)).toBeNull();

    rootElement.textContent = "hello にほn";
    expect(detectEditorDomDivergence(editor)).toEqual({
      domText: "hello にほn",
      modelText: "hello",
    });
  });
});
