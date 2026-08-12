/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/* @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import {
  createEditor,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  PASTE_COMMAND,
  type ElementNode,
  type LexicalEditor,
} from "lexical";
import { LinkNode, $createLinkNode, $isLinkNode } from "@lexical/link";
import { LinkExtension, __TEST_ONLY_LINK_INTERNALS } from "./LinkExtension";

/**
 * Each entry point for a URL — paste, autolink, programmatic command — is
 * exercised separately, because each one reaches the document through
 * different code. The rendered-anchor test at the top answers the question
 * the fix depends on: does a hostile href survive into a live anchor, or
 * does Lexical neutralize it at render time?
 */

function createTestEditor(): { editor: LexicalEditor; rootElement: HTMLElement } {
  const editor = createEditor({
    namespace: "link-security-test",
    nodes: [LinkNode],
    onError: (error) => {
      throw error;
    },
  });
  const rootElement = document.createElement("div");
  rootElement.contentEditable = "true";
  document.body.appendChild(rootElement);
  editor.setRootElement(rootElement);
  return { editor, rootElement };
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createPasteEvent(text: string): ClipboardEvent {
  return {
    clipboardData: {
      getData: (type: string) => (type === "text/plain" ? text : ""),
    },
    preventDefault: () => {},
  } as unknown as ClipboardEvent;
}

function seedParagraphWithCaret(editor: LexicalEditor, text = ""): void {
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      if (text) {
        paragraph.append($createTextNode(text));
      }
      $getRoot().append(paragraph);
      paragraph.selectEnd();
    },
    { discrete: true },
  );
}

async function collectLinkUrls(editor: LexicalEditor): Promise<string[]> {
  await flush();
  const urls: string[] = [];
  editor.getEditorState().read(() => {
    const visit = (node: ElementNode): void => {
      for (const child of node.getChildren()) {
        if ($isLinkNode(child)) {
          urls.push(child.getURL());
        }
        if ($isElementNode(child)) {
          visit(child);
        }
      }
    };
    visit($getRoot());
  });
  return urls;
}

describe("rendered anchor href (the empirical question)", () => {
  it("Lexical renders a javascript: LinkNode as about:blank, but the raw URL persists in JSON", async () => {
    const { editor, rootElement } = createTestEditor();

    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        const link = $createLinkNode("javascript:alert(1)");
        link.append($createTextNode("click me"));
        paragraph.append(link);
        $getRoot().append(paragraph);
      },
      { discrete: true },
    );
    await flush();

    // Render path: Lexical's LinkNode.createDOM sanitizes to about:blank,
    // so the live anchor is inert even before our validator existed.
    const anchor = rootElement.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute("href")).toBe("about:blank");

    // Persistence path: the hostile URL survives serialization untouched.
    // Any host rendering the exported JSON/markdown with its own renderer
    // receives it verbatim — which is why the *validator* default matters:
    // it keeps hostile URLs out of the model in the first place.
    const serialized = JSON.stringify(editor.getEditorState().toJSON());
    expect(serialized).toContain("javascript:alert(1)");
  });
});

