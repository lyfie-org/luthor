import {
  COMMAND_PRIORITY_LOW,
  KEY_TAB_COMMAND,
  LexicalEditor,
  $getSelection,
  $isRangeSelection,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from "lexical";
import { $isCodeNode } from "@lexical/code";
import { $isListNode } from "@lexical/list";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { ReactNode } from "react";

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
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  ReactNode[]
> {
  constructor() {
    super("tabIndent", [ExtensionCategory.Toolbar]);
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

        // Checklist items are flat by design: block Tab indentation.
        if (!event.shiftKey && this.isInCheckList(anchorNode)) {
          event.preventDefault();
          return true;
        }

        event.preventDefault();

        // Shift+Tab = outdent, Tab = indent
        if (event.shiftKey) {
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        } else {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }

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
   * Check if a node is within a checklist list item.
   */
  private isInCheckList(node: any): boolean {
    let current = node;
    while (current) {
      if ($isListNode(current)) {
        return current.getListType() === "check";
      }
      current = current.getParent();
    }
    return false;
  }
}

export const tabIndentExtension = new TabIndentExtension();
