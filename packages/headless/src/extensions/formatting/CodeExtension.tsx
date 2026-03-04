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
  registerCodeHighlighting,
} from "@lexical/code";
import { $createParagraphNode } from "lexical";
import { BaseExtension } from "@lyfie/luthor-headless/extensions/base";
import { BaseExtensionConfig } from "@lyfie/luthor-headless/extensions/types";
import { ExtensionCategory } from "@lyfie/luthor-headless/extensions/types";
import { ReactNode } from "react";
import {
  type CodeTokenizer,
  type CodeHighlightProvider,
  type CodeHighlightProviderConfig,
  getDefaultCodeTokenizer,
  getFallbackCodeTheme,
  resolveCodeHighlightProvider,
  resolveCodeTokenizer,
} from "./codeHighlightProvider";

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

export type CodeExtensionConfig = BaseExtensionConfig &
  CodeHighlightProviderConfig & {
    syntaxHighlighting?: "auto" | "disabled";
    tokenizer?: CodeTokenizer | null;
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
  CodeExtensionConfig,
  CodeCommands,
  CodeStateQueries,
  ReactNode[]
> {
  private static readonly MAX_CODE_TAB_DEPTH = 8;

  private codeHighlightProviderPromise: Promise<CodeHighlightProvider | null> | null = null;

  constructor() {
    super("code", [ExtensionCategory.Toolbar]);
    this.config = {
      syntaxHighlighting: "auto",
    };
  }

  /**
   * Register the extension with Lexical
   * @param editor - Lexical editor instance
   * @returns Cleanup function
   */
  register(editor: LexicalEditor): () => void {
    let unregisterCodeHighlighting = () => {};
    let didDispose = false;

    const applyHighlighting = (tokenizer: CodeTokenizer) => {
      unregisterCodeHighlighting();
      unregisterCodeHighlighting = registerCodeHighlighting(
        editor,
        tokenizer as Parameters<typeof registerCodeHighlighting>[1],
      );
    };

    if (this.config.syntaxHighlighting !== "disabled") {
      applyHighlighting(this.config.tokenizer ?? getDefaultCodeTokenizer());

      void this.resolveConfiguredTokenizer().then((tokenizer) => {
        if (didDispose || !tokenizer) {
          return;
        }
        applyHighlighting(tokenizer);
      });
    }

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
          if (this.hasReachedCodeTabLimit(selection)) {
            return;
          }
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
      didDispose = true;
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
        $setBlocksType(selection, () => {
          const node = $createCodeNode();
          (
            node as unknown as {
              setTheme?: (theme: string) => void;
            }
          ).setTheme?.(getFallbackCodeTheme());
          return node;
        });
      }
    });
  }

  private async resolveConfiguredTokenizer(): Promise<CodeTokenizer | null> {
    if (this.config.tokenizer) {
      return this.config.tokenizer;
    }

    const provider = await this.loadCodeHighlightProvider();
    return resolveCodeTokenizer(provider);
  }

  private async loadCodeHighlightProvider(): Promise<CodeHighlightProvider | null> {
    if (this.config.provider) {
      return this.config.provider;
    }

    if (this.codeHighlightProviderPromise) {
      return this.codeHighlightProviderPromise;
    }

    this.codeHighlightProviderPromise = resolveCodeHighlightProvider(this.config);
    return this.codeHighlightProviderPromise;
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

  private hasReachedCodeTabLimit(selection: any): boolean {
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

    return leadingTabs >= CodeExtension.MAX_CODE_TAB_DEPTH;
  }
}

export const codeExtension = new CodeExtension();

