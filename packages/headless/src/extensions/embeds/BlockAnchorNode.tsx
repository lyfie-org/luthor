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

/**
 * Serialized shape of a {@link BlockAnchorNode}. Only the `blockId` (the part
 * after `^`) is persisted; the leading space and caret are formatting added by
 * the transformer on export.
 */
export type SerializedBlockAnchorNode = Spread<
  {
    blockId: string;
  },
  SerializedLexicalNode
>;

/**
 * An inline trailing `^uuid` block anchor. Block anchors let Papyra address a
 * specific paragraph for transclusion (`![[Note#^uuid]]`). The node renders a
 * subtle, non-interactive badge so anchors are visible to the author without
 * disrupting the reading flow. The companion
 * {@link BLOCK_ANCHOR_MARKDOWN_TRANSFORMER} gives it a lossless round-trip.
 *
 * Block anchors are created through markdown import or programmatic insertion,
 * not through live typing — the transformer's live trigger is intentionally
 * disabled.
 */
export class BlockAnchorNode extends DecoratorNode<ReactNode> {
  __blockId: string;

  static getType(): string {
    return "blockAnchor";
  }

  static clone(node: BlockAnchorNode): BlockAnchorNode {
    return new BlockAnchorNode(node.__blockId, node.__key);
  }

  static importJSON(serialized: SerializedBlockAnchorNode): BlockAnchorNode {
    return $createBlockAnchorNode(serialized.blockId);
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  constructor(blockId: string, key?: NodeKey) {
    super(key);
    this.__blockId = blockId;
  }

  exportJSON(): SerializedBlockAnchorNode {
    return {
      type: "blockAnchor",
      version: 1,
      blockId: this.__blockId,
    };
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "luthor-block-anchor-shell";
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement("span");
    span.className = "luthor-block-anchor";
    span.setAttribute("data-luthor-block-anchor", this.__blockId);
    span.textContent = `^${this.__blockId}`;
    return { element: span };
  }

  isInline(): boolean {
    return true;
  }

  getTextContent(): string {
    return ` ^${this.__blockId}`;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  decorate(): ReactNode {
    return (
      <span
        className="luthor-block-anchor"
        data-luthor-block-anchor={this.__blockId}
        aria-hidden="true"
      >
        ^{this.__blockId}
      </span>
    );
  }
}

/** Create a {@link BlockAnchorNode}. */
export function $createBlockAnchorNode(blockId: string): BlockAnchorNode {
  return new BlockAnchorNode(blockId);
}

/** Type guard for {@link BlockAnchorNode}. */
export function $isBlockAnchorNode(
  node: LexicalNode | null | undefined,
): node is BlockAnchorNode {
  return node instanceof BlockAnchorNode;
}

/**
 * Headless extension that registers {@link BlockAnchorNode} with the editor.
 * Registration contributes only the node class; block anchors have no editor
 * commands.
 */
export class BlockAnchorExtension extends BaseExtension<"blockAnchor"> {
  constructor() {
    super("blockAnchor", [ExtensionCategory.Floating]);
  }

  register(): () => void {
    return () => {};
  }

  getNodes(): Array<typeof BlockAnchorNode> {
    return [BlockAnchorNode];
  }
}

export const blockAnchorExtension = new BlockAnchorExtension();

/**
 * Lossless bidirectional markdown transformer for {@link BlockAnchorNode}.
 *
 * Import: a trailing ` ^id` inside a paragraph becomes a block anchor node.
 * Export: a block anchor serializes back to ` ^id`.
 *
 * The live trigger is set to a non-printable character so the transformer never
 * fires from user typing — block anchors are generated programmatically or
 * parsed from existing markdown, not authored inline.
 */
export const BLOCK_ANCHOR_MARKDOWN_TRANSFORMER: TextMatchTransformer = {
  dependencies: [BlockAnchorNode],
  export: (node) => {
    if (!$isBlockAnchorNode(node)) {
      return null;
    }
    return ` ^${node.getBlockId()}`;
  },
  importRegExp: / \^([a-zA-Z0-9][a-zA-Z0-9_-]*)$/,
  // Live trigger disabled: non-printable sentinel + impossible regex.
  // eslint-disable-next-line no-control-regex
  regExp: /\x00\x01$/,
  replace: (textNode, match) => {
    const blockId = (match[1] ?? "").trim();
    if (!blockId) {
      return;
    }
    textNode.replace($createBlockAnchorNode(blockId));
  },
  trigger: "\x00",
  type: "text-match",
};
