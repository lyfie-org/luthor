/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  type LexicalEditor,
} from "lexical";
import { FileDropUploadExtension } from "./FileDropUploadExtension";
import { $isFileEmbedNode, FileEmbedNode } from "./FileEmbedNode";

const disposers: Array<() => void> = [];

afterEach(() => {
  while (disposers.length > 0) {
    disposers.pop()?.();
  }
});

function createHarness(uploadFile?: (file: File) => Promise<{ filename: string }>) {
  const editor = createEditor({
    namespace: "file-drop-upload-test",
    nodes: [FileEmbedNode],
    onError: (error) => {
      throw error;
    },
  });
  const root = window.document.createElement("div");
  root.contentEditable = "true";
  window.document.body.appendChild(root);
  editor.setRootElement(root);

  const extension = new FileDropUploadExtension({ uploadFile });
  const unregister = extension.register(editor);
  disposers.push(() => {
    unregister();
    root.remove();
  });

  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      const text = $createTextNode("hello");
      paragraph.append(text);
      $getRoot().clear().append(paragraph);
      text.select(5, 5);
    },
    { discrete: true },
  );

  return { editor, commands: extension.getCommands(editor) };
}

function embedTargets(editor: LexicalEditor): string[] {
  editor.update(() => {}, { discrete: true });
  return editor.getEditorState().read(() =>
    $getRoot()
      .getChildren()
      .filter($isFileEmbedNode)
      .map((node) => node.getTarget()),
  );
}

describe("uploadAndEmbedFile", () => {
  it("uploads through the host callback and embeds the returned filename", async () => {
    const uploadFile = vi.fn(async () => ({ filename: "photo.png" }));
    const { editor, commands } = createHarness(uploadFile);
    const file = new File(["x"], "photo.png", { type: "image/png" });

    await commands.uploadAndEmbedFile(file);

    expect(uploadFile).toHaveBeenCalledWith(file);
    expect(embedTargets(editor)).toEqual(["photo.png"]);
  });

  it("sanitizes the filename before it reaches the body", async () => {
    const { editor, commands } = createHarness(async () => ({ filename: "a[b]#c.png" }));

    await commands.uploadAndEmbedFile(new File(["x"], "x.png"));

    expect(embedTargets(editor)).toEqual(["a-b--c.png"]);
  });

  it("rejects when the upload fails, so the caller can report it", async () => {
    const { editor, commands } = createHarness(async () => {
      throw new Error("offline");
    });

    await expect(commands.uploadAndEmbedFile(new File(["x"], "x.png"))).rejects.toThrow("offline");
    expect(embedTargets(editor)).toEqual([]);
  });

  it("rejects when no upload callback is configured", async () => {
    const { commands } = createHarness();

    await expect(commands.uploadAndEmbedFile(new File(["x"], "x.png"))).rejects.toThrow(
      /no uploadFile/,
    );
  });
});
