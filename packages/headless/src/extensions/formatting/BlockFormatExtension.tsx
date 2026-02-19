import {
  LexicalEditor,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  COMMAND_PRIORITY_EDITOR,
  KEY_ENTER_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  type ElementFormatType,
} from "lexical";
import { $setBlocksType } from "@lexical/selection"; // Key import!
import { $createParagraphNode, $isParagraphNode, ParagraphNode } from "lexical";
import {
  $createHeadingNode,
  $isHeadingNode,
  HeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import { $createQuoteNode, $isQuoteNode, QuoteNode } from "@lexical/rich-text";
import { BaseExtension } from "../base/BaseExtension";
import { ExtensionCategory } from "../types";

/**
 * Supported block formats for BlockFormatExtension
 */
export type BlockFormat = "p" | HeadingTagType | "quote";

/**
 * Commands exposed by BlockFormatExtension for block-level formatting
 */
export type BlockFormatCommands = {
  /** Switch to a specific block format */
  toggleBlockFormat: (format: BlockFormat) => void;
  /** Switch to paragraph format */
  toggleParagraph: () => void;
  /** Switch to a heading format */
  toggleHeading: (tag: HeadingTagType) => void;
  /** Switch to quote format */
  toggleQuote: () => void;
  /** Set text alignment for selected blocks */
  setTextAlignment: (alignment: "left" | "center" | "right" | "justify") => void;
  /** Return the current block type as a string ('p', 'h1', 'h2', etc.) */
  getCurrentBlockType: () => BlockFormat;
};

/**
 * State queries exposed by BlockFormatExtension for checking block formats
 */
export type BlockFormatStateQueries = {
  /** Check whether the selection is in a paragraph */
  isParagraph: () => Promise<boolean>;
  /** Check whether the selection is in an H1 heading */
  isH1: () => Promise<boolean>;
  /** Check whether the selection is in an H2 heading */
  isH2: () => Promise<boolean>;
  /** Check whether the selection is in an H3 heading */
  isH3: () => Promise<boolean>;
  /** Check whether the selection is in an H4 heading */
  isH4: () => Promise<boolean>;
  /** Check whether the selection is in an H5 heading */
  isH5: () => Promise<boolean>;
  /** Check whether the selection is in an H6 heading */
  isH6: () => Promise<boolean>;
  /** Check whether the selection is in a quote block */
  isQuote: () => Promise<boolean>;
  /** Check whether selected blocks are left-aligned */
  isTextAlignedLeft: () => Promise<boolean>;
  /** Check whether selected blocks are center-aligned */
  isTextAlignedCenter: () => Promise<boolean>;
  /** Check whether selected blocks are right-aligned */
  isTextAlignedRight: () => Promise<boolean>;
  /** Check whether selected blocks are justified */
  isTextAlignedJustify: () => Promise<boolean>;
};

/**
 * BlockFormatExtension - Provides block-level formatting
 *
 * Enables users to change block-level elements like paragraphs,
 * headings (H1-H6), and quotes. Provides a comprehensive set of commands
 * for switching between formats and state queries for checking
 * the current block format.
 *
 * The extension supports true toggling - applying the same format
 * again reverts to a paragraph.
 *
 * @example
 * ```tsx
 * import { blockFormatExtension } from '@lyfie/luthor-headless/extensions/formatting/BlockTypeExtension';
 *
 * const extensions = [blockFormatExtension];
 * const editor = createEditorSystem(extensions);
 *
 * // Use in a component
 * const { commands } = useEditor();
 * commands.toggleHeading('h1'); // Switch selection to H1
 * commands.toggleQuote(); // Convert selection to a quote block
 * ```
 */
export class BlockFormatExtension extends BaseExtension<
  "blockFormat",
  Record<string, never>,
  BlockFormatCommands,
  BlockFormatStateQueries
> {
  constructor() {
    super("blockFormat", [ExtensionCategory.Toolbar]);
  }

  /**
   * Register the extension with Lexical
   * @param editor - Lexical editor instance
   * @returns Cleanup function
   */
  register(editor: LexicalEditor): () => void {
    // Register INSERT_PARAGRAPH_COMMAND to handle transitions from headings/quotes
    const unregisterParagraph = editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const blockNode = this.getBlockNode(anchorNode);

          // If we're in a heading or quote, ensure we create a proper paragraph
          if (
            blockNode &&
            ($isHeadingNode(blockNode) || $isQuoteNode(blockNode))
          ) {
            // Let the default INSERT_PARAGRAPH_COMMAND run, but ensure proper state
            return false; // Allow default behavior but we'll modify the result
          }
        }

        return false; // Allow default behavior for other cases
      },
      COMMAND_PRIORITY_NORMAL,
    );

    // Also register KEY_ENTER_COMMAND with higher priority to prevent conflicts
    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        let handled = false;

        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          const anchorNode = selection.anchor.getNode();
          const blockNode = this.getBlockNode(anchorNode);

          if (!blockNode) {
            return;
          }

          // Heading behavior remains unchanged
          if ($isHeadingNode(blockNode) && !event?.shiftKey) {
            this.toggleBlockFormat(editor, "p");
            handled = true;
          }
        });

        if (handled) {
          event?.preventDefault();
        }

        return handled;
      },
      COMMAND_PRIORITY_EDITOR, // Highest priority to override other handlers
    );

    return () => {
      unregisterParagraph();
      unregisterEnter();
    };
  }

  /**
   * Get Lexical nodes required by this extension
   * @returns Array of node classes
   */
  getNodes() {
    return [ParagraphNode, HeadingNode, QuoteNode]; // Include ParagraphNode if overriding
  }

  /**
   * Get commands exposed by this extension
   * @param editor - Lexical editor instance
   * @returns Object containing available commands
   */
  getCommands(editor: LexicalEditor): BlockFormatCommands {
    return {
      toggleBlockFormat: (format: BlockFormat) =>
        this.toggleBlockFormat(editor, format),
      toggleParagraph: () => this.toggleBlockFormat(editor, "p"),
      toggleHeading: (tag: HeadingTagType) =>
        this.toggleBlockFormat(editor, tag),
      toggleQuote: () => this.toggleBlockFormat(editor, "quote"),
      setTextAlignment: (alignment) => this.setTextAlignment(editor, alignment),
      getCurrentBlockType: () => this.getCurrentFormat(editor) || "p",
    };
  }

  /**
   * Set element alignment for selected blocks
   * @param editor - Lexical editor instance
   * @param alignment - Target text alignment
   */
  private setTextAlignment(
    editor: LexicalEditor,
    alignment: "left" | "center" | "right" | "justify",
  ) {
    editor.dispatchCommand(
      FORMAT_ELEMENT_COMMAND,
      alignment as ElementFormatType,
    );
  }

  /**
   * Toggle the block format for the current selection
   * @param editor - Lexical editor instance
   * @param format - Target block format
   */
  private toggleBlockFormat(editor: LexicalEditor, format: BlockFormat) {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Optional: Check if already in this format; if yes, revert to 'p' (true toggle)
        const currentFormat = this.getCurrentFormatSync(); // Sync version for inside update
        if (currentFormat === format) {
          $setBlocksType(selection, () => $createParagraphNode());
          return;
        }

        // Set the new format
        $setBlocksType(selection, () => {
          if (format === "p") return $createParagraphNode();
          if (format === "quote") return $createQuoteNode();
          return $createHeadingNode(format);
        });
      }
    });
  }

  /**
   * Get the state queries provided by this extension
  * @param editor - Lexical editor instance
  * @returns Object containing available state queries
   */
  getStateQueries(editor: LexicalEditor): BlockFormatStateQueries {
    return {
      isParagraph: () => Promise.resolve(this.isFormat("p", editor)),
      isH1: () => Promise.resolve(this.isFormat("h1", editor)),
      isH2: () => Promise.resolve(this.isFormat("h2", editor)),
      isH3: () => Promise.resolve(this.isFormat("h3", editor)),
      isH4: () => Promise.resolve(this.isFormat("h4", editor)),
      isH5: () => Promise.resolve(this.isFormat("h5", editor)),
      isH6: () => Promise.resolve(this.isFormat("h6", editor)),
      isQuote: () => Promise.resolve(this.isFormat("quote", editor)),
      isTextAlignedLeft: () => Promise.resolve(this.isAlignment("left", editor)),
      isTextAlignedCenter: () => Promise.resolve(this.isAlignment("center", editor)),
      isTextAlignedRight: () => Promise.resolve(this.isAlignment("right", editor)),
      isTextAlignedJustify: () => Promise.resolve(this.isAlignment("justify", editor)),
    };
  }

  /**
   * Check whether all selected blocks match the specified alignment
   * @param alignment - Alignment to check
   * @param editor - Lexical editor instance
   * @returns True if all selected blocks match the alignment
   */
  private isAlignment(
    alignment: "left" | "center" | "right" | "justify",
    editor: LexicalEditor,
  ): boolean {
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

        const blockAlignment = this.normalizeAlignment(
          block.getFormatType() as ElementFormatType,
        );
        if (blockAlignment !== alignment) {
          matches = false;
          break;
        }
      }
    });

    return matches;
  }

  private normalizeAlignment(formatType: ElementFormatType): "left" | "center" | "right" | "justify" {
    if (formatType === "center" || formatType === "right" || formatType === "justify") {
      return formatType;
    }
    return "left";
  }

  /**
   * Get the nearest block node starting from the given node
   * @param node - Starting node
   * @returns Nearest block node or null
   */
  private getBlockNode(
    node: any,
  ): ParagraphNode | HeadingNode | QuoteNode | null {
    let current = node;
    while (current) {
      if (
        $isParagraphNode(current) ||
        $isHeadingNode(current) ||
        $isQuoteNode(current)
      ) {
        return current;
      }
      current = current.getParent();
    }
    return null;
  }

  /**
   * Check whether all blocks in the current selection match the specified format
   * @param format - Format to check for
   * @param editor - Lexical editor instance
   * @returns True if all selected blocks match the format
   */
  private isFormat(format: BlockFormat, editor: LexicalEditor): boolean {
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
   * Get the format type for a block node
   * @param node - Block node to check
   * @returns Format type or null
   */
  private getNodeFormat(
    node: ParagraphNode | HeadingNode | QuoteNode,
  ): BlockFormat | null {
    if ($isParagraphNode(node)) return "p";
    if ($isHeadingNode(node)) return node.getTag();
    if ($isQuoteNode(node)) return "quote";
    return null;
  }

  /**
   * Get the current block format for the selection
   * @param editor - Lexical editor instance
   * @returns Current format or null
   */
  private getCurrentFormat(editor: LexicalEditor): BlockFormat | null {
    let format: BlockFormat | null = null;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const block = this.getBlockNode(anchorNode);
        if (block) {
          format = this.getNodeFormat(block);
        }
      }
    });
    return format;
  }

  /**
   * Get the current block format synchronously (for use inside editor.update())
   * @returns Current format or null
   */
  private getCurrentFormatSync(): BlockFormat | null {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return null;
    const anchorNode = selection.anchor.getNode();
    const block = this.getBlockNode(anchorNode);
    return block ? this.getNodeFormat(block) : null;
  }
}

export const blockFormatExtension = new BlockFormatExtension();

