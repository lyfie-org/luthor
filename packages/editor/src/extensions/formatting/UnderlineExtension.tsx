import { TextFormatExtension } from "@lyfie/luthor/extensions/base";
import {
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  $getSelection,
  $isRangeSelection,
} from "lexical";

/**
 * Custom underline transformer for Markdown
 * Uses ++underline++ syntax (common in extended Markdown)
 */
export const UNDERLINE_TRANSFORMER = {
  format: ["underline"] as const,
  tag: "++",
  type: "text-format" as const,
};

/**
 * UnderlineExtension - Adds underline text formatting
 *
 * Extends TextFormatExtension to add underline formatting for selected text in
 * the Lexical editor. Integrates with the toolbar system and exposes commands
 * and state queries for underline actions.
 *
 * Supports Markdown syntax: ++underline++
 *
 * @example
 * ```tsx
 * import { underlineExtension } from '@lyfie/luthor/extensions/formatting/UnderlineExtension';
 *
 * const extensions = [underlineExtension];
 * const editor = createEditorSystem(extensions);
 * ```
 */
export class UnderlineExtension extends TextFormatExtension<"underline"> {
  constructor() {
    super("underline");
  }

  /**
   * Returns Markdown transformers for underline formatting.
   *
  * @returns An array containing the underline transformer
   */
  getMarkdownTransformers(): any[] {
    return [UNDERLINE_TRANSFORMER];
  }
}

export const underlineExtension = new UnderlineExtension();
