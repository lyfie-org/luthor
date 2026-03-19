import { $getSelection, $isRangeSelection, type LexicalNode } from "lexical";

function hasCodeBlockAncestor(node: LexicalNode | null): boolean {
  let currentNode: LexicalNode | null = node;
  while (currentNode) {
    if (currentNode.getType() === "code") {
      return true;
    }
    currentNode = currentNode.getParent();
  }

  return false;
}

/**
 * Returns true when the current range selection is inside a code block.
 *
 * Inline code formatting should be blocked in this context to avoid
 * nested inline-code markers inside fenced code blocks.
 */
export function isSelectionInsideCodeBlock(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }

  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  return hasCodeBlockAncestor(anchorNode) || hasCodeBlockAncestor(focusNode);
}

