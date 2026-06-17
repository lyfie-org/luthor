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
import type { ElementTransformer } from "@lexical/markdown";
import { type ReactNode, useEffect, useState } from "react";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { type SavedCardMetadata, useEmbedResolvers } from "./EmbedResolverContext";

/**
 * Serialized shape of a {@link SavedCardNode}. Only the verbatim `url` and the
 * optional author-supplied `title` are persisted; the archived metadata (image,
 * description, favicon, …) is resolved at render time, so the stored data
 * mirrors the markdown and the round-trip stays lossless.
 */
export type SerializedSavedCardNode = Spread<
  {
    url: string;
    title?: string;
  },
  SerializedLexicalNode
>;

/**
 * React view for a saved web card. Resolves the URL to archived open-graph
 * metadata through the host {@link EmbedResolvers.resolveCard}; while it loads,
 * and when no resolver is wired or the host has no record, it renders a bare
 * link card showing the author title (or the URL). The card is always an anchor
 * to the original URL, so it is useful even without a host, and the markdown
 * round-trips regardless.
 */
function SavedCardComponent({
  url,
  title,
}: {
  url: string;
  title?: string;
}): ReactNode {
  const { resolveCard } = useEmbedResolvers();
  const [meta, setMeta] = useState<SavedCardMetadata | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (typeof resolveCard !== "function") {
      setMeta(null);
      return;
    }

    let cancelled = false;
    resolveCard(url).then(
      (result) => {
        if (!cancelled) setMeta(result);
      },
      () => {
        if (!cancelled) setMeta(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [resolveCard, url]);

  const heading = meta?.title ?? title ?? url;
  const source = meta?.siteName ?? url;
  const loading = meta === undefined;

  return (
    <a
      className={
        loading
          ? "luthor-saved-card luthor-saved-card--loading"
          : "luthor-saved-card"
      }
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-luthor-saved-card-url={url}
    >
      {meta?.image ? (
        <img
          className="luthor-saved-card__image"
          src={meta.image}
          alt=""
          aria-hidden="true"
        />
      ) : null}
      <span className="luthor-saved-card__body">
        <span className="luthor-saved-card__title">{heading}</span>
        {meta?.description ? (
          <span className="luthor-saved-card__description">
            {meta.description}
          </span>
        ) : null}
        <span className="luthor-saved-card__source">
          {meta?.favicon ? (
            <img
              className="luthor-saved-card__favicon"
              src={meta.favicon}
              alt=""
              aria-hidden="true"
            />
          ) : null}
          <span className="luthor-saved-card__source-text">{source}</span>
        </span>
      </span>
    </a>
  );
}

/**
 * A block-level `![[card:url]]` saved web card. The node stores the URL (and an
 * optional author title) verbatim and resolves archived metadata through the
 * {@link EmbedResolvers} context, so it is host-agnostic. The companion
 * {@link SAVED_CARD_MARKDOWN_TRANSFORMER} gives it a lossless round-trip.
 */
export class SavedCardNode extends DecoratorNode<ReactNode> {
  /** The card's target URL, as written inside `![[card:url]]`. */
  __url: string;
  /** The optional author title, as written after `|`. */
  __title?: string;

  static getType(): string {
    return "savedCard";
  }

  static clone(node: SavedCardNode): SavedCardNode {
    return new SavedCardNode(node.__url, node.__title, node.__key);
  }

  static importJSON(serialized: SerializedSavedCardNode): SavedCardNode {
    return $createSavedCardNode(serialized.url, serialized.title);
  }

  // Saved cards are authored through markdown, not pasted HTML; the explicit
  // null import keeps Lexical from warning about the custom exportDOM.
  static importDOM(): DOMConversionMap | null {
    return null;
  }

  constructor(url: string, title?: string, key?: NodeKey) {
    super(key);
    this.__url = url;
    this.__title = title;
  }

  exportJSON(): SerializedSavedCardNode {
    const json: SerializedSavedCardNode = {
      type: "savedCard",
      version: 1,
      url: this.__url,
    };
    if (this.__title !== undefined) {
      json.title = this.__title;
    }
    return json;
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "luthor-saved-card-shell";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const anchor = document.createElement("a");
    anchor.className = "luthor-saved-card";
    anchor.href = this.__url;
    anchor.setAttribute("data-luthor-saved-card-url", this.__url);
    anchor.textContent = this.__title ?? this.__url;
    return { element: anchor };
  }

  isInline(): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getTextContent(): string {
    return this.getMarkdown();
  }

  getUrl(): string {
    return this.__url;
  }

  getTitle(): string | undefined {
    return this.__title;
  }

  /** The verbatim markdown this node serializes to. */
  getMarkdown(): string {
    return this.__title
      ? `![[card:${this.__url}|${this.__title}]]`
      : `![[card:${this.__url}]]`;
  }

  decorate(): ReactNode {
    return <SavedCardComponent url={this.__url} title={this.__title} />;
  }
}

/** Create a {@link SavedCardNode}. */
export function $createSavedCardNode(
  url: string,
  title?: string,
): SavedCardNode {
  return new SavedCardNode(url, title);
}

/** Type guard for {@link SavedCardNode}. */
export function $isSavedCardNode(
  node: LexicalNode | null | undefined,
): node is SavedCardNode {
  return node instanceof SavedCardNode;
}

/**
 * Headless extension that registers {@link SavedCardNode} with the editor. The
 * node is rendered by its decorator and parsed/serialized by
 * {@link SAVED_CARD_MARKDOWN_TRANSFORMER}; registration contributes only the
 * node class.
 */
export class SavedCardExtension extends BaseExtension<"savedCard"> {
  constructor() {
    super("savedCard", [ExtensionCategory.Floating]);
  }

  register(): () => void {
    return () => {};
  }

  getNodes(): Array<typeof SavedCardNode> {
    return [SavedCardNode];
  }
}

export const savedCardExtension = new SavedCardExtension();

/**
 * Lossless bidirectional markdown transformer for {@link SavedCardNode}.
 *
 * Import: a line that is exactly `![[card:url]]` (optionally `![[card:url|title]]`)
 * becomes a saved card. Export: a saved card serializes back to the same syntax.
 *
 * This transformer **must** be ordered ahead of `FILE_EMBED_MARKDOWN_TRANSFORMER`
 * so the more specific `card:` prefix is matched before the general `![[…]]`
 * file-embed pattern (whose `[^\]]+` target would otherwise swallow it).
 */
export const SAVED_CARD_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [SavedCardNode],
  export: (node) => {
    if (!$isSavedCardNode(node)) {
      return null;
    }
    return node.getMarkdown();
  },
  regExp: /^!\[\[card:([^\]|]+)(?:\|([^\]]+))?\]\]\s*$/,
  replace: (parentNode: ElementNode, _children, match) => {
    const url = (match[1] ?? "").trim();
    if (!url) {
      return;
    }
    const rawTitle = match[2];
    const title =
      rawTitle !== undefined && rawTitle.trim() !== ""
        ? rawTitle.trim()
        : undefined;
    parentNode.replace($createSavedCardNode(url, title));
  },
  type: "element",
};
