/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  $getSelection,
  $isRangeSelection,
  $parseSerializedNode,
  COMMAND_PRIORITY_NORMAL,
  PASTE_COMMAND,
  type LexicalEditor,
  type SerializedLexicalNode,
} from "lexical";
import { $isCodeNode } from "@lexical/code";
import { $findCellNode } from "@lexical/table";
import { markdownToJSON, type MarkdownBridgeOptions } from "../../core/markdown";
import { BaseExtension } from "../base/BaseExtension";
import { ExtensionCategory } from "../types";
import type { BaseExtensionConfig } from "../types";

/** Block-level markdown: headings, lists, tasks, quotes, fences, rules, tables. */
const BLOCK_SYNTAX: readonly RegExp[] = [
  /^ {0,3}#{1,6}[ \t]+\S/m,
  /^[ \t]*(?:[-*+]|\d{1,9}[.)])[ \t]+\S/m,
  /^[ \t]*[-*+][ \t]+\[[ xX]\][ \t]+\S/m,
  /^ {0,3}>[ \t]?\S/m,
  /^ {0,3}(?:`{3,}|~{3,})/m,
  /^ {0,3}(?:-{3,}|\*{3,}|_{3,})[ \t]*$/m,
  /^[ \t]*\|.+\|[ \t]*\n[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(?:\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*$/m,
];

/** Inline markdown: strong, emphasis, strike, code, links, images, wikilinks. */
const INLINE_SYNTAX: readonly RegExp[] = [
  /\*\*[^\s*][^*\n]*\*\*/,
  /(?:^|[\s(])__[^\s_][^_\n]*__(?=$|[\s).,;:!?])/m,
  /(?:^|[\s(])\*[^\s*][^*\n]*\*(?=$|[\s).,;:!?])/m,
  /(?:^|[\s(])_[^\s_][^_\n]*_(?=$|[\s).,;:!?])/m,
  /~~[^\s~][^~\n]*~~/,
  /`[^`\n]+`/,
  /!?\[[^\]\n]+\]\([^)\s]+\)/,
  /!?\[\[[^\]\n]+\]\]/,
];

/**
 * Whether plain text reads as markdown a person meant to be formatted: it has
 * block syntax (a `##` heading, a list, a quote, a fence, a table…) or inline
 * syntax (`**bold**`, `` `code` ``, `[text](url)`…). Prose that merely contains
 * a stray `*` or `_` does not count, so an ordinary paste is never rewritten.
 */
export function looksLikeMarkdown(text: string): boolean {
  if (!text || !text.trim()) {
    return false;
  }
  const source = text.replace(/\r\n?/g, "\n");
  return (
    BLOCK_SYNTAX.some((pattern) => pattern.test(source)) ||
    INLINE_SYNTAX.some((pattern) => pattern.test(source))
  );
}

const SEMANTIC_HTML =
  "h1,h2,h3,h4,h5,h6,ul,ol,li,blockquote,table,pre,strong,b,em,i,del,s,a[href],img,hr";

/**
 * Whether clipboard HTML carries real formatting (headings, lists, bold, links…).
 * Copying from a code editor or a terminal also puts HTML on the clipboard, but
 * only styled `div`/`span` wrappers around the same plain text; that is not
 * formatting, so the plain text is still what the person copied.
 */
export function hasSemanticHtml(html: string): boolean {
  if (!html || typeof DOMParser === "undefined") {
    return false;
  }
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.querySelector(SEMANTIC_HTML) !== null;
  } catch {
    return false;
  }
}

export type MarkdownPasteConfig = BaseExtensionConfig & {
  /**
   * Turn the extension off without removing it from the list. Defaults to on.
   */
  enabled?: boolean;
  /**
   * Nodes and transformers a preset's own markdown syntax needs (for example
   * Papyra's `[[wikilink]]`), handed to the markdown bridge so pasted text
   * reads the same way the preset's own documents do.
   */
  bridge?: Pick<MarkdownBridgeOptions, "extraNodes" | "extraTransformers">;
};

