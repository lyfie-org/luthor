/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  type LexicalEditor,
} from "lexical";
import { $createCodeNode, CodeNode } from "@lexical/code";
import { $createHeadingNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import { jsonToMarkdown, markdownToJSON } from "../../core/markdown";
import {
  MentionTypeaheadExtension,
  sanitizeMentionUsername,
  type MentionTypeaheadMenuState,
} from "./MentionTypeaheadExtension";
import { WikilinkNode, WIKILINK_MARKDOWN_TRANSFORMER } from "./WikilinkNode";

const BRIDGE_OPTIONS = {
  metadataMode: "none" as const,
  extraNodes: [WikilinkNode],
  extraTransformers: [WIKILINK_MARKDOWN_TRANSFORMER],
};

type Harness = {
  editor: LexicalEditor;
  extension: MentionTypeaheadExtension;
  state: () => MentionTypeaheadMenuState;
  dispose: () => void;
};

const openHarnesses: Harness[] = [];

// jsdom ships no layout engine, so a Range cannot measure itself. The trigger
// asks the caret Range for its rect on every open; stub it so the caret
// position resolves to the origin instead of throwing.
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

/**
 * A live editor with the mention trigger registered. The root element is
 * attached because a rootless editor never commits its pending updates, so the
 * update listener that drives the trigger would never run.
 */
function createHarness(): Harness {
  const editor = createEditor({
    namespace: "mention-typeahead-test",
    nodes: [HeadingNode, QuoteNode, CodeNode, WikilinkNode],
    onError: (error) => {
      throw error;
    },
  });

  const root = window.document.createElement("div");
  root.contentEditable = "true";
  window.document.body.appendChild(root);
  editor.setRootElement(root);

  const extension = new MentionTypeaheadExtension();
  const unregister = extension.register(editor);

  let latest: MentionTypeaheadMenuState = {
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

/** Replace the document with a single paragraph and put the caret at its end. */
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

/**
 * Commit whatever the extension queued. `selectMention` runs a normal (async)
 * `editor.update`, which a test would otherwise read before it lands.
 */
function flush(editor: LexicalEditor): void {
  editor.update(() => {}, { discrete: true });
}

function paragraphText(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => $getRoot().getTextContent());
}

function editorMarkdown(editor: LexicalEditor): string {
  return jsonToMarkdown(editor.getEditorState().toJSON(), BRIDGE_OPTIONS).trim();
}

afterEach(() => {
  while (openHarnesses.length > 0) {
    openHarnesses.pop()?.dispose();
  }
});

describe("mention typeahead trigger", () => {
  it("opens at the start of a block", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "@bea");

    expect(state().isOpen).toBe(true);
    expect(state().query).toBe("bea");
  });

  it("opens after whitespace and narrows as the query grows", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "ping @b");
    expect(state()).toMatchObject({ isOpen: true, query: "b" });

    typeParagraph(editor, "ping @bea");
    expect(state()).toMatchObject({ isOpen: true, query: "bea" });
  });

  it("opens after ( and [ , matching the host's boundary rule", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "(@bea");
    expect(state().isOpen).toBe(true);

    typeParagraph(editor, "[@bea");
    expect(state().isOpen).toBe(true);
  });

  it("never opens inside an email local part", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "bea@example");
    expect(state().isOpen).toBe(false);

    typeParagraph(editor, "bea@example.com");
    expect(state().isOpen).toBe(false);
  });

  it("never opens mid-word", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "cc:@bea");
    expect(state().isOpen).toBe(false);
  });

  it("stays closed on a bare @", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "hello @");
    expect(state().isOpen).toBe(false);
  });

  it("closes on the first disallowed character", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "hello @bea");
    expect(state().isOpen).toBe(true);

    typeParagraph(editor, "hello @bea!");
    expect(state().isOpen).toBe(false);

    typeParagraph(editor, "hello @bea smith");
    expect(state().isOpen).toBe(false);
  });

  it("rejects a query that does not start alphanumeric", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "hello @.bea");
    expect(state().isOpen).toBe(false);
  });

  it("accepts the host's dot/underscore/dash username characters", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "hello @bea.smith_1-x");
    expect(state()).toMatchObject({ isOpen: true, query: "bea.smith_1-x" });
  });

  it("stops at the host's 64-character username limit", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, `@${"a".repeat(64)}`);
    expect(state().isOpen).toBe(true);

    typeParagraph(editor, `@${"a".repeat(65)}`);
    expect(state().isOpen).toBe(false);
  });

  it("opens inside a heading", () => {
    const { editor, state } = createHarness();

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const heading = $createHeadingNode("h2");
        const textNode = $createTextNode("@bea");
        heading.append(textNode);
        root.append(heading);
        textNode.select(4, 4);
      },
      { discrete: true },
    );

    expect(state().isOpen).toBe(true);
  });

  it("stays closed inside a code block", () => {
    const { editor, state } = createHarness();

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const code = $createCodeNode();
        const textNode = $createTextNode("@bea");
        code.append(textNode);
        root.append(code);
        textNode.select(4, 4);
      },
      { discrete: true },
    );

    expect(state().isOpen).toBe(false);
  });

  it("does not treat a preceding sibling's trailing bracket as a boundary", () => {
    const { editor, state } = createHarness();

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        const closing = $createTextNode("]]");
        const mention = $createTextNode("@bea");
        paragraph.append(closing, mention);
        root.append(paragraph);
        mention.select(4, 4);
      },
      { discrete: true },
    );

    expect(state().isOpen).toBe(false);
  });

  it("closes on Escape", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "@bea");
    expect(state().isOpen).toBe(true);

    window.document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(state().isOpen).toBe(false);
  });

  it("closes on a pointer press outside its own menu", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "@bea");
    expect(state().isOpen).toBe(true);

    const outside = window.document.createElement("div");
    window.document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));

    expect(state().isOpen).toBe(false);
    outside.remove();
  });

  it("stays open for a pointer press inside its own menu", () => {
    const { editor, state } = createHarness();

    typeParagraph(editor, "@bea");

    const menu = window.document.createElement("div");
    menu.className = "luthor-mention-typeahead";
    window.document.body.appendChild(menu);
    menu.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));

    expect(state().isOpen).toBe(true);
    menu.remove();
  });

  it("closes through the closeMentionMenu command", () => {
    const { editor, extension, state } = createHarness();

    typeParagraph(editor, "@bea");
    extension.getCommands(editor).closeMentionMenu();

    expect(state().isOpen).toBe(false);
  });

  it("reports open state through its state query", async () => {
    const { editor, extension } = createHarness();

    typeParagraph(editor, "@bea");
    await expect(extension.getStateQueries().isMentionMenuOpen()).resolves.toBe(true);
  });

  it("stops tracking once unregistered", () => {
    const harness = createHarness();

    harness.dispose();
    openHarnesses.length = 0;

    typeParagraph(harness.editor, "@bea");
    expect(harness.state().isOpen).toBe(false);
  });
});

