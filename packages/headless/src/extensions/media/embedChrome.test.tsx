/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  $createNodeSelection,
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  createEditor,
  type LexicalEditor,
} from "lexical";
import { moveBlockTo, resolveBlockDropTarget } from "./embedChrome";
import { $createSavedCardNode, SavedCardNode, SavedCardExtension } from "../embeds/SavedCardNode";

const blocks = [
  { key: "a", top: 0, bottom: 20 },
  { key: "b", top: 30, bottom: 130 },
  { key: "c", top: 140, bottom: 160 },
  { key: "d", top: 170, bottom: 190 },
];

describe("resolveBlockDropTarget", () => {
  it("lands before the first block whose middle is below the pointer", () => {
    expect(resolveBlockDropTarget(blocks, 5, "c")).toEqual({ key: "a", placement: "before" });
    expect(resolveBlockDropTarget(blocks, 60, "d")).toEqual({ key: "b", placement: "before" });
  });

  it("lands after the last block past every middle", () => {
    expect(resolveBlockDropTarget(blocks, 400, "a")).toEqual({ key: "d", placement: "after" });
  });

  it("is null wherever the block would stay put", () => {
    // b spans 30–130: its own top half, its own bottom half, the gap after it.
    expect(resolveBlockDropTarget(blocks, 50, "b")).toBeNull();
    expect(resolveBlockDropTarget(blocks, 100, "b")).toBeNull();
    expect(resolveBlockDropTarget(blocks, 135, "b")).toBeNull();
    expect(resolveBlockDropTarget(blocks, 400, "d")).toBeNull();
    expect(resolveBlockDropTarget([], 10, "a")).toBeNull();
  });
});

function editorWith(): { editor: LexicalEditor; card: string; texts: string[] } {
  const editor = createEditor({ nodes: [SavedCardNode], onError: (e) => { throw e; } });
  let card = "";
  const texts: string[] = [];
  editor.update(
    () => {
      const root = $getRoot();
      for (const word of ["one", "two", "three"]) {
        const p = $createParagraphNode().append($createTextNode(word));
        root.append(p);
        texts.push(p.getKey());
      }
      const node = $createSavedCardNode("https://example.com");
      root.getFirstChild()?.insertAfter(node);
      card = node.getKey();
    },
    { discrete: true },
  );
  return { editor, card, texts };
}

const order = (editor: LexicalEditor) =>
  editor.getEditorState().read(() => $getRoot().getChildren().map((n) => n.getTextContent()));

describe("moveBlockTo", () => {
  it("moves the block before or after another and keeps it selected", () => {
    const { editor, card, texts } = editorWith();
    expect(order(editor)).toEqual(["one", "![[card:https://example.com]]", "two", "three"]);
    moveBlockTo(editor, card, { key: texts[2]!, placement: "after" });
    editor.update(() => {}, { discrete: true });
    expect(order(editor)).toEqual(["one", "two", "three", "![[card:https://example.com]]"]);
    moveBlockTo(editor, card, { key: texts[0]!, placement: "before" });
    editor.update(() => {}, { discrete: true });
    expect(order(editor)).toEqual(["![[card:https://example.com]]", "one", "two", "three"]);
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      expect($isNodeSelection(selection) && selection.getNodes().map((n) => n.getKey())).toEqual([card]);
    });
  });
});

describe("SavedCardExtension commands", () => {
  function selectCard(editor: LexicalEditor, key: string) {
    editor.update(
      () => {
        const selection = $createNodeSelection();
        selection.add(key);
        $setSelection(selection);
      },
      { discrete: true },
    );
  }
  const markdownOf = (editor: LexicalEditor, key: string) =>
    editor.getEditorState().read(() => ($getNodeByKey(key) as SavedCardNode).getMarkdown());

  it("aligns, captions, resizes, moves and removes the selected card", async () => {
    const { editor, card } = editorWith();
    const extension = new SavedCardExtension();
    const commands = extension.getCommands(editor);
    const queries = extension.getStateQueries(editor);
    expect(await queries.isSavedCardSelected()).toBe(false);
    selectCard(editor, card);
    expect(await queries.isSavedCardSelected()).toBe(true);
    expect(await queries.isSavedCardAlignedCenter()).toBe(true);

    commands.resizeSavedCard(480);
    commands.setSavedCardAlignment("right");
    commands.setSavedCardCaption("  Worth a read  ");
    editor.update(() => {}, { discrete: true });
    expect(markdownOf(editor, card)).toBe(
      "![[card:https://example.com||480]] <!-- align:right --> <!-- caption:Worth a read -->",
    );
    expect(await queries.isSavedCardAlignedRight()).toBe(true);
    expect(await commands.getSavedCardCaption()).toBe("Worth a read");
    expect(await commands.getSavedCardUrl()).toBe("https://example.com");

    commands.resizeSavedCard(null);
    commands.setSavedCardCaption("");
    editor.update(() => {}, { discrete: true });
    expect(markdownOf(editor, card)).toBe("![[card:https://example.com]] <!-- align:right -->");

    commands.moveSavedCard("down");
    editor.update(() => {}, { discrete: true });
    expect(order(editor)[2]).toBe("![[card:https://example.com]] <!-- align:right -->");

    commands.removeSavedCard();
    editor.update(() => {}, { discrete: true });
    expect(order(editor)).toEqual(["one", "two", "three"]);
  });

  it("never narrows a card below its minimum width", () => {
    const { editor, card } = editorWith();
    const commands = new SavedCardExtension().getCommands(editor);
    selectCard(editor, card);
    commands.resizeSavedCard(40);
    editor.update(() => {}, { discrete: true });
    expect(markdownOf(editor, card)).toBe("![[card:https://example.com||240]]");
  });
});