describe("default validator", () => {
  const validator = new LinkExtension().config.validateUrl!;

  it("rejects script-bearing schemes", () => {
    expect(validator("javascript:alert(1)")).toBe(false);
    expect(validator("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(validator("vbscript:msgbox(1)")).toBe(false);
    expect(validator("JaVaScRiPt:alert(1)")).toBe(false);
  });

  it("accepts everyday link URLs unchanged", () => {
    expect(validator("http://example.com")).toBe(true);
    expect(validator("https://example.com/path?q=1")).toBe(true);
    expect(validator("mailto:person@example.com")).toBe(true);
    expect(validator("tel:+15551234567")).toBe(true);
    expect(validator("#heading")).toBe(true);
    expect(validator("//example.com/doc")).toBe(true);
  });
});

describe("paste entry point", () => {
  it("does not create a link from a pasted javascript: URL", async () => {
    const { editor } = createTestEditor();
    new LinkExtension().configure({ autoLinkUrls: true }).register(editor);
    seedParagraphWithCaret(editor, "prefix ");

    const handled = editor.dispatchCommand(
      PASTE_COMMAND,
      createPasteEvent("javascript:alert(1)"),
    );

    expect(handled).toBe(false);
    expect(await collectLinkUrls(editor)).toEqual([]);
  });

  it("still creates a link from a pasted https URL", async () => {
    const { editor } = createTestEditor();
    new LinkExtension().configure({ autoLinkUrls: true }).register(editor);
    seedParagraphWithCaret(editor, "prefix ");

    const handled = editor.dispatchCommand(
      PASTE_COMMAND,
      createPasteEvent("https://example.com/page"),
    );

    expect(handled).toBe(true);
    expect(await collectLinkUrls(editor)).toEqual(["https://example.com/page"]);
  });

  it("lets a host allowlist a custom scheme deliberately", async () => {
    const { editor } = createTestEditor();
    const extension = new LinkExtension().configure({
      autoLinkUrls: true,
      validateUrl: (url: string) => url.startsWith("obsidian://"),
    });
    extension.register(editor);
    seedParagraphWithCaret(editor);

    const handled = editor.dispatchCommand(
      PASTE_COMMAND,
      createPasteEvent("obsidian://open?vault=notes"),
    );

    expect(handled).toBe(true);
    expect(await collectLinkUrls(editor)).toEqual(["obsidian://open?vault=notes"]);
  });
});

describe("programmatic entry point", () => {
  it("insertLink refuses a hostile URL before touching the document", async () => {
    const { editor } = createTestEditor();
    const extension = new LinkExtension();
    extension.register(editor);
    const commands = extension.getCommands(editor);
    seedParagraphWithCaret(editor);

    commands.insertLink("javascript:alert(1)", "click me");
    await flush();

    editor.getEditorState().read(() => {
      expect($getRoot().getTextContent()).toBe("");
    });
  });

  it("updateLinkByKey rejects hostile URLs and keeps the existing href", async () => {
    const { editor } = createTestEditor();
    const extension = new LinkExtension();
    extension.register(editor);
    const commands = extension.getCommands(editor);

    let linkKey = "";
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        const link = $createLinkNode("https://example.com");
        link.append($createTextNode("site"));
        paragraph.append(link);
        $getRoot().append(paragraph);
        linkKey = link.getKey();
      },
      { discrete: true },
    );

    expect(commands.updateLinkByKey(linkKey, "javascript:alert(1)")).toBe(false);
    expect(commands.updateLinkByKey(linkKey, "data:text/html,x")).toBe(false);
    expect(await collectLinkUrls(editor)).toEqual(["https://example.com"]);

    expect(commands.updateLinkByKey(linkKey, "https://example.org/new")).toBe(true);
    expect(await collectLinkUrls(editor)).toEqual(["https://example.org/new"]);
  });
});

describe("autolink entry point", () => {
  const { createAutoLinkUrlMatcher } = __TEST_ONLY_LINK_INTERNALS;

  it("never matches script-scheme text", () => {
    const matcher = createAutoLinkUrlMatcher(new LinkExtension().config.validateUrl!);
    expect(matcher("javascript:alert(1)")).toBeNull();
    expect(matcher("data:text/html,x")).toBeNull();
  });

  it("matches plain https text and passes it through the validator", () => {
    const validateUrl = vi.fn(() => true);
    const matcher = createAutoLinkUrlMatcher(validateUrl);
    const match = matcher("see https://example.com/docs for details");
    expect(match).not.toBeNull();
    expect(match!.url).toBe("https://example.com/docs");
    expect(validateUrl).toHaveBeenCalledWith("https://example.com/docs");
  });

  it("drops a regex match the validator refuses", () => {
    const matcher = createAutoLinkUrlMatcher(() => false);
    expect(matcher("see https://example.com/docs")).toBeNull();
  });
});
