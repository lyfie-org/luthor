/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  createEditor,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  ParagraphNode,
  TextNode,
  type LexicalEditor,
} from "lexical";
import { markdownToJSON, jsonToMarkdown } from "../core/markdown";
import { htmlToJSON, jsonToHTML } from "../core/html";

/**
 * Arabic and Hebrew documents, and paragraphs that mix scripts, must
 * survive the bridges with every character in source order.
 *
 * Direction itself is deliberately not stored: Lexical 0.40 emits
 * `dir="auto"` and lets the browser's bidi algorithm resolve each block.
 * That is the stronger behavior — it handles mixed runs correctly without
 * the editor guessing — but it means bridge JSON carries
 * `direction: null`, so a host rendering that JSON through its own
 * renderer has to emit `dir="auto"` itself. Pinned below so the choice is
 * visible if a future Lexical starts persisting direction.
 */

const NONE = { metadataMode: "none" as const };

const ARABIC = "مرحبا بالعالم";
const HEBREW = "שלום עולם";

type Block = {
  type?: string;
  direction?: string | null;
  children?: Block[];
  text?: string;
};

function blocks(document: unknown): Block[] {
  return (document as { root?: { children?: Block[] } }).root?.children ?? [];
}

function textOf(block: Block): string {
  const parts: string[] = [];
  const visit = (node: Block): void => {
    if (typeof node.text === "string") {
      parts.push(node.text);
    }
    for (const child of node.children ?? []) {
      visit(child);
    }
  };
  visit(block);
  return parts.join("");
}

function createLiveEditor(): { editor: LexicalEditor; rootElement: HTMLElement } {
  const editor = createEditor({
    namespace: "bidi-test",
    nodes: [ParagraphNode, TextNode],
    onError: (error) => {
      throw error;
    },
  });
  // Direction lands on the DOM during reconciliation, so the editor needs
  // a real root element for this to be observable at all.
  const rootElement = document.createElement("div");
  rootElement.contentEditable = "true";
  document.body.appendChild(rootElement);
  editor.setRootElement(rootElement);
  return { editor, rootElement };
}

function setParagraph(editor: LexicalEditor, text: string): void {
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(text));
      $getRoot().clear();
      $getRoot().append(paragraph);
    },
    { discrete: true },
  );
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("RTL text through the markdown bridge", () => {
  it("preserves Arabic and Hebrew paragraphs verbatim", () => {
    const source = `${ARABIC}\n\n${HEBREW}`;
    const document = markdownToJSON(source, NONE);
    const parsed = blocks(document);

    expect(textOf(parsed[0]!)).toBe(ARABIC);
    expect(textOf(parsed[1]!)).toBe(HEBREW);
    expect(jsonToMarkdown(document, NONE)).toContain(ARABIC);
  });

  it("keeps every character of a mixed LTR/RTL paragraph in source order", () => {
    const ltrFirst = markdownToJSON(`English ${ARABIC} tail`, NONE);
    const rtlFirst = markdownToJSON(`${ARABIC} English tail`, NONE);

    expect(textOf(blocks(ltrFirst)[0]!)).toBe(`English ${ARABIC} tail`);
    expect(textOf(blocks(rtlFirst)[0]!)).toBe(`${ARABIC} English tail`);
  });

  it("round-trips RTL list items and headings without reordering", () => {
    const source = `# ${ARABIC}\n\n- ${HEBREW}\n- ${ARABIC}`;
    const once = jsonToMarkdown(markdownToJSON(source, NONE), NONE);
    const twice = jsonToMarkdown(markdownToJSON(once, NONE), NONE);

    expect(once).toContain(ARABIC);
    expect(once).toContain(HEBREW);
    // Idempotency: a second pass must not shuffle or re-mark anything.
    expect(twice).toBe(once);
  });
});

describe("bidi direction is resolved by the browser, not stored", () => {
  it("renders RTL blocks with dir=auto and leaves direction null in the model", async () => {
    const { editor, rootElement } = createLiveEditor();
    setParagraph(editor, ARABIC);
    await flush();

    expect(rootElement.firstElementChild?.getAttribute("dir")).toBe("auto");

    const serialized = editor.getEditorState().toJSON() as {
      root: { children: Array<{ direction?: string | null }> };
    };
    expect(serialized.root.children[0]?.direction).toBeNull();
  });

  it("uses dir=auto for LTR blocks too, so mixed documents need no special casing", async () => {
    const { editor, rootElement } = createLiveEditor();
    setParagraph(editor, "plain english");
    await flush();

    expect(rootElement.firstElementChild?.getAttribute("dir")).toBe("auto");
  });
});

describe("RTL text through the HTML bridge", () => {
  it("preserves the content of an explicitly dir-marked paragraph", () => {
    const document = htmlToJSON(`<p dir="rtl">${ARABIC}</p>`, NONE);

    expect(textOf(blocks(document)[0]!)).toBe(ARABIC);
    expect(jsonToHTML(document, NONE)).toContain(ARABIC);
  });

  it("keeps bidi content intact across nested inline formatting", () => {
    const html = `<p>${ARABIC} <strong>${HEBREW}</strong> tail</p>`;
    const text = textOf(blocks(htmlToJSON(html, NONE))[0]!);

    expect(text).toContain(ARABIC);
    expect(text).toContain(HEBREW);
    expect(text).toContain("tail");
  });
});
