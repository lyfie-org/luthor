/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isParagraphNode,
  $isTextNode,
  createEditor,
  type LexicalEditor,
} from "lexical";
import { registerContentFormatGuard } from "./content-guards";

function makeEditor(): LexicalEditor {
  const editor = createEditor({ onError: (error) => { throw error; } });
  editor.setRootElement(document.createElement("div"));
  return editor;
}

/** Inserts a paragraph the way a Lexical-clipboard paste lands it. */
function insertStyled(
  editor: LexicalEditor,
  text: { style?: string; formats?: Array<"subscript" | "superscript" | "bold"> },
  paragraph: { style?: string; textStyle?: string } = {},
) {
  editor.update(
    () => {
      const p = $createParagraphNode();
      if (paragraph.style) p.setStyle(paragraph.style);
      if (paragraph.textStyle) p.setTextStyle(paragraph.textStyle);
      const node = $createTextNode("pasted");
      if (text.style) node.setStyle(text.style);
      for (const format of text.formats ?? []) node.toggleFormat(format);
      p.append(node);
      $getRoot().append(p);
    },
    { discrete: true },
  );
}

function readFirst(editor: LexicalEditor) {
  return editor.getEditorState().read(() => {
    const p = $getRoot().getLastChild();
    const text = $isParagraphNode(p) ? p.getFirstChild() : null;
    return {
      textStyle: $isTextNode(text) ? text.getStyle() : null,
      sub: $isTextNode(text) ? text.hasFormat("subscript") : null,
      sup: $isTextNode(text) ? text.hasFormat("superscript") : null,
      bold: $isTextNode(text) ? text.hasFormat("bold") : null,
      paragraphStyle: $isParagraphNode(p) ? p.getStyle() : null,
      paragraphTextStyle: $isParagraphNode(p) ? p.getTextStyle() : null,
    };
  });
}

describe("registerContentFormatGuard", () => {
  it("strips the given style properties from text and paragraphs", () => {
    const editor = makeEditor();
    registerContentFormatGuard(editor, { styleProperties: ["line-height"] });

    insertStyled(
      editor,
      { style: "line-height: 3; font-weight: 700" },
      { style: "line-height: 2", textStyle: "line-height: 3" },
    );

    expect(readFirst(editor)).toMatchObject({
      textStyle: "font-weight: 700;",
      paragraphStyle: "",
      paragraphTextStyle: "",
    });
  });

  it("clears the given text formats and keeps the rest", () => {
    const editor = makeEditor();
    registerContentFormatGuard(editor, { textFormats: ["subscript", "superscript"] });

    insertStyled(editor, { formats: ["superscript", "bold"] });

    expect(readFirst(editor)).toMatchObject({ sub: false, sup: false, bold: true });
  });

  it("cleans content that was already in the editor when it registers", () => {
    const editor = makeEditor();
    insertStyled(editor, { style: "line-height: 3" });

    registerContentFormatGuard(editor, { styleProperties: ["line-height"] });
    editor.update(() => {}, { discrete: true });

    expect(readFirst(editor).textStyle).toBe("");
  });

  it("stops guarding once unregistered", () => {
    const editor = makeEditor();
    const unregister = registerContentFormatGuard(editor, { styleProperties: ["line-height"] });
    unregister();

    insertStyled(editor, { style: "line-height: 3" });

    expect(readFirst(editor).textStyle).toBe("line-height: 3");
  });
});
