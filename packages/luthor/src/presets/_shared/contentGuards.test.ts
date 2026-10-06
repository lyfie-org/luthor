/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

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
import { registerDisabledFeatureContentGuards } from "./contentGuards";

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

describe("registerDisabledFeatureContentGuards", () => {
  it("strips a disabled feature's style from pasted text and paragraphs", () => {
    const editor = makeEditor();
    registerDisabledFeatureContentGuards(editor, { lineHeight: false });

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

  it("strips every disabled style feature and the disabled script formats", () => {
    const editor = makeEditor();
    registerDisabledFeatureContentGuards(editor, {
      fontFamily: false,
      fontSize: false,
      lineHeight: false,
      textColor: false,
      textHighlight: false,
      subscript: false,
      superscript: false,
    });

    insertStyled(editor, {
      style: "font-family: Arial; font-size: 30px; line-height: 40px; color: red; background-color: yellow",
      formats: ["superscript", "bold"],
    });

    expect(readFirst(editor)).toMatchObject({
      textStyle: "",
      sub: false,
      sup: false,
      bold: true,
    });
  });

  it("leaves enabled features alone", () => {
    const editor = makeEditor();
    registerDisabledFeatureContentGuards(editor, { lineHeight: true, fontSize: false });

    insertStyled(editor, { style: "line-height: 3; font-size: 30px", formats: ["subscript"] });

    expect(readFirst(editor)).toMatchObject({ textStyle: "line-height: 3;", sub: true });
  });
});
