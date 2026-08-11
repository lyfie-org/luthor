/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  $addUpdateTag,
  $getRoot,
  $isElementNode,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type ElementNode,
  type LexicalEditor,
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
 * specific paragraph for transclusion (`![[Note#^uuid]]`). The node is
 * **invisible in the rendered surface** — no `^uuid` artefact, no caret stop
 * (`isKeyboardSelectable` is off), nothing selectable as text — while the
 * companion {@link BLOCK_ANCHOR_MARKDOWN_TRANSFORMER} keeps its markdown
 * round-trip lossless. The id is still discoverable from the DOM through the
 * shell's `data-luthor-block-anchor` attribute.
 *
 * Block anchors are created through markdown import or programmatic stamping
 * ({@link $ensureBlockAnchors} / {@link registerBlockAnchorAutoStamp}), not
 * through live typing — the transformer's live trigger is intentionally
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
    span.setAttribute("data-luthor-block-anchor", this.__blockId);
    span.setAttribute("aria-hidden", "true");
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

  /**
   * Anchors are metadata, not content: arrow-key navigation walks straight
   * past them with no caret stop.
   */
  isKeyboardSelectable(): boolean {
    return false;
  }

  getTextContent(): string {
    return ` ^${this.__blockId}`;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  /**
   * Renders nothing. The anchor must be invisible in the visual surface; the
   * empty shell span (see {@link createDOM}) still carries the id as a
   * `data-luthor-block-anchor` attribute for DOM tooling.
   */
  decorate(): ReactNode {
    return null;
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
 * Generate a short, url- and markdown-safe anchor id (8 chars of `[a-z0-9]`,
 * matching the transformer's `^[a-zA-Z0-9][a-zA-Z0-9_-]*` shape). Duplicate
 * ids inside one document are resolved by the stamping pass itself.
 */
export function createBlockAnchorId(): string {
  let id = "";
  while (id.length < 8) {
    id += Math.random().toString(36).slice(2);
  }
  return id.slice(0, 8);
}

/** Update tag carried by stamping updates so listeners can recognise them. */
export const BLOCK_ANCHOR_STAMP_TAG = "luthor-block-anchor-stamp";

/**
 * Block types eligible for automatic anchoring. Lists, tables, and code
 * blocks are excluded: an inline anchor appended there either corrupts the
 * structure's markdown or lands inside literal code.
 */
const STAMPABLE_BLOCK_TYPES = new Set(["paragraph", "heading", "quote"]);

function $findBlockAnchor(block: ElementNode): BlockAnchorNode | null {
  const stack: LexicalNode[] = [...block.getChildren()];
  while (stack.length > 0) {
    const node = stack.pop();
    if ($isBlockAnchorNode(node)) {
      return node;
    }
    if ($isElementNode(node)) {
      stack.push(...node.getChildren());
    }
  }
  return null;
}

/**
 * Ensure every eligible top-level block carries a `^id` block anchor. Must be
 * called inside `editor.update()`. Blocks that already have an anchor keep
 * their id (stability across edits); duplicated ids — e.g. a pasted copy of an
 * anchored block — are re-stamped fresh so ids stay unique per document; empty
 * blocks are left alone. Returns whether anything changed.
 *
 * Anchors are appended as the block's last inline child, which serializes to
 * the trailing ` ^id` the {@link BLOCK_ANCHOR_MARKDOWN_TRANSFORMER} owns.
 */
export function $ensureBlockAnchors(
  createId: () => string = createBlockAnchorId,
): boolean {
  const seen = new Set<string>();
  let changed = false;

  for (const block of $getRoot().getChildren()) {
    if (!$isElementNode(block) || !STAMPABLE_BLOCK_TYPES.has(block.getType())) {
      continue;
    }

    const existing = $findBlockAnchor(block);
    if (existing) {
      const id = existing.getBlockId();
      if (seen.has(id)) {
        const fresh = createId();
        existing.replace($createBlockAnchorNode(fresh));
        seen.add(fresh);
        changed = true;
      } else {
        seen.add(id);
      }
      continue;
    }

    if (block.getTextContent().trim().length === 0) {
      continue;
    }

    const id = createId();
    block.append($createBlockAnchorNode(id));
    seen.add(id);
    changed = true;
  }

  return changed;
}

/**
 * One-shot imperative stamping: runs {@link $ensureBlockAnchors} in a
 * discrete update tagged {@link BLOCK_ANCHOR_STAMP_TAG} (merged into the last
 * history entry, so undo never peels anchors off one by one). Synchronous —
 * a serialization read immediately after returns the stamped document.
 */
export function ensureBlockAnchors(
  editor: LexicalEditor,
  createId: () => string = createBlockAnchorId,
): void {
  editor.update(
    () => {
      $addUpdateTag("history-merge");
      $ensureBlockAnchors(createId);
    },
    // Discrete: commit before returning (Lexical otherwise batches to the
    // next microtask), so a serialization read immediately after is stamped.
    { discrete: true, tag: BLOCK_ANCHOR_STAMP_TAG },
  );
}

/**
 * Continuous stamping for the `auto` block-anchor mode: after every content
 * commit that is not itself a stamping pass, append anchors to blocks that
 * lack one. Editing a block keeps its id; a block created by splitting gets a
 * fresh id on the half that lost the anchor node. Returns an unregister
 * function.
 */
export function registerBlockAnchorAutoStamp(
  editor: LexicalEditor,
  createId: () => string = createBlockAnchorId,
): () => void {
  return editor.registerUpdateListener(
    ({
      dirtyElements,
      dirtyLeaves,
      tags,
    }: {
      dirtyElements: Map<unknown, unknown>;
      dirtyLeaves: Set<unknown>;
      tags: Set<string>;
    }) => {
      if (tags.has(BLOCK_ANCHOR_STAMP_TAG)) {
        return;
      }
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
        return;
      }
      if (editor.isComposing()) {
        return;
      }

      ensureBlockAnchors(editor, createId);
    },
  );
}

/** Configuration for {@link BlockAnchorExtension}. */
export interface BlockAnchorExtensionConfig {
  /**
   * When `true`, every content commit auto-stamps anchor-less eligible blocks
   * (the papyra preset's `blockAnchors: "auto"`). Defaults to `false`: the
   * node and transformer register, but nothing ever creates an anchor unless
   * the host stamps imperatively.
   */
  autoStamp?: boolean;
  /** Custom anchor id factory. Defaults to {@link createBlockAnchorId}. */
  createId?: () => string;
}

/**
 * Headless extension that registers {@link BlockAnchorNode} with the editor,
 * and — when configured with `autoStamp` — the automatic stamping pass.
 */
export class BlockAnchorExtension extends BaseExtension<"blockAnchor"> {
  private stampConfig: BlockAnchorExtensionConfig;

  constructor(config: BlockAnchorExtensionConfig = {}) {
    super("blockAnchor", [ExtensionCategory.Floating]);
    this.stampConfig = config;
  }

  register(editor: LexicalEditor): () => void {
    if (!this.stampConfig.autoStamp) {
      return () => {};
    }

    return registerBlockAnchorAutoStamp(
      editor,
      this.stampConfig.createId ?? createBlockAnchorId,
    );
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
