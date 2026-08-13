/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  $addUpdateTag,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  SELECTION_CHANGE_COMMAND,
  TextNode,
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
import { $collectAnchorableBlocks } from "./anchorableBlocks";

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
    return blockAnchorMarkdown(this);
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

/**
 * Serialize an anchor to its ` ^id` markdown form, with a trailing space when
 * content follows it and starts on a non-space character.
 *
 * An anchor is only ever meant to be a block's last child, and both
 * {@link $ensureBlockAnchors} and {@link registerBlockAnchorTrailingGuard} keep
 * it there. This is the last line of defence for the case where it somehow is
 * not: without the boundary, ` ^abc12345` immediately followed by typed text
 * serializes as `^abc12345text`, which silently *renames* the block — every
 * `![[Note#^abc12345]]` reference to it dangles, and the malformed id survives
 * the next import because the trailing-anchor pattern no longer matches. With
 * the boundary the same slip degrades to a stray, visible `^abc12345` token
 * that the block's real id has already outlived.
 */
function blockAnchorMarkdown(node: BlockAnchorNode): string {
  const next = node.getNextSibling();
  const needsBoundary = next !== null && /^\S/.test(next.getTextContent());
  return ` ^${node.getBlockId()}${needsBoundary ? " " : ""}`;
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
 * Move an anchor back to the end of its block when editing has stranded it
 * mid-block (typing lands after the invisible anchor whenever the caret sat at
 * the visual end of the line). Re-appending an existing node re-parents it, so
 * the id survives — which is the whole point: a stranded anchor serializes as
 * `^id` glued to whatever follows, renaming the block and dangling every
 * `![[Note#^id]]` reference to it. Returns whether the block changed.
 */
function $restoreTrailingAnchor(
  block: ElementNode,
  anchor: BlockAnchorNode,
): boolean {
  if (anchor.getParent() === block && anchor.getNextSibling() === null) {
    return false;
  }

  block.append(anchor);
  return true;
}

/**
 * Ensure every anchorable block carries a `^id` block anchor. Must be
 * called inside `editor.update()`. Blocks that already have an anchor keep
 * their id (stability across edits) and have it moved back to the end of the
 * block if an edit stranded it mid-block; duplicated ids — e.g. a pasted copy
 * of an anchored block — are re-stamped fresh so ids stay unique per document;
 * empty blocks are left alone. Returns whether anything changed.
 *
 * Anchors are appended as the block's last inline child, which serializes to
 * the trailing ` ^id` the {@link BLOCK_ANCHOR_MARKDOWN_TRANSFORMER} owns.
 *
 * Which blocks are eligible comes from {@link $collectAnchorableBlocks} — the
 * shared source of truth the typeahead triggers read too, so a mention can
 * never be typed somewhere its block cannot be addressed.
 */
export function $ensureBlockAnchors(
  createId: () => string = createBlockAnchorId,
): boolean {
  const seen = new Set<string>();
  let changed = false;

  for (const block of $collectAnchorableBlocks()) {
    const existing = $findBlockAnchor(block);
    if (existing) {
      const id = existing.getBlockId();
      if (seen.has(id)) {
        const fresh = createId();
        const replacement = $createBlockAnchorNode(fresh);
        existing.replace(replacement);
        $restoreTrailingAnchor(block, replacement);
        seen.add(fresh);
        changed = true;
      } else {
        seen.add(id);
        changed = $restoreTrailingAnchor(block, existing) || changed;
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

/**
 * Move a collapsed caret that sits immediately after a block anchor to just
 * before it. Must be called inside `editor.update()`. Returns whether the
 * selection moved.
 *
 * The anchor renders nothing, so a caret on its far side looks exactly like a
 * caret at the end of the line — clicking there, `Ctrl`/`Cmd`+`End`, or
 * collapsing a select-all to its end all land there. Typing from that position
 * inserts *after* the anchor, which is how a block's id ends up with the user's
 * text glued onto it. Snapping the caret back makes the position match what the
 * reader sees.
 */
function $normalizeCaretAroundAnchor(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return false;
  }

  const point = selection.anchor;
  const node = point.getNode();

  let anchorNode: BlockAnchorNode | null = null;
  if (point.type === "element" && $isElementNode(node)) {
    const previous = node.getChildAtIndex(point.offset - 1);
    if ($isBlockAnchorNode(previous)) {
      anchorNode = previous;
    }
  } else if (point.offset === 0) {
    const previous = node.getPreviousSibling();
    if ($isBlockAnchorNode(previous)) {
      anchorNode = previous;
    }
  }

  if (!anchorNode) {
    return false;
  }

  const previous = anchorNode.getPreviousSibling();
  if ($isTextNode(previous)) {
    const end = previous.getTextContentSize();
    previous.select(end, end);
    return true;
  }

  const parent = anchorNode.getParent();
  if (!parent) {
    return false;
  }

  const index = anchorNode.getIndexWithinParent();
  parent.select(index, index);
  return true;
}

/**
 * Keep block anchors where they belong: last in their block, with the caret
 * always on their content side. Two guards, both registered for every editor
 * that has the extension (they cost nothing when a document has no anchors):
 *
 * 1. A selection normalizer, so a caret placed after the invisible anchor snaps
 *    in front of it and typing continues the line instead of running past it.
 * 2. A text transform that re-appends an anchor a text insertion has stranded
 *    mid-block. Re-parenting preserves the node — and therefore the id — so the
 *    block keeps its identity and its `![[Note#^id]]` references stay live.
 *
 * Returns an unregister function.
 */
export function registerBlockAnchorTrailingGuard(
  editor: LexicalEditor,
): () => void {
  const unregisterSelection = editor.registerCommand(
    SELECTION_CHANGE_COMMAND,
    () => {
      $normalizeCaretAroundAnchor();
      // Never claim the event: this only nudges the caret, other listeners
      // still need to see the selection change.
      return false;
    },
    COMMAND_PRIORITY_LOW,
  );

  const unregisterTransform = editor.registerNodeTransform(
    TextNode,
    (textNode) => {
      const previous = textNode.getPreviousSibling();
      if (!$isBlockAnchorNode(previous)) {
        return;
      }

      const block = previous.getParent();
      if (block) {
        $restoreTrailingAnchor(block, previous);
      }
    },
  );

  return () => {
    unregisterSelection();
    unregisterTransform();
  };
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
    // The trailing guard runs in every mode, including the passive `off` one:
    // a document that merely *parsed* existing anchors can still strand one by
    // typing at the end of an anchored line, and that corrupts its id on the
    // next save.
    const unregisterGuard = registerBlockAnchorTrailingGuard(editor);

    if (!this.stampConfig.autoStamp) {
      return unregisterGuard;
    }

    const unregisterAutoStamp = registerBlockAnchorAutoStamp(
      editor,
      this.stampConfig.createId ?? createBlockAnchorId,
    );

    return () => {
      unregisterGuard();
      unregisterAutoStamp();
    };
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
    return blockAnchorMarkdown(node);
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
