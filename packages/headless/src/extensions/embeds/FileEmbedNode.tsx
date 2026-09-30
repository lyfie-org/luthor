/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type ElementNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { ElementTransformer, TextMatchTransformer } from "@lexical/markdown";
import type { ReactNode } from "react";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { MediaFrame } from "../media/MediaFrame";
import {
  formatEmbedTarget,
  formatMediaDirectives,
  isFileTarget,
  parseEmbedTarget,
  parseMediaDirectives,
  type MediaAlignment,
} from "../media/mediaGrammar";

/**
 * Serialized shape of a {@link FileEmbedNode} (version 2).
 *
 * Version 1 stored only `target` — the whole text inside `![[…]]`, pipes and
 * all. {@link FileEmbedNode.importJSON} still reads it (live collaboration rooms
 * and saved editor states carry v1 nodes), parsing that text with the media
 * grammar.
 */
export type SerializedFileEmbedNode = Spread<
  {
    /** The file reference, without fragment or pipe segments. */
    target: string;
    fragment?: string;
    alt?: string;
    width?: number;
    height?: number;
    align?: MediaAlignment;
    caption?: string;
    /** Pipe segments the grammar doesn't own, verbatim. */
    extra?: string[];
    /** Trailing `<!-- … -->` directives the grammar doesn't own, verbatim. */
    directives?: string[];
    escapedPipes?: boolean;
    inline?: boolean;
    /** The exact markdown this embed was parsed from (byte-stable export). */
    source?: string;
  },
  SerializedLexicalNode
>;

/** The editable fields of an embed, as the markdown grammar sees them. */
export interface FileEmbedFields {
  target: string;
  fragment?: string;
  alt?: string;
  width?: number;
  height?: number;
  align?: MediaAlignment;
  caption?: string;
  extra?: string[];
  directives?: string[];
  escapedPipes?: boolean;
  inline?: boolean;
}

function formatFields(fields: FileEmbedFields): string {
  const inner = formatEmbedTarget({
    target: fields.target,
    fragment: fields.fragment ?? "",
    alt: fields.alt,
    width: fields.width,
    height: fields.height,
    extra: fields.extra ?? [],
    escapedPipes: fields.escapedPipes ?? false,
  });
  // Directives are a line-level syntax: an inline embed has none of its own.
  const directives = fields.inline
    ? ""
    : formatMediaDirectives({
        align: fields.align,
        caption: fields.caption,
        unknown: fields.directives ?? [],
      });
  return `![[${inner}]]${directives}`;
}

/**
 * Parse one embed's markdown (`![[inner]]` plus, for a block, any trailing
 * directives). Null when it isn't one.
 */
export function parseFileEmbedMarkdown(
  markdown: string,
  inline = false,
): FileEmbedFields | null {
  const match = /^!\[\[([^\]\r\n]+)\]\]((?:\s*<!--[\s\S]*?-->)*)\s*$/.exec(markdown.trim());
  if (!match) {
    return null;
  }
  const inner = parseEmbedTarget(match[1] ?? "");
  if (!inner.target) {
    return null;
  }
  const directives = parseMediaDirectives(match[2] ?? "");
  if (!directives) {
    return null;
  }
  return {
    target: inner.target,
    fragment: inner.fragment,
    alt: inner.alt,
    width: inner.width,
    height: inner.height,
    extra: inner.extra,
    escapedPipes: inner.escapedPipes,
    align: directives.align,
    caption: directives.caption,
    directives: directives.unknown,
    inline,
  };
}

/**
 * An embedded attachment: `![[file.ext]]`, optionally sized (`|480`,
 * `|640x360`), aliased (`|Alt text`), fragment-addressed (`#page=3`), aligned and
 * captioned (trailing `<!-- align:… -->` / `<!-- caption:… -->`). Block by
 * default; inline when written mid-paragraph.
 *
 * **Byte-stable.** A node parsed from markdown remembers that exact text and
 * exports it for as long as its fields still describe it. Once anything changes
 * (a resize, a new caption, a peer's edit arriving over collaboration), it
 * exports the canonical form instead. Opening and saving a note never rewrites
 * an embed nobody touched.
 *
 * Rendering goes through {@link MediaFrame}; the host's {@link EmbedResolvers}
 * supply URLs and metadata, so the node itself is host-agnostic.
 */
export class FileEmbedNode extends DecoratorNode<ReactNode> {
  /** The file reference, without fragment or pipe segments (`photo.png`). */
  __target: string;
  __fragment: string;
  __alt: string | undefined;
  __width: number | undefined;
  __height: number | undefined;
  __align: MediaAlignment | undefined;
  __caption: string | undefined;
  __extra: string[];
  __directives: string[];
  __escapedPipes: boolean;
  __inline: boolean;
  /** The markdown this node was parsed from, if any. */
  __source: string | undefined;

  static getType(): string {
    return "fileEmbed";
  }

