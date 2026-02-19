import {
  COMMAND_PRIORITY_LOW,
  KEY_TAB_COMMAND,
  LexicalEditor,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  $createCodeNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
  PrismTokenizer,
  registerCodeHighlighting,
} from "@lexical/code";
import { $createParagraphNode } from "lexical";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { ReactNode } from "react";

/**
 * Commands exposed by the CodeExtension for toggling code blocks
 */
export type CodeCommands = {
  /** Toggle code block vs paragraph for the current selection */
  toggleCodeBlock: () => void;
};

/**
 * State queries exposed by the CodeExtension for checking code block status
 */
export type CodeStateQueries = {
  /** Check whether the current selection is within a code block */
  isInCodeBlock: () => Promise<boolean>;
};

/**
 * CodeExtension - Adds code block support for the Lexical editor
 *
 * Enables users to create and manage code blocks in the editor.
 * Provides commands to toggle between code blocks and paragraphs,
 * plus state queries to check whether the selection is in a code block.
 *
 * Integrates with Lexical's CodeNode and provides a clean API
 * for toolbar integration and programmatic control.
 *
 * @example
 * ```tsx
 * import { codeExtension } from '@lyfie/luthor-headless/extensions/formatting/CodeExtension';
 *
 * const extensions = [codeExtension];
 * const editor = createEditorSystem(extensions);
 *
 * // Use in a component
 * const { commands } = useEditor();
 * commands.toggleCodeBlock(); // Toggle code block on or off
 * ```
 */
export class CodeExtension extends BaseExtension<
  "code",
  Record<string, never>,
  CodeCommands,
  CodeStateQueries,
  ReactNode[]
> {
  constructor() {
    super("code", [ExtensionCategory.Toolbar]);
  }

  /**
   * Register the extension with Lexical
   * @param editor - Lexical editor instance
   * @returns Cleanup function
   */
  register(editor: LexicalEditor): () => void {
    const unregisterCodeHighlighting = registerCodeHighlighting(editor, PrismTokenizer);

    const unregisterTabCommand = editor.registerCommand<KeyboardEvent>(
      KEY_TAB_COMMAND,
      (event) => {
        let handled = false;

        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          const anchorNode = selection.anchor.getNode();
          const block = this.getBlockNode(anchorNode);
          if (!block) {
            return;
          }

          handled = true;
          selection.insertText("\t");
        });

        if (handled) {
          event?.preventDefault();
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterCodeHighlighting();
      unregisterTabCommand();
    };
  }

  /**
   * Get Lexical nodes required by this extension
   * @returns Array of node classes
   */
  getNodes() {
    return [CodeNode, CodeHighlightNode];
  }

  /**
   * Get commands exposed by this extension
   * @param editor - Lexical editor instance
   * @returns Object containing available commands
   */
  getCommands(editor: LexicalEditor): CodeCommands {
    return {
      toggleCodeBlock: () => this.toggleCodeBlock(editor),
    };
  }

  /**
  * Toggle between code block and paragraph for the selection
   * @param editor - Lexical editor instance
   */
  private toggleCodeBlock(editor: LexicalEditor) {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Check if already in code block
        const currentFormat = this.getCurrentFormatSync();
        if (currentFormat === "code") {
          // Exit code block - convert to paragraph
          $setBlocksType(selection, () => $createParagraphNode());
          return;
        }

        // Enter code block
        $setBlocksType(selection, () => $createCodeNode());
      }
    });
  }

  /**
   * Get state queries exposed by this extension
   * @param editor - Lexical editor instance
   * @returns Object containing available state queries
   */
  getStateQueries(editor: LexicalEditor): CodeStateQueries {
    return {
      isInCodeBlock: () => Promise.resolve(this.isFormat("code", editor)),
    };
  }

  /**
   * Check whether the current selection matches the specified format
   * @param format - Format to check for (currently only 'code')
   * @param editor - Lexical editor instance
   * @returns True if all selected nodes match the format
   */
  private isFormat(format: "code", editor: LexicalEditor): boolean {
    let matches = true;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        matches = false;
        return;
      }
      const nodes = selection.getNodes();
      for (const node of nodes) {
        const block = this.getBlockNode(node);
        if (!block) {
          matches = false;
          break;
        }
        const blockFormat = this.getNodeFormat(block);
        if (blockFormat !== format) {
          matches = false;
          break;
        }
      }
    });
    return matches;
  }

  /**
   * Get the nearest block node from the given node
   * @param node - Starting node
   * @returns Nearest CodeNode or null
   */
  private getBlockNode(node: any): CodeNode | null {
    let current = node;
    while (current) {
      if ($isCodeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return null;
  }

  /**
   * Get the format type of a given node
   * @param node - Node to check
   * @returns Format type or null
   */
  private getNodeFormat(node: CodeNode): "code" | null {
    if ($isCodeNode(node)) return "code";
    return null;
  }

  /**
   * Get the current format synchronously (for use inside editor.update())
   * @returns Current format or null
   */
  private getCurrentFormatSync(): "code" | null {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return null;
    const anchorNode = selection.anchor.getNode();
    const block = this.getBlockNode(anchorNode);
    return block ? this.getNodeFormat(block) : null;
  }
}

export const codeExtension = new CodeExtension();

