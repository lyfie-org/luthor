import { TextFormatExtension } from "@lyfie/luthor/extensions/base";

/**
 * Italic text formatting extension.
 * Provides italic formatting with toggle command and state tracking.
 */
export class ItalicExtension extends TextFormatExtension<"italic"> {
  /**
   * Creates a new italic extension.
   */
  constructor() {
    super("italic");
  }
}

/**
 * Preconfigured italic extension instance.
 * Ready for use in extension arrays.
 */
export const italicExtension = new ItalicExtension();
