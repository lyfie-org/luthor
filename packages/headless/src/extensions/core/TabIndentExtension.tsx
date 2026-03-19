import {
  COMMAND_PRIORITY_LOW,
  KEY_TAB_COMMAND,
  LexicalEditor,
  $isParagraphNode,
  $isRootOrShadowRoot,
  $getSelection,
  $isRangeSelection,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from "lexical";
import { $isCodeNode } from "@lexical/code";
import { $getListDepth, $isListItemNode, $isListNode } from "@lexical/list";
import { $isHeadingNode } from "@lexical/rich-text";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { ReactNode } from "react";

const MAX_BLOCK_INDENT_DEPTH = 8;
const MAX_LIST_INDENT_DEPTH = 9;
type TabContext = "list" | "heading" | "paragraph" | "other";
type TabIndentConfig = {
  maxListDepth?: number;
};

/**
 * TabIndentExtension - Adds universal Tab/Shift+Tab indentation support
 *
 * Enables Tab key to indent and Shift+Tab to outdent content throughout
 * the editor, not just in code blocks. This provides a consistent
 * indentation experience across all content types.
 *
 * @example
 * ```tsx
 * import { tabIndentExtension } from '@lyfie/luthor-headless';
 *
 * const extensions = [tabIndentExtension];
 * ```
 */
export class TabIndentExtension extends BaseExtension<
  "tabIndent",
  TabIndentConfig,
  Record<string, never>,
  Record<string, never>,
  ReactNode[]
> {
  constructor(config: TabIndentConfig = {}) {
    super("tabIndent", [ExtensionCategory.Toolbar]);
    this.config = config;
  }

  /**
   * Register the extension with Lexical
   * @param editor - Lexical editor instance
   * @returns Cleanup function
   */
  register(editor: LexicalEditor): () => void {
    const unregisterTabCommand = editor.registerCommand<KeyboardEvent>(
      KEY_TAB_COMMAND,
      (event) => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return false;
        }

        // Check if we're in a code block - let CodeExtension handle it
        const anchorNode = selection.anchor.getNode();
        if (this.isInCodeBlock(anchorNode)) {
          return false;
        }

        event.preventDefault();
        const context = this.resolveTabContext(anchorNode);

        if (context === "paragraph") {
          if (event.shiftKey) {
            return true;
          }
          editor.update(() => {
            const activeSelection = $getSelection();
            if ($isRangeSelection(activeSelection)) {
              if (this.hasReachedTextTabLimit(activeSelection)) {
                return;
              }
              activeSelection.insertText("\t");
            }
          });
          return true;
        }

        if (context === "list") {
          if (event.shiftKey) {
            editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
            return true;
          }
          if (!this.isListAtMaxDepth(anchorNode)) {
            editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          }
          return true;
        }

        if (context === "heading") {
          if (event.shiftKey) {
            editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
            return true;
          }
          if (!this.isBlockAtMaxIndent(anchorNode)) {
            editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          }
          return true;
        }

        // All other contexts intentionally swallow Tab as a no-op.
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterTabCommand();
    };
  }

  /**
   * Check if a node is within a code block
   * @param node - Node to check
   * @returns True if node is in a code block
   */
  private isInCodeBlock(node: any): boolean {
    let current = node;
    while (current) {
      if ($isCodeNode(current)) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }

  /**
   * Check whether current list depth reached the configured max depth.
   */
  private isListAtMaxDepth(node: any): boolean {
    const configuredMaxDepth = this.config.maxListDepth;
    const maxDepth = Number.isFinite(configuredMaxDepth)
      ? Math.max(1, Math.floor(configuredMaxDepth as number))
      : MAX_LIST_INDENT_DEPTH;
    const maxSubIndent = Math.max(0, maxDepth - 1);

    const listItemNode = this.findNearestListItemNode(node);
    if (listItemNode && typeof listItemNode.getIndent === "function") {
      const indent = listItemNode.getIndent();
      if (typeof indent === "number") {
        return indent >= maxSubIndent;
      }
    }

    const listNode = this.findNearestListNode(node);
    if (!listNode) {
      return false;
    }

    return $getListDepth(listNode) - 1 >= maxSubIndent;
  }

  /**
   * Check whether current block indent reached the configured max depth.
   */
  private isBlockAtMaxIndent(node: any): boolean {
    let current = node;
    while (current) {
      if ($isRootOrShadowRoot(current)) {
        return false;
      }
      if (typeof current.getIndent === "function") {
        const indent = current.getIndent();
        if (typeof indent === "number") {
          return indent >= MAX_BLOCK_INDENT_DEPTH;
        }
      }
      current = current.getParent();
    }
    return false;
  }

  private resolveTabContext(node: any): TabContext {
    let current = node;
    while (current) {
      if ($isListNode(current)) {
        return "list";
      }
      if ($isHeadingNode(current)) {
        return "heading";
      }
      if ($isParagraphNode(current)) {
        return "paragraph";
      }
      if ($isRootOrShadowRoot(current)) {
        break;
      }
      current = current.getParent();
    }
    return "other";
  }

  private findNearestListNode(node: any): any {
    let current = node;
    while (current) {
      if ($isListNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return null;
  }

  private findNearestListItemNode(node: any): any {
    let current = node;
    while (current) {
      if ($isListItemNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return null;
  }

  private hasReachedTextTabLimit(selection: any): boolean {
    const anchor = selection.anchor;
    const anchorNode = anchor.getNode();
    if (typeof anchorNode.getTextContent !== "function") {
      return false;
    }

    const content = anchorNode.getTextContent();
    const offset = typeof anchor.offset === "number" ? anchor.offset : content.length;
    const boundedOffset = Math.max(0, Math.min(content.length, offset));
    const lineStart = content.lastIndexOf("\n", boundedOffset - 1) + 1;
    const linePrefix = content.slice(lineStart, boundedOffset);
    const leadingTabs = linePrefix.match(/^\t*/)?.[0].length ?? 0;

    return leadingTabs >= MAX_BLOCK_INDENT_DEPTH;
  }
}

export const tabIndentExtension = new TabIndentExtension();
