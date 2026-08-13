/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * The single source of truth for *which blocks can carry a `^id` anchor* — and
 * therefore for where the trigger-driven typeaheads (`@` mentions, `[[` note
 * links) are allowed to open.
 *
 * The invariant: **wherever a mention may be typed must be a block that can
 * carry an anchor.** A host resolves a mention to the anchor of the block it
 * sits in, so a mention written into an un-anchorable block cannot be
 * delivered — the UI would invite an action that silently does nothing. The
 * two typeahead extensions and the block-anchor stamping pass all read this
 * module instead of keeping their own literal, which is how the sets used to
 * drift apart.
 *
 * The types below are *top-level* block types, matching what
 * `getTopLevelElementOrThrow().getType()` returns: a list item reports `list`.
 * Stamping needs the finer-grained target (the individual list item), which is
 * what {@link $collectAnchorableBlocks} resolves.
 */

import {
  $getRoot,
  $isElementNode,
  type ElementNode,
  type LexicalNode,
} from "lexical";

/** Lexical type of a list container. */
const LIST_TYPE = "list";

/**
 * Top-level block types that can carry a trailing `^id` block anchor.
 *
 * Tables and code blocks are absent on purpose: an inline anchor appended
 * there either corrupts the structure's markdown or lands inside literal code.
 * Lists are included — `- item ^abc12345` and `- [ ] task ^abc12345` are valid
 * markdown and round-trip verbatim through the bridge, so a mention typed in a
 * list item is deliverable.
 */
export const ANCHORABLE_BLOCK_TYPES: ReadonlySet<string> = new Set([
  "paragraph",
  "heading",
  "quote",
  LIST_TYPE,
]);

/**
 * Whether a top-level block type can carry a block anchor. Pass the type
 * reported by `getTopLevelElementOrThrow()`; anything inside a list reports
 * `list`, which is what the typeaheads check.
 */
export function isAnchorableBlockType(type: string): boolean {
  return ANCHORABLE_BLOCK_TYPES.has(type);
}

/**
 * Every element in the document that can hold a block-anchor node, in document
 * order. Must be called inside a Lexical read/update.
 *
 * Paragraphs, headings, and quotes are their own anchor target. A list is not —
 * the anchor belongs to the individual list item, so lists are walked and each
 * leaf item is returned instead. An item that only wraps a nested list (the
 * shape Lexical uses for indentation) is walked through rather than stamped,
 * because its text content belongs to the nested items.
 */
export function $collectAnchorableBlocks(): ElementNode[] {
  const blocks: ElementNode[] = [];
  for (const child of $getRoot().getChildren()) {
    collectBlock(child, blocks);
  }
  return blocks;
}

function collectBlock(node: LexicalNode, blocks: ElementNode[]): void {
  if (!$isElementNode(node)) {
    return;
  }

  if (node.getType() === LIST_TYPE) {
    for (const item of node.getChildren()) {
      collectListItem(item, blocks);
    }
    return;
  }

  if (ANCHORABLE_BLOCK_TYPES.has(node.getType())) {
    blocks.push(node);
  }
}

function collectListItem(item: LexicalNode, blocks: ElementNode[]): void {
  if (!$isElementNode(item)) {
    return;
  }

  const nestedList = item
    .getChildren()
    .find((child) => $isElementNode(child) && child.getType() === LIST_TYPE);

  if ($isElementNode(nestedList)) {
    for (const nestedItem of nestedList.getChildren()) {
      collectListItem(nestedItem, blocks);
    }
    return;
  }

  blocks.push(item);
}
