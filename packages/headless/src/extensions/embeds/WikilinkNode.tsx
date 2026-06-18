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
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { TextMatchTransformer } from "@lexical/markdown";
import type { ReactNode } from "react";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { useEmbedResolvers } from "./EmbedResolverContext";

/**
 * Serialized shape of a {@link WikilinkNode}. Only the verbatim `target` and the
 * optional display `alias` are persisted — everything else (the resolved URL,
 * the rendered label) is derived at render time from the host resolvers, so the
 * stored data is exactly what the markdown source carries.
 */
export type SerializedWikilinkNode = Spread<
  {
    target: string;
    alias?: string;
  },
  SerializedLexicalNode
>;

/**
 * React view for a wikilink. Renders the alias (or the raw target) as a
 * clickable link that asks the host to navigate via {@link EmbedResolvers.openLink}.
 * With no host wired, it stays inert styled text — the reference is still
 * visible and the markdown still round-trips.
 */
function WikilinkComponent({
  target,
  alias,
}: {
  target: string;
  alias?: string;
}): ReactNode {
  const { openLink } = useEmbedResolvers();
  const label = alias && alias.length > 0 ? alias : target;
  const interactive = typeof openLink === "function";

  return (
    <a
      className="luthor-wikilink"
      data-luthor-wikilink-target={target}
      href={interactive ? "#" : undefined}
      role={interactive ? "link" : undefined}
      aria-disabled={interactive ? undefined : true}
      onClick={
        interactive
          ? (event) => {
              event.preventDefault();
              openLink(target);
            }
          : undefined
      }
    >
      {label}
    </a>
  );
}

/**
 * An inline `[[wikilink]]` to another note. The node stores the link target and
 * an optional alias verbatim; it is host-agnostic and reaches navigation through
 * the {@link EmbedResolvers} context. The companion
 * {@link WIKILINK_MARKDOWN_TRANSFORMER} gives it a lossless round-trip.
 */
export class WikilinkNode extends DecoratorNode<ReactNode> {
  /** The link target as written inside `[[target]]`. */
  __target: string;
  /** Optional display alias as written inside `[[target|alias]]`. */
  __alias?: string;

  static getType(): string {
    return "wikilink";
  }

  static clone(node: WikilinkNode): WikilinkNode {
    return new WikilinkNode(node.__target, node.__alias, node.__key);
  }

  static importJSON(serialized: SerializedWikilinkNode): WikilinkNode {
    return $createWikilinkNode(serialized.target, serialized.alias);
  }

  // Wikilinks are authored through markdown, not pasted HTML; the explicit
  // null import keeps Lexical from warning about the custom exportDOM.
  static importDOM(): DOMConversionMap | null {
    return null;
  }

  constructor(target: string, alias?: string, key?: NodeKey) {
    super(key);
    this.__target = target;
    this.__alias = alias && alias.length > 0 ? alias : undefined;
  }

  exportJSON(): SerializedWikilinkNode {
    return {
      type: "wikilink",
      version: 1,
      target: this.__target,
      ...(this.__alias ? { alias: this.__alias } : {}),
    };
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "luthor-wikilink-shell";
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const anchor = document.createElement("a");
    anchor.className = "luthor-wikilink";
    anchor.setAttribute("data-luthor-wikilink-target", this.__target);
    anchor.textContent = this.getTextContent();
    return { element: anchor };
  }

  isInline(): boolean {
    return true;
  }

  /** Plain-text fallback (the rendered label) for callers that read text. */
  getTextContent(): string {
    return this.__alias && this.__alias.length > 0 ? this.__alias : this.__target;
  }

  getTarget(): string {
    return this.__target;
  }

  getAlias(): string | undefined {
    return this.__alias;
  }

  decorate(): ReactNode {
    return <WikilinkComponent target={this.__target} alias={this.__alias} />;
  }
}

/** Create a {@link WikilinkNode}, normalizing an empty alias to none. */
export function $createWikilinkNode(target: string, alias?: string): WikilinkNode {
  return new WikilinkNode(target, alias);
}

/** Type guard for {@link WikilinkNode}. */
export function $isWikilinkNode(
  node: LexicalNode | null | undefined,
): node is WikilinkNode {
  return node instanceof WikilinkNode;
}

/**
 * Headless extension that registers {@link WikilinkNode} with the editor. The
 * node is rendered by its decorator and parsed/serialized by
 * {@link WIKILINK_MARKDOWN_TRANSFORMER}; no commands are required for the node to
 * round-trip, so registration is a no-op beyond contributing the node class.
 */
export class WikilinkExtension extends BaseExtension<"wikilink"> {
  constructor() {
    super("wikilink", [ExtensionCategory.Floating]);
  }

  register(): () => void {
    return () => {};
  }

  getNodes(): Array<typeof WikilinkNode> {
    return [WikilinkNode];
  }
}

export const wikilinkExtension = new WikilinkExtension();

// Matches `[[Target]]` or `[[Target|Alias]]`, but not a `![[...]]` media embed
// (the negative lookbehind keeps the file-embed transformer's syntax intact).
const WIKILINK_IMPORT_REG_EXP = /(?<!!)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/;
const WIKILINK_TRIGGER_REG_EXP = /(?<!!)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/;

/**
 * Lossless bidirectional markdown transformer for {@link WikilinkNode}.
 *
 * Import: `[[Target]]` / `[[Target|Alias]]` typed inline becomes a wikilink.
 * Export: a wikilink serializes back to the exact same syntax, so a body that
 * round-trips through the editor is byte-stable for these references.
 */
export const WIKILINK_MARKDOWN_TRANSFORMER: TextMatchTransformer = {
  dependencies: [WikilinkNode],
  export: (node) => {
    if (!$isWikilinkNode(node)) {
      return null;
    }

    const target = node.getTarget();
    const alias = node.getAlias();
    return alias ? `[[${target}|${alias}]]` : `[[${target}]]`;
  },
  importRegExp: WIKILINK_IMPORT_REG_EXP,
  regExp: WIKILINK_TRIGGER_REG_EXP,
  replace: (textNode, match) => {
    const target = (match[1] ?? "").trim();
    if (!target) {
      return;
    }

    const alias = match[2]?.trim();
    textNode.replace($createWikilinkNode(target, alias));
  },
  trigger: "]",
  type: "text-match",
};
