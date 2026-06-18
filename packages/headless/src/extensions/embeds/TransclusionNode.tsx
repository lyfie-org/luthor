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
import { useEmbedResolvers } from "./EmbedResolverContext";

/**
 * Serialized shape of a {@link TransclusionNode}. Stores the target note and the
 * block anchor id verbatim — resolution is deferred to render time via
 * {@link EmbedResolvers.resolveBlock}.
 */
export type SerializedTransclusionNode = Spread<
  {
    note: string;
    blockId: string;
  },
  SerializedLexicalNode
>;

/**
 * React view for a transclusion embed. Resolves the block content through the
 * host {@link EmbedResolvers.resolveBlock}; when no resolver is wired or the
 * block cannot be resolved (missing, or denied by the host's authorization) it
 * renders an unresolved chip, so the embed is always visible and the markdown
 * still round-trips.
 */
function TransclusionComponent({
  note,
  blockId,
}: {
  note: string;
  blockId: string;
}): ReactNode {
  const { resolveBlock } = useEmbedResolvers();
  const [content, setContent] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (typeof resolveBlock !== "function") {
      setContent(null);
      return;
    }

    let cancelled = false;
    resolveBlock(note, blockId).then(
      (result) => {
        if (!cancelled) setContent(result);
      },
      () => {
        if (!cancelled) setContent(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [resolveBlock, note, blockId]);

  const ref = `${note}#^${blockId}`;

  if (content === undefined) {
    return (
      <div
        className="luthor-transclusion luthor-transclusion--loading"
        data-luthor-transclusion-ref={ref}
        role="note"
        aria-busy="true"
        aria-label={`Loading transclusion: ${ref}`}
      >
        <span className="luthor-transclusion__ref">{ref}</span>
      </div>
    );
  }

  if (content !== null) {
    return (
      <blockquote
        className="luthor-transclusion luthor-transclusion--resolved"
        data-luthor-transclusion-ref={ref}
        aria-label={`Transclusion of ${ref}`}
      >
        <cite className="luthor-transclusion__ref">{ref}</cite>
        <div className="luthor-transclusion__content">{content}</div>
      </blockquote>
    );
  }

  return (
    <div
      className="luthor-transclusion luthor-transclusion--unresolved"
      data-luthor-transclusion-ref={ref}
      role="note"
      aria-label={`Unresolved transclusion: ${ref}`}
    >
      <span className="luthor-transclusion__chip">{ref}</span>
    </div>
  );
}

/**
 * A block-level `![[Note#^blockId]]` transclusion embed. The node stores the
 * target note and block anchor verbatim and resolves content through the
 * {@link EmbedResolvers} context, so it is host-agnostic. The companion
 * {@link TRANSCLUSION_MARKDOWN_TRANSFORMER} gives it a lossless round-trip.
 */
export class TransclusionNode extends DecoratorNode<ReactNode> {
  __note: string;
  __blockId: string;

  static getType(): string {
    return "transclusion";
  }

  static clone(node: TransclusionNode): TransclusionNode {
    return new TransclusionNode(node.__note, node.__blockId, node.__key);
  }

  static importJSON(serialized: SerializedTransclusionNode): TransclusionNode {
    return $createTransclusionNode(serialized.note, serialized.blockId);
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  constructor(note: string, blockId: string, key?: NodeKey) {
    super(key);
    this.__note = note;
    this.__blockId = blockId;
  }

  exportJSON(): SerializedTransclusionNode {
    return {
      type: "transclusion",
      version: 1,
      note: this.__note,
      blockId: this.__blockId,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "luthor-transclusion-shell";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement("div");
    div.className = "luthor-transclusion luthor-transclusion--chip";
    div.setAttribute(
      "data-luthor-transclusion-ref",
      `${this.__note}#^${this.__blockId}`,
    );
    div.textContent = `![[${this.__note}#^${this.__blockId}]]`;
    return { element: div };
  }

  isInline(): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getTextContent(): string {
    return `![[${this.__note}#^${this.__blockId}]]`;
  }

  getNote(): string {
    return this.__note;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  decorate(): ReactNode {
    return <TransclusionComponent note={this.__note} blockId={this.__blockId} />;
  }
}

/** Create a {@link TransclusionNode}. */
export function $createTransclusionNode(
  note: string,
  blockId: string,
): TransclusionNode {
  return new TransclusionNode(note, blockId);
}

/** Type guard for {@link TransclusionNode}. */
export function $isTransclusionNode(
  node: LexicalNode | null | undefined,
): node is TransclusionNode {
  return node instanceof TransclusionNode;
}

/**
 * Headless extension that registers {@link TransclusionNode} with the editor.
 * The node is rendered by its decorator and parsed/serialized by
 * {@link TRANSCLUSION_MARKDOWN_TRANSFORMER}; registration contributes only the
 * node class.
 */
export class TransclusionExtension extends BaseExtension<"transclusion"> {
  constructor() {
    super("transclusion", [ExtensionCategory.Floating]);
  }

  register(): () => void {
    return () => {};
  }

  getNodes(): Array<typeof TransclusionNode> {
    return [TransclusionNode];
  }
}

export const transclusionExtension = new TransclusionExtension();

/**
 * Lossless bidirectional markdown transformer for {@link TransclusionNode}.
 *
 * Import: a line that is exactly `![[Note#^blockId]]` becomes a transclusion.
 * Export: a transclusion serializes back to the same syntax.
 *
 * This transformer **must** be ordered ahead of
 * {@link FILE_EMBED_MARKDOWN_TRANSFORMER} so the more specific `#^` syntax is
 * matched before the general `![[…]]` file-embed pattern.
 */
export const TRANSCLUSION_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [TransclusionNode],
  export: (node) => {
    if (!$isTransclusionNode(node)) {
      return null;
    }
    return `![[${node.getNote()}#^${node.getBlockId()}]]`;
  },
  regExp: /^!\[\[([^\]#]+)#\^([^\]]+)\]\]\s*$/,
  replace: (parentNode: ElementNode, _children, match) => {
    const note = (match[1] ?? "").trim();
    const blockId = (match[2] ?? "").trim();
    if (!note || !blockId) {
      return;
    }
    parentNode.replace($createTransclusionNode(note, blockId));
  },
  type: "element",
};