/** Pick a suggestion and commit the resulting update. */
function selectMention(editor: LexicalEditor, extension: MentionTypeaheadExtension, username: string): void {
  extension.getCommands(editor).selectMention(username);
  flush(editor);
}

describe("mention selection", () => {
  it("replaces the trigger with plain @username text", () => {
    const { editor, extension, state } = createHarness();

    typeParagraph(editor, "ping @be");
    selectMention(editor, extension, "bea");

    expect(paragraphText(editor)).toBe("ping @bea ");
    expect(state().isOpen).toBe(false);
  });

  it("keeps the text after the caret intact", () => {
    const { editor, extension } = createHarness();

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode("ping @be soon");
        paragraph.append(textNode);
        root.append(paragraph);
        textNode.select(8, 8);
      },
      { discrete: true },
    );

    selectMention(editor, extension, "bea");

    expect(paragraphText(editor)).toBe("ping @bea  soon");
  });

  it("round-trips the inserted mention through markdown losslessly", () => {
    const { editor, extension } = createHarness();

    typeParagraph(editor, "ping @be");
    selectMention(editor, extension, "bea");

    const markdown = editorMarkdown(editor);
    expect(markdown).toBe("ping @bea");

    const reparsed = jsonToMarkdown(
      markdownToJSON(markdown, BRIDGE_OPTIONS),
      BRIDGE_OPTIONS,
    ).trim();
    expect(reparsed).toBe(markdown);
  });

  it("sanitizes a hostile username before writing it into the body", () => {
    const { editor, extension } = createHarness();

    typeParagraph(editor, "@be");
    selectMention(editor, extension, "bea]] ![[secret.png]]");

    expect(paragraphText(editor)).toBe("@bea ");
    expect(editorMarkdown(editor)).toBe("@bea");
  });

  it("ignores a selection with no usable username", () => {
    const { editor, extension, state } = createHarness();

    typeParagraph(editor, "@be");
    selectMention(editor, extension, "!!!");

    expect(paragraphText(editor)).toBe("@be");
    expect(state().isOpen).toBe(false);
  });

  it("ignores a selection while the menu is closed", () => {
    const { editor, extension } = createHarness();

    typeParagraph(editor, "no trigger here");
    selectMention(editor, extension, "bea");

    expect(paragraphText(editor)).toBe("no trigger here");
  });
});

describe("sanitizeMentionUsername", () => {
  it("keeps a valid handle unchanged", () => {
    expect(sanitizeMentionUsername("bea.smith_1-x")).toBe("bea.smith_1-x");
  });

  it("drops everything from the first illegal character", () => {
    expect(sanitizeMentionUsername("bea smith")).toBe("bea");
    expect(sanitizeMentionUsername("bea]]![[x.png]]")).toBe("bea");
  });

  it("skips a leading non-alphanumeric run", () => {
    expect(sanitizeMentionUsername("@bea")).toBe("bea");
    expect(sanitizeMentionUsername("...")).toBe("");
  });

  it("truncates at the host's 64-character limit", () => {
    expect(sanitizeMentionUsername("a".repeat(80))).toHaveLength(64);
  });
});
