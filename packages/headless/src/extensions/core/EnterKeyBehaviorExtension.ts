import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  LexicalEditor,
} from "lexical";
import { $isCodeNode } from "@lexical/code";
import {
  $findCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $isTableCellNode,
} from "@lexical/table";
import { $isQuoteNode } from "@lexical/rich-text";
import { BaseExtension } from "../base/BaseExtension";
import { ExtensionCategory } from "../types";
import type { BaseExtensionConfig } from "../types";

type EnterKeyBehaviorCommands = Record<string, never>;
type EnterKeyBehaviorStateQueries = Record<string, never>;

export class EnterKeyBehaviorExtension extends BaseExtension<
  "enterKeyBehavior",
  BaseExtensionConfig,
  EnterKeyBehaviorCommands,
  EnterKeyBehaviorStateQueries
> {
  constructor() {
    super("enterKeyBehavior", [ExtensionCategory.Floating]);
    this.config = {
      ...(this.config || {}),
      showInToolbar: false,
      initPriority: 100,
    };
  }

  register(editor: LexicalEditor): () => void {
    let cleanupRootListener: (() => void) | undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter") {
        return;
      }

      let handled = false;

      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }

        const anchorNode = selection.anchor.getNode();

        if (event.shiftKey) {
          const tableCellNode = $findCellNode(anchorNode);
          if ($isTableCellNode(tableCellNode)) {
            const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
            const paragraphNode = $createParagraphNode();
            tableNode.insertAfter(paragraphNode);
            paragraphNode.selectStart();
            handled = true;
            return;
          }

          const quoteNode = this.findQuoteNode(anchorNode);
          if (quoteNode) {
            const paragraphNode = $createParagraphNode();
            quoteNode.insertAfter(paragraphNode);
            paragraphNode.selectStart();
            handled = true;
            return;
          }

          const codeNode = this.findCodeNode(anchorNode);
          if (codeNode) {
            const paragraphNode = $createParagraphNode();
            codeNode.insertAfter(paragraphNode);
            paragraphNode.selectStart();
            handled = true;
            return;
          }

          return;
        }

        const quoteNode = this.findQuoteNode(anchorNode);
        if (!quoteNode || !selection.isCollapsed()) {
          return;
        }

        const currentQuoteLine =
          this.findDirectQuoteChild(anchorNode, quoteNode) ||
          quoteNode.getLastChild();

        if (!currentQuoteLine) {
          const nextQuoteParagraph = $createParagraphNode();
          quoteNode.append(nextQuoteParagraph);
          nextQuoteParagraph.selectStart();
          handled = true;
          return;
        }

        const currentIsEmpty = this.isEmptyQuoteLine(currentQuoteLine);
        const previousSibling = currentQuoteLine.getPreviousSibling();
        const previousIsEmpty = this.isEmptyQuoteLine(previousSibling);

        if (currentIsEmpty && previousIsEmpty) {
          const trailingEmptyLine = currentQuoteLine;
          const precedingEmptyLine = previousSibling;

          trailingEmptyLine.remove();
          precedingEmptyLine?.remove();

          const paragraphNode = $createParagraphNode();
          quoteNode.insertAfter(paragraphNode);
          paragraphNode.selectStart();
          handled = true;
          return;
        }

        const nextQuoteParagraph = $createParagraphNode();
        currentQuoteLine.insertAfter(nextQuoteParagraph);
        nextQuoteParagraph.selectStart();
        handled = true;
      });

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const unregisterRootListener = editor.registerRootListener(
      (rootElement, prevRootElement) => {
        cleanupRootListener?.();
        cleanupRootListener = undefined;

        if (prevRootElement) {
          prevRootElement.removeEventListener("keydown", handleKeyDown, true);
        }

        if (rootElement) {
          rootElement.addEventListener("keydown", handleKeyDown, true);
          cleanupRootListener = () => {
            rootElement.removeEventListener("keydown", handleKeyDown, true);
          };
        }
      },
    );

    return () => {
      cleanupRootListener?.();
      unregisterRootListener();
    };
  }

  private findQuoteNode(node: any) {
    let current = node;
    while (current) {
      if ($isQuoteNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return null;
  }

  private findCodeNode(node: any) {
    let current = node;
    while (current) {
      if ($isCodeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return null;
  }

  private findDirectQuoteChild(node: any, quoteNode: any) {
    let current = node;
    while (current && current.getParent && current.getParent() !== quoteNode) {
      current = current.getParent();
    }

    if (current?.getParent && current.getParent() === quoteNode) {
      return current;
    }

    return null;
  }

  private isEmptyQuoteLine(node: any): boolean {
    if (!node) {
      return false;
    }
    return node.getTextContent().trim() === "";
  }
}

export const enterKeyBehaviorExtension = new EnterKeyBehaviorExtension();