  static clone(node: FileEmbedNode): FileEmbedNode {
    return new FileEmbedNode(node.getFields(), node.__source, node.__key);
  }

  static importJSON(serialized: SerializedFileEmbedNode): FileEmbedNode {
    // v1: `target` was the whole `![[…]]` inner text.
    if (!serialized.version || serialized.version < 2) {
      const source = `![[${serialized.target}]]`;
      const fields = parseFileEmbedMarkdown(source) ?? { target: serialized.target };
      return new FileEmbedNode(fields, source);
    }
    return new FileEmbedNode(
      {
        target: serialized.target,
        fragment: serialized.fragment,
        alt: serialized.alt,
        width: serialized.width,
        height: serialized.height,
        align: serialized.align,
        caption: serialized.caption,
        extra: serialized.extra,
        directives: serialized.directives,
        escapedPipes: serialized.escapedPipes,
        inline: serialized.inline,
      },
      serialized.source,
    );
  }

  // File embeds are authored through markdown, not pasted HTML; the explicit
  // null import keeps Lexical from warning about the custom exportDOM.
  static importDOM(): DOMConversionMap | null {
    return null;
  }

  // Collaboration (@lexical/yjs) constructs nodes with no arguments and then
  // copies every `__` property across, so every argument is optional.
  constructor(fields?: FileEmbedFields | string, source?: string, key?: NodeKey) {
    super(key);
    const f: FileEmbedFields =
      typeof fields === "string" ? { target: fields } : (fields ?? { target: "" });
    this.__target = f.target;
    this.__fragment = f.fragment ?? "";
    this.__alt = f.alt || undefined;
    this.__width = f.width && f.width > 0 ? f.width : undefined;
    this.__height = f.height && f.height > 0 ? f.height : undefined;
    this.__align = f.align;
    this.__caption = f.caption || undefined;
    this.__extra = f.extra ? [...f.extra] : [];
    this.__directives = f.directives ? [...f.directives] : [];
    this.__escapedPipes = f.escapedPipes ?? false;
    this.__inline = f.inline ?? false;
    this.__source = source && source.length > 0 ? source : undefined;
  }

  exportJSON(): SerializedFileEmbedNode {
    return {
      type: "fileEmbed",
      version: 2,
      target: this.__target,
      ...(this.__fragment ? { fragment: this.__fragment } : {}),
      ...(this.__alt ? { alt: this.__alt } : {}),
      ...(this.__width ? { width: this.__width } : {}),
      ...(this.__height ? { height: this.__height } : {}),
      ...(this.__align ? { align: this.__align } : {}),
      ...(this.__caption ? { caption: this.__caption } : {}),
      ...(this.__extra.length > 0 ? { extra: [...this.__extra] } : {}),
      ...(this.__directives.length > 0 ? { directives: [...this.__directives] } : {}),
      ...(this.__escapedPipes ? { escapedPipes: true } : {}),
      ...(this.__inline ? { inline: true } : {}),
      ...(this.__source ? { source: this.__source } : {}),
    };
  }

  createDOM(): HTMLElement {
    const element = document.createElement(this.__inline ? "span" : "div");
    element.className = this.__inline
      ? "luthor-file-embed-shell luthor-file-embed-shell--inline"
      : "luthor-file-embed-shell";
    return element;
  }

  updateDOM(prevNode: FileEmbedNode): boolean {
    // Block ↔ inline needs a different container element.
    return prevNode.__inline !== this.__inline;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement(this.__inline ? "span" : "div");
    element.className = "luthor-file-embed luthor-file-embed--chip";
    element.setAttribute("data-luthor-file-embed-target", this.__target);
    element.textContent = this.__alt ?? this.__target;
    return { element };
  }

