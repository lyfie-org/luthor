/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  $createNodeSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setSelection,
  createEditor,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { describe, expect, it } from "vitest";
import { moveSelectedNode, removeSelectedNode } from "./mediaSelection";
import { YouTubeEmbedNode } from "./YouTubeEmbedExtension";

const isEmbed = (node: LexicalNode | null) => node instanceof YouTubeEmbedNode;

function setup(): { editor: LexicalEditor; embedKey: string } {
  const editor = createEditor({ nodes: [YouTubeEmbedNode], onError: (error) => { throw error; } });
  let embedKey = "";
  editor.update(
    () => {
      const root = $getRoot();
      const embed = new YouTubeEmbedNode({
        src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        width: 560,
        height: 315,
        alignment: "center",
      });
      embedKey = embed.getKey();
      root.append(
        $createParagraphNode().append($createTextNode("first")),
        embed,
        $createParagraphNode().append($createTextNode("last")),
      );
      const selection = $createNodeSelection();
      selection.add(embedKey);
      $setSelection(selection);
    },
    { discrete: true },
  );
  return { editor, embedKey };
}

function order(editor: LexicalEditor): string[] {
  return editor.getEditorState().read(() =>
    $getRoot().getChildren().map((node) => (node instanceof YouTubeEmbedNode ? "embed" : node.getTextContent())),
  );
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("moving and removing a selected embed", () => {
  it("moves it one block at a time and stops at the edges", async () => {
    const { editor } = setup();

    moveSelectedNode(editor, isEmbed, "up");
    await settle();
    expect(order(editor)).toEqual(["embed", "first", "last"]);

    // Already first: nothing to move past.
    moveSelectedNode(editor, isEmbed, "up");
    await settle();
    expect(order(editor)).toEqual(["embed", "first", "last"]);

    moveSelectedNode(editor, isEmbed, "down");
    moveSelectedNode(editor, isEmbed, "down");
    await settle();
    expect(order(editor)).toEqual(["first", "last", "embed"]);
  });

  it("removes it and ignores a selection it doesn't own", async () => {
    const { editor } = setup();

    moveSelectedNode(editor, () => false, "up");
    removeSelectedNode(editor, () => false);
    await settle();
    expect(order(editor)).toEqual(["first", "embed", "last"]);

    removeSelectedNode(editor, isEmbed);
    await settle();
    expect(order(editor)).toEqual(["first", "last"]);
  });
});
