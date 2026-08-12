/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

/*
 * Regression cover for the `[[` trigger. The extension shipped with Sprint 1.3
 * but nothing rendered its state until the typeahead menus were wired, so the
 * behaviour the dropdown depends on — when it opens, what it reports, and what
 * `selectWikilink` writes into the body — was never pinned down.
 */

import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  type LexicalEditor,
} from "lexical";
import { $createCodeNode, CodeNode } from "@lexical/code";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { jsonToMarkdown, markdownToJSON } from "../../core/markdown";
import {
  WikilinkTypeaheadExtension,
  type WikilinkTypeaheadMenuState,
} from "./WikilinkTypeaheadExtension";
import { WikilinkNode, WIKILINK_MARKDOWN_TRANSFORMER } from "./WikilinkNode";

const BRIDGE_OPTIONS = {
  metadataMode: "none" as const,
  extraNodes: [WikilinkNode],
  extraTransformers: [WIKILINK_MARKDOWN_TRANSFORMER],
};

type Harness = {
  editor: LexicalEditor;
  extension: WikilinkTypeaheadExtension;
  state: () => WikilinkTypeaheadMenuState;
  dispose: () => void;
};

const openHarnesses: Harness[] = [];

// jsdom has no layout engine, so the caret Range cannot measure itself.
beforeAll(() => {
  const emptyRect = {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON: () => ({}),
  } as DOMRect;

  Range.prototype.getBoundingClientRect = () => emptyRect;
  Range.prototype.getClientRects = () =>
    ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {},
    }) as unknown as DOMRectList;
});

function createHarness(): Harness {
  const editor = createEditor({
    namespace: "wikilink-typeahead-test",
    nodes: [HeadingNode, QuoteNode, CodeNode, WikilinkNode],
    onError: (error) => {
      throw error;
    },
  });

  const root = window.document.createElement("div");
  root.contentEditable = "true";
  window.document.body.appendChild(root);
  editor.setRootElement(root);

  const extension = new WikilinkTypeaheadExtension();
  const unregister = extension.register(editor);

  let latest: WikilinkTypeaheadMenuState = {
    isOpen: false,
    query: "",
    position: null,
  };
  const unsubscribe = extension.subscribe((next) => {
    latest = next;
  });

  const harness: Harness = {
    editor,
    extension,
    state: () => latest,
    dispose: () => {
      unsubscribe();
      unregister();
      root.remove();
    },
  };

  openHarnesses.push(harness);
  return harness;
}

function typeParagraph(editor: LexicalEditor, text: string): void {
  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      const textNode = $createTextNode(text);
      paragraph.append(textNode);
      root.append(paragraph);
      textNode.select(text.length, text.length);
    },
    { discrete: true },
  );
}

function selectWikilink(
  editor: LexicalEditor,
  extension: WikilinkTypeaheadExtension,
  target: string,
  alias?: string,
): void {
  extension.getCommands(editor).selectWikilink(target, alias);
  editor.update(() => {}, { discrete: true });
}

function editorMarkdown(editor: LexicalEditor): string {
  return jsonToMarkdown(editor.getEditorState().toJSON(), BRIDGE_OPTIONS).trim();
}

afterEach(() => {
  while (openHarnesses.length > 0) {
    openHarnesses.pop()?.dispose();
  }
});

describe("wikilink typeahead trigger", () => {
  it("opens on `[[` and narrows as the query grows", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "see [[");
    expect(state()).toMatchObject({ isOpen: true, query: "" });

    typeParagraph(editor, "see [[Road");
    expect(state()).toMatchObject({ isOpen: true, query: "Road" });
  });

  it("stays closed for the `![[` embed syntax", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "![[diagram");
    expect(state().isOpen).toBe(false);
  });

  it("closes once the link is closed or aliased", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "see [[Roadmap]]");
    expect(state().isOpen).toBe(false);

    typeParagraph(editor, "see [[Roadmap|plan");
    expect(state().isOpen).toBe(false);
  });

  it("stays closed inside a code block", () => {
    const { editor, state } = createHarness();

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const code = $createCodeNode();
        const textNode = $createTextNode("[[Roadmap");
        code.append(textNode);
        root.append(code);
        textNode.select(9, 9);
      },
      { discrete: true },
    );

    expect(state().isOpen).toBe(false);
  });

  it("closes on Escape", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "[[Road");
    window.document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(state().isOpen).toBe(false);
  });

  it("closes on a pointer press outside its own menu, and not inside it", () => {
    const { editor, state } = createHarness();

    const menu = window.document.createElement("div");
    menu.className = "luthor-wikilink-typeahead";
    window.document.body.appendChild(menu);

    typeParagraph(editor, "[[Road");
    menu.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    expect(state().isOpen).toBe(true);

    const outside = window.document.createElement("div");
    window.document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    expect(state().isOpen).toBe(false);

    menu.remove();
    outside.remove();
  });

  it("closes through the closeWikilinkMenu command", () => {
    const { editor, extension, state } = createHarness();

    typeParagraph(editor, "[[Road");
    extension.getCommands(editor).closeWikilinkMenu();

    expect(state().isOpen).toBe(false);
  });
});

describe("wikilink selection", () => {
  it("replaces the trigger with a wikilink that round-trips losslessly", () => {
    const { editor, extension, state } = createHarness();

    typeParagraph(editor, "see [[Road");
    selectWikilink(editor, extension, "Roadmap");

    const markdown = editorMarkdown(editor);
    expect(markdown).toBe("see [[Roadmap]]");
    expect(state().isOpen).toBe(false);

    const reparsed = jsonToMarkdown(
      markdownToJSON(markdown, BRIDGE_OPTIONS),
      BRIDGE_OPTIONS,
    ).trim();
    expect(reparsed).toBe(markdown);
  });

  it("writes an aliased wikilink when the host supplies one", () => {
    const { editor, extension } = createHarness();

    typeParagraph(editor, "[[Road");
    selectWikilink(editor, extension, "Roadmap", "the plan");

    expect(editorMarkdown(editor)).toBe("[[Roadmap|the plan]]");
  });

  it("ignores a selection while the menu is closed", () => {
    const { editor, extension } = createHarness();

    typeParagraph(editor, "no trigger here");
    selectWikilink(editor, extension, "Roadmap");

    expect(editorMarkdown(editor)).toBe("no trigger here");
  });
});
