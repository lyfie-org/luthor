/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  createEditor,
  PASTE_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { $createCodeNode, CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkExtension } from "../formatting/LinkExtension";
import {
  MarkdownPasteExtension,
  hasSemanticHtml,
  looksLikeMarkdown,
} from "./MarkdownPasteExtension";

function mount(config?: ConstructorParameters<typeof MarkdownPasteExtension>[0]) {
  const root = document.createElement("div");
  root.contentEditable = "true";
  document.body.appendChild(root);

  const editor = createEditor({
    namespace: "markdown-paste-test",
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, LinkNode, AutoLinkNode],
    onError: (error) => {
      throw error;
    },
  });
  editor.setRootElement(root);
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      $getRoot().clear().append(paragraph);
      paragraph.select();
    },
    { discrete: true },
  );

  const unregister = new MarkdownPasteExtension(config).register(editor);
  return {
    editor,
    cleanup: () => {
      unregister();
      root.remove();
    },
  };
}

type Clipboard = { text?: string; html?: string; types?: string[]; files?: unknown[] };

function paste(editor: LexicalEditor, clipboard: Clipboard) {
  const preventDefault = vi.fn();
  const data: Record<string, string> = {
    "text/plain": clipboard.text ?? "",
    "text/html": clipboard.html ?? "",
  };
  const types = clipboard.types ?? [
    ...(clipboard.text ? ["text/plain"] : []),
    ...(clipboard.html ? ["text/html"] : []),
  ];
  const event = {
    clipboardData: { types, files: clipboard.files ?? [], getData: (type: string) => data[type] ?? "" },
    preventDefault,
  } as unknown as ClipboardEvent;
  const handled = editor.dispatchCommand(PASTE_COMMAND, event);
  // Commit what the command queued, so the tests can read the new state.
  editor.update(() => {}, { discrete: true });
  return { handled, prevented: preventDefault.mock.calls.length > 0 };
}

function outline(editor: LexicalEditor): string[] {
  return editor.getEditorState().read(() =>
    $getRoot()
      .getChildren()
      .map((node: LexicalNode) => {
        const tag = (node as unknown as { getTag?: () => string }).getTag?.();
        return `${node.getType()}${tag ? `:${tag}` : ""}|${node.getTextContent()}`;
      }),
  );
}

describe("looksLikeMarkdown", () => {
  it.each([
    "## Text",
    "# One",
    "### This was copied",
    "- one\n- two",
    "1. first\n2. second",
    "- [ ] task",
    "> a quote",
    "```ts\nconst a = 1;\n```",
    "---",
    "| a | b |\n| --- | --- |\n| 1 | 2 |",
    "some **bold** words",
    "an *emphasised* word",
    "some `code` here",
    "see [a link](https://example.com)",
    "~~gone~~",
    "a [[Wiki Note]] link",
  ])("recognises %j", (text) => {
    expect(looksLikeMarkdown(text)).toBe(true);
  });

  it.each([
    "",
    "   ",
    "just a sentence.",
    "snake_case_name and 2*3*4",
    "#hashtag",
    "price is $5 - $10",
    "a - b",
    "2 * 3 = 6",
  ])("leaves %j alone", (text) => {
    expect(looksLikeMarkdown(text)).toBe(false);
  });
});

describe("hasSemanticHtml", () => {
  it("is true for real formatting and false for styled wrappers", () => {
    expect(hasSemanticHtml("<h2>Title</h2>")).toBe(true);
    expect(hasSemanticHtml("<p>some <b>bold</b></p>")).toBe(true);
    expect(hasSemanticHtml("<ul><li>a</li></ul>")).toBe(true);
    expect(hasSemanticHtml("<div style='color:#ccc'><div><span>## Text</span></div></div>")).toBe(false);
    expect(hasSemanticHtml("")).toBe(false);
  });
});

