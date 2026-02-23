import { $getNearestNodeFromDOMNode, $setSelection, type LexicalEditor } from "lexical";
import { $isLinkNode } from "@lexical/link";

export function clearLexicalSelection(editor: LexicalEditor): void {
  editor.update(() => {
    $setSelection(null);
  });
}

export function resolveLinkNodeKeyFromAnchor(
  editor: LexicalEditor,
  anchorEl: HTMLAnchorElement,
): string | null {
  const attributeKey = anchorEl.getAttribute("data-lexical-node-key")?.trim();
  if (attributeKey) {
    return attributeKey;
  }

  let resolvedKey: string | null = null;
  editor.read(() => {
    const nearest = $getNearestNodeFromDOMNode(anchorEl);
    if ($isLinkNode(nearest)) {
      resolvedKey = nearest.getKey();
      return;
    }

    const firstChild = anchorEl.firstChild;
    if (!firstChild) {
      return;
    }

    const childNode = $getNearestNodeFromDOMNode(firstChild);
    if ($isLinkNode(childNode)) {
      resolvedKey = childNode.getKey();
      return;
    }

    const parent = childNode?.getParent();
    if (parent && $isLinkNode(parent)) {
      resolvedKey = parent.getKey();
    }
  });

  return resolvedKey;
}