  isInline(): boolean {
    return this.__inline;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getTextContent(): string {
    return this.__target;
  }

  getTarget(): string {
    return this.getLatest().__target;
  }

  /** A snapshot of the editable fields. */
  getFields(): FileEmbedFields {
    const self = this.getLatest();
    return {
      target: self.__target,
      fragment: self.__fragment,
      alt: self.__alt,
      width: self.__width,
      height: self.__height,
      align: self.__align,
      caption: self.__caption,
      extra: [...self.__extra],
      directives: [...self.__directives],
      escapedPipes: self.__escapedPipes,
      inline: self.__inline,
    };
  }

  /**
   * This embed's markdown: the exact source text while the fields still say
   * what it said, otherwise the canonical form of the current fields.
   */
  getMarkdown(): string {
    const self = this.getLatest();
    const canonical = formatFields(self.getFields());
    if (self.__source) {
      const parsed = parseFileEmbedMarkdown(self.__source, self.__inline);
      if (parsed && formatFields(parsed) === canonical) {
        return self.__source;
      }
    }
    return canonical;
  }

  /** Replace the file this embed points at (size, caption and alignment stay). */
  setTarget(target: string): this {
    const writable = this.getWritable();
    writable.__target = target;
    return writable;
  }

  /** Set (or clear, with `undefined`) the display size in CSS pixels. */
  setSize(width: number | undefined, height?: number): this {
    const writable = this.getWritable();
    writable.__width = width && width > 0 ? Math.round(width) : undefined;
    writable.__height = writable.__width && height && height > 0 ? Math.round(height) : undefined;
    return writable;
  }

  setAlign(align: MediaAlignment | undefined): this {
    const writable = this.getWritable();
    writable.__align = align;
    return writable;
  }

  setCaption(caption: string | undefined): this {
    const writable = this.getWritable();
    writable.__caption = caption && caption.trim() !== "" ? caption.trim() : undefined;
    return writable;
  }

  setAlt(alt: string | undefined): this {
    const writable = this.getWritable();
    writable.__alt = alt && alt.trim() !== "" ? alt.trim() : undefined;
    return writable;
  }

  decorate(): ReactNode {
    return (
      <MediaFrame
        target={this.__target}
        fragment={this.__fragment}
        alt={this.__alt}
        width={this.__width}
        height={this.__height}
        align={this.__align}
        caption={this.__caption}
        inline={this.__inline}
      />
    );
  }
}

/**
 * Create a {@link FileEmbedNode} — from a bare file name (an upload), or from
 * fields plus the markdown they were parsed from.
 */
export function $createFileEmbedNode(
  fields: FileEmbedFields | string,
  source?: string,
): FileEmbedNode {
  return new FileEmbedNode(fields, source);
}

/** Type guard for {@link FileEmbedNode}. */
export function $isFileEmbedNode(
  node: LexicalNode | null | undefined,
): node is FileEmbedNode {
  return node instanceof FileEmbedNode;
}

/**
 * Headless extension that registers {@link FileEmbedNode} with the editor. The
 * node is rendered by its decorator and parsed/serialized by
 * {@link FILE_EMBED_MARKDOWN_TRANSFORMER} (a line of its own) and
 * {@link FILE_EMBED_INLINE_MARKDOWN_TRANSFORMER} (inside text); registration
 * contributes only the node class.
 */
export class FileEmbedExtension extends BaseExtension<"fileEmbed"> {
  constructor() {
    super("fileEmbed", [ExtensionCategory.Floating]);
  }

  register(): () => void {
    return () => {};
  }

  getNodes(): Array<typeof FileEmbedNode> {
    return [FileEmbedNode];
  }
}

export const fileEmbedExtension = new FileEmbedExtension();

/**
 * Lossless markdown transformer for a block {@link FileEmbedNode}: a line that is
 * exactly `![[…]]`, optionally followed by `<!-- key:value -->` directives.
 * Must run after the prefixed `![[card:…]]` / `![[youtube:…]]` /
 * `![[iframe:…]]` and `![[Note#^id]]` transformers.
 */
export const FILE_EMBED_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [FileEmbedNode],
  export: (node) => {
    if (!$isFileEmbedNode(node) || node.isInline()) {
      return null;
    }
    return node.getMarkdown();
  },
  regExp: /^!\[\[([^\]\r\n]+)\]\]((?:\s*<!--[\s\S]*?-->)*)\s*$/,
  replace: (parentNode: ElementNode, _children, match) => {
    const source = (match[0] ?? "").trim();
    const fields = parseFileEmbedMarkdown(source);
    if (!fields) {
      return false;
    }
    parentNode.replace($createFileEmbedNode(fields, source));
  },
  type: "element",
};

// A file target (`name.ext`, no `:` scheme), an optional `#fragment`, optional
// pipe segments (`|` or a table cell's `\|`).
const INLINE_EMBED =
  "!\\[\\[([^\\]\\r\\n|#:\\\\]+?\\.[A-Za-z0-9]{1,8}(?:#[^\\]\\r\\n|\\\\]*)?(?:\\\\?\\|[^\\]\\r\\n]*)?)\\]\\]";

/**
 * Lossless markdown transformer for an inline {@link FileEmbedNode}: a
 * `![[file.ext]]` in the middle of text. Only *file* targets (with an
 * extension) are claimed — a mid-paragraph `![[Note]]` stays text. Must come
 * before the wikilink transformer.
 */
export const FILE_EMBED_INLINE_MARKDOWN_TRANSFORMER: TextMatchTransformer = {
  dependencies: [FileEmbedNode],
  export: (node) => {
    if (!$isFileEmbedNode(node) || !node.isInline()) {
      return null;
    }
    return node.getMarkdown();
  },
  importRegExp: new RegExp(INLINE_EMBED),
  regExp: new RegExp(`${INLINE_EMBED}$`),
  replace: (textNode, match) => {
    const source = match[0] ?? "";
    const fields = parseFileEmbedMarkdown(source, true);
    if (!fields || !isFileTarget(fields.target)) {
      return;
    }
    textNode.replace($createFileEmbedNode(fields, source));
  },
  trigger: "]",
  type: "text-match",
};