describe("MarkdownPasteExtension", () => {
  it("turns a pasted ## heading into a heading without the hashes", () => {
    const { editor, cleanup } = mount();
    const result = paste(editor, { text: "## Text" });
    expect(result).toEqual({ handled: true, prevented: true });
    expect(outline(editor)).toEqual(["heading:h2|Text"]);
    cleanup();
  });

  it("formats a pasted list, quote and code block", () => {
    const { editor, cleanup } = mount();
    paste(editor, { text: "- one\n- two" });
    expect(outline(editor)).toEqual(["list:ul|one\n\ntwo"]);
    cleanup();

    const quote = mount();
    paste(quote.editor, { text: "> wise words" });
    expect(outline(quote.editor)).toEqual(["quote|wise words"]);
    quote.cleanup();

    const code = mount();
    paste(code.editor, { text: "```js\nconst a = 1;\n```" });
    expect(outline(code.editor)).toEqual(["code|const a = 1;"]);
    code.cleanup();
  });

  it("keeps inline formatting inside the paragraph being written", () => {
    const { editor, cleanup } = mount();
    editor.update(
      () => {
        const paragraph = $getRoot().getFirstChild();
        if ($isElementNode(paragraph)) {
          paragraph.append($createTextNode("Hello "));
          paragraph.selectEnd();
        }
      },
      { discrete: true },
    );
    paste(editor, { text: "**bold** and `code`" });
    expect(outline(editor)).toEqual(["paragraph|Hello bold and code"]);
    const formats = editor
      .getEditorState()
      .read(() => ($getRoot().getFirstChild() as unknown as { getChildren(): LexicalNode[] }).getChildren().map((n) => n.getType()));
    expect(formats.length).toBeGreaterThan(1);
    cleanup();
  });

  it("does not touch ordinary text", () => {
    const { editor, cleanup } = mount();
    expect(paste(editor, { text: "just a sentence." })).toEqual({ handled: false, prevented: false });
    expect(paste(editor, { text: "snake_case_name and 2*3*4" }).handled).toBe(false);
    cleanup();
  });

  it("leaves the editor's own copies and files alone", () => {
    const { editor, cleanup } = mount();
    expect(paste(editor, { text: "## Text", types: ["text/plain", "application/x-lexical-editor"] }).handled).toBe(false);
    expect(paste(editor, { text: "## Text", types: ["text/plain", "Files"], files: [{}] }).handled).toBe(false);
    cleanup();
  });

  it("defers to clipboard HTML that carries real formatting", () => {
    const { editor, cleanup } = mount();
    expect(paste(editor, { text: "## Text", html: "<h2>Text</h2>" }).handled).toBe(false);
    cleanup();
  });

  it("still reads markdown copied from a code editor (styled spans only)", () => {
    const { editor, cleanup } = mount();
    const html = "<meta charset='utf-8'><div style='color:#ccc'><div><span>## Text</span></div></div>";
    expect(paste(editor, { text: "## Text", html }).handled).toBe(true);
    expect(outline(editor)).toEqual(["heading:h2|Text"]);
    cleanup();
  });

  it("keeps text literal inside a code block", () => {
    const { editor, cleanup } = mount();
    editor.update(
      () => {
        const code = $createCodeNode();
        code.append($createTextNode("x"));
        $getRoot().clear().append(code);
        code.selectEnd();
      },
      { discrete: true },
    );
    expect(paste(editor, { text: "## Text" }).handled).toBe(false);
    cleanup();
  });

  it("does nothing when switched off or read-only", () => {
    const off = mount({ enabled: false });
    expect(paste(off.editor, { text: "## Text" }).handled).toBe(false);
    off.cleanup();

    const locked = mount();
    locked.editor.setEditable(false);
    expect(paste(locked.editor, { text: "## Text" }).handled).toBe(false);
    locked.cleanup();
  });
});

describe("pasted text and the link extension", () => {
  it("links a lone address, but never a heading, a tag or a sentence", () => {
    const { editor, cleanup } = mount();
    const link = new LinkExtension();
    (link as unknown as { config: object }).config = {
      ...(link as unknown as { config: object }).config,
      autoLinkUrls: true,
    };
    const unregister = link.register(editor);

    expect(paste(editor, { text: "https://example.com" }).handled).toBe(true);
    for (const text of ["## Text", "#hashtag", "see https://example.com now"]) {
      expect(paste(editor, { text }).handled).toBe(text === "## Text");
    }

    unregister();
    cleanup();
  });
});