type MarkdownPasteCommands = Record<string, never>;
type MarkdownPasteStateQueries = Record<string, never>;

/**
 * MarkdownPasteExtension - formats pasted markdown as if it had been typed.
 *
 * Pasting `## Title` into a rich-text editor otherwise leaves the literal
 * characters on the page. When the clipboard holds plain text that reads as
 * markdown, this converts it with the editor's own markdown bridge and inserts
 * the result at the caret, so headings, lists, quotes, tables, code and links
 * arrive formatted.
 *
 * It stays out of the way when it cannot be sure of the person's intent: a copy
 * from inside the editor (which already keeps its formatting), clipboard HTML
 * with real formatting, files, a code block or a table cell, a read-only
 * editor, or text with no markdown in it.
 */
export class MarkdownPasteExtension extends BaseExtension<
  "markdownPaste",
  MarkdownPasteConfig,
  MarkdownPasteCommands,
  MarkdownPasteStateQueries
> {
  constructor(config: MarkdownPasteConfig = {}) {
    super("markdownPaste", [ExtensionCategory.Floating]);
    this.config = {
      ...(this.config || {}),
      showInToolbar: false,
      enabled: true,
      ...config,
    };
  }

  register(editor: LexicalEditor): () => void {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => this.handlePaste(editor, event),
      // Above the editor's own paste handling, below the link extension (a
      // pasted URL is theirs), so a bare URL is still turned into a link there.
      COMMAND_PRIORITY_NORMAL,
    );
  }

  private handlePaste(editor: LexicalEditor, event: unknown): boolean {
    if (this.config.enabled === false || !editor.isEditable()) {
      return false;
    }
    const clipboard = (event as ClipboardEvent | undefined)?.clipboardData;
    if (!clipboard) {
      return false;
    }

    const types = Array.from(clipboard.types ?? []);
    // Their own copy keeps its formatting; a file is the upload pipeline's.
    if (
      types.includes("application/x-lexical-editor") ||
      types.includes("Files") ||
      (clipboard.files && clipboard.files.length > 0)
    ) {
      return false;
    }

    const text = clipboard.getData("text/plain");
    if (!looksLikeMarkdown(text)) {
      return false;
    }
    if (hasSemanticHtml(clipboard.getData("text/html"))) {
      return false;
    }

    const nodes = this.convert(text);
    if (!nodes || nodes.length === 0) {
      return false;
    }

    // A paste command is dispatched inside an editor update already, so the
    // selection is read and changed directly; a nested `editor.update` would be
    // queued until after this handler had to answer.
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }
    const anchor = selection.anchor.getNode();
    // Code stays literal, and a table cell can't hold block content.
    if (
      $isCodeNode(anchor) ||
      $isCodeNode(anchor.getParent()) ||
      $findCellNode(anchor) !== null
    ) {
      return false;
    }
    selection.insertNodes(nodes.map((node) => $parseSerializedNode(node)));

    (event as ClipboardEvent).preventDefault();
    return true;
  }

  /**
   * The pasted text as nodes to insert, or null when it can't be read. A single
   * paragraph is inserted as its inline content so a pasted `**word**` joins the
   * sentence being written instead of splitting it into a new block.
   */
  private convert(markdown: string): SerializedLexicalNode[] | null {
    try {
      const document = markdownToJSON(markdown, {
        metadataMode: "none",
        ...(this.config.bridge ?? {}),
      });
      const blocks = (document.root.children ?? []) as SerializedLexicalNode[];
      const only = blocks.length === 1 ? (blocks[0] as unknown as { type: string; children?: SerializedLexicalNode[] }) : null;
      if (only && only.type === "paragraph" && Array.isArray(only.children)) {
        return only.children;
      }
      return blocks;
    } catch {
      return null;
    }
  }
}

export const markdownPasteExtension = new MarkdownPasteExtension();
