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
  ParagraphNode,
  TextNode,
  type LexicalEditor,
} from "lexical";

/**
 * Lexical 0.40 commits on a microtask, so updates queued in the same tick
 * coalesce. Fast typing, a paste landing mid-burst, and a programmatic
 * document replacement arriving between keystrokes all exercise that
 * coalescing — the failure mode is a lost or reordered edit.
 */

function createTestEditor(): LexicalEditor {
  const editor = createEditor({
    namespace: "concurrent-test",
    nodes: [ParagraphNode, TextNode],
    onError: (error) => {
      throw error;
    },
  });
  const rootElement = document.createElement("div");
  rootElement.contentEditable = "true";
  document.body.appendChild(rootElement);
  editor.setRootElement(rootElement);
  return editor;
}

function seed(editor: LexicalEditor, text = ""): void {
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      if (text) {
        paragraph.append($createTextNode(text));
      }
      $getRoot().clear();
      $getRoot().append(paragraph);
    },
    { discrete: true },
  );
}

function appendText(editor: LexicalEditor, text: string): void {
  editor.update(() => {
    const paragraph = $getRoot().getFirstChild();
    if (!$isElementNode(paragraph)) {
      return;
    }
    const textNode = paragraph.getLastChild();
    if ($isTextNode(textNode)) {
      textNode.setTextContent(textNode.getTextContent() + text);
    } else {
      paragraph.append($createTextNode(text));
    }
  });
}

function readText(editor: LexicalEditor): string {
  let text = "";
  editor.getEditorState().read(() => {
    text = $getRoot().getTextContent();
  });
  return text;
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("rapid input", () => {
  it("keeps every character when 200 edits are queued in one tick", async () => {
    const editor = createTestEditor();
    seed(editor);

    const characters = "abcdefghij".repeat(20).split("");
    for (const character of characters) {
      appendText(editor, character);
    }
    await flush();

    expect(readText(editor)).toBe(characters.join(""));
    expect(readText(editor)).toHaveLength(200);
  });

  it("preserves order when edits are queued across several microtasks", async () => {
    const editor = createTestEditor();
    seed(editor);

    for (let index = 0; index < 50; index += 1) {
      appendText(editor, String(index % 10));
      // Yield to the microtask queue without a full macrotask, the way a
      // fast typist's key events interleave with commits.
      await Promise.resolve();
    }
    await flush();

    const expected = Array.from({ length: 50 }, (_, index) => String(index % 10)).join("");
    expect(readText(editor)).toBe(expected);
  });
});

describe("paste landing mid-burst", () => {
  it("does not drop typed characters queued around a bulk insertion", async () => {
    const editor = createTestEditor();
    seed(editor);

    appendText(editor, "abc");
    // Bulk insertion (the shape a paste takes) between keystrokes.
    appendText(editor, "[PASTED]");
    appendText(editor, "def");
    await flush();

    expect(readText(editor)).toBe("abc[PASTED]def");
  });
});

describe("programmatic replacement landing mid-keystroke", () => {
  it("lets the replacement win without interleaving the pending keystrokes", async () => {
    const editor = createTestEditor();
    seed(editor, "typed");

    appendText(editor, "-more");
    // A remote revision adopted while edits are still pending.
    editor.update(() => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("remote revision"));
      $getRoot().clear();
      $getRoot().append(paragraph);
    });
    await flush();

    // The last writer wins cleanly: no fragment of the pending edit is
    // spliced into the adopted document.
    expect(readText(editor)).toBe("remote revision");
    expect(readText(editor)).not.toContain("-more");
  });

  it("applies edits made after the replacement to the new document", async () => {
    const editor = createTestEditor();
    seed(editor, "old");

    editor.update(() => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("new"));
      $getRoot().clear();
      $getRoot().append(paragraph);
    });
    await flush();

    appendText(editor, "-edited");
    await flush();

    expect(readText(editor)).toBe("new-edited");
  });
});
