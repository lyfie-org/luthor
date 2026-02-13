import { TextFormatExtension } from "@lyfie/luthor/extensions/base";

/**
 * StrikethroughExtension - Adds strikethrough text formatting
 *
 * Extends TextFormatExtension to add strikethrough formatting for selected
 * text in the Lexical editor. Integrates with the toolbar system and exposes
 * commands and state queries for strikethrough actions.
 *
 * @example
 * ```tsx
 * import { strikethroughExtension } from '@lyfie/luthor/extensions/formatting/StrikethroughExtension';
 *
 * const extensions = [strikethroughExtension];
 * const editor = createEditorSystem(extensions);
 * ```
 */
export class StrikethroughExtension extends TextFormatExtension<"strikethrough"> {
  constructor() {
    super("strikethrough");
  }
}

export const strikethroughExtension = new StrikethroughExtension();
