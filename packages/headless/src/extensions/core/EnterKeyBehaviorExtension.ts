import {
  $createParagraphNode,
  $getSelection,
  $isParagraphNode,
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

type EnterKeyBehaviorCommands = Record<string, never>;
type EnterKeyBehaviorStateQueries = Record<string, never>;

export class EnterKeyBehaviorExtension extends BaseExtension<
  "enterKeyBehavior",
  {},
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

        const currentParagraph = this.findParagraphNode(anchorNode);
        if (!currentParagraph || currentParagraph.getParent() !== quoteNode) {
          return;
        }

        const currentIsEmpty = currentParagraph.getTextContent().trim() === "";
        const previousSibling = currentParagraph.getPreviousSibling();
        const previousIsEmpty =
          $isParagraphNode(previousSibling) &&
          previousSibling.getTextContent().trim() === "";

        if (currentIsEmpty && previousIsEmpty) {
          const paragraphNode = $createParagraphNode();
          quoteNode.insertAfter(paragraphNode);
          paragraphNode.selectStart();
          handled = true;
          return;
        }

        const nextQuoteParagraph = $createParagraphNode();
        currentParagraph.insertAfter(nextQuoteParagraph);
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

  private findParagraphNode(node: any) {
    let current = node;
    while (current) {
      if ($isParagraphNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return null;
  }
}

export const enterKeyBehaviorExtension = new EnterKeyBehaviorExtension();
