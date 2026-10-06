/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { getCSSFromStyleObject, getStyleObjectFromCSS } from "@lexical/selection";
import {
  ParagraphNode,
  TEXT_TYPE_TO_FORMAT,
  TextNode,
  type LexicalEditor,
  type TextFormatType,
} from "lexical";

export type { TextFormatType } from "lexical";

/** What {@link registerContentFormatGuard} keeps out of the document. */
export interface ContentFormatGuardOptions {
  /** Inline style properties (lowercase, e.g. `line-height`) to strip. */
  styleProperties?: readonly string[];
  /** Text format bits (e.g. `superscript`) to clear. */
  textFormats?: readonly TextFormatType[];
}

/** Returns `style` without `properties`, or `null` when nothing was removed. */
function stripStyleProperties(style: string, properties: ReadonlySet<string>): string | null {
  if (!style || properties.size === 0) {
    return null;
  }

  const styles = getStyleObjectFromCSS(style);
  let removed = false;
  const kept: Record<string, string> = {};
  for (const [property, value] of Object.entries(styles)) {
    if (properties.has(property.toLowerCase())) {
      removed = true;
      continue;
    }
    kept[property] = value;
  }

  return removed ? getCSSFromStyleObject(kept) : null;
}

/**
 * Strips the given inline style properties and text formats from every text
 * node and paragraph as content lands — pasted, typed, or already present when
 * the guard registers. Covers what Lexical keeps on paste: node styles from
 * its own clipboard format and `<sub>`/`<sup>` from HTML.
 *
 * Returns an unregister function; a no-op when there is nothing to strip.
 */
export function registerContentFormatGuard(
  editor: LexicalEditor,
  options: ContentFormatGuardOptions,
): () => void {
  const properties = new Set(
    (options.styleProperties ?? []).map((property) => property.toLowerCase()),
  );
  const formats = options.textFormats ?? [];

  if (properties.size === 0 && formats.length === 0) {
    return () => {};
  }

  // Transforms re-run on every node they touch, so each write must happen
  // only when something actually changes.
  const unregisterText = editor.registerNodeTransform(TextNode, (node) => {
    const style = stripStyleProperties(node.getStyle(), properties);
    if (style !== null) {
      node.setStyle(style);
    }
    for (const format of formats) {
      if (node.hasFormat(format)) {
        node.toggleFormat(format);
      }
    }
  });

  // A paragraph's text style seeds whatever is typed into it next, and its
  // block style is where a block-level style command would write.
  const unregisterParagraph = editor.registerNodeTransform(ParagraphNode, (node) => {
    const textStyle = stripStyleProperties(node.getTextStyle(), properties);
    if (textStyle !== null) {
      node.setTextStyle(textStyle);
    }
    const style = stripStyleProperties(node.getStyle(), properties);
    if (style !== null) {
      node.setStyle(style);
    }
    for (const format of formats) {
      const bit = TEXT_TYPE_TO_FORMAT[format];
      if (bit !== undefined && node.hasTextFormat(format)) {
        node.setTextFormat(node.getTextFormat() ^ bit);
      }
    }
  });

  return () => {
    unregisterText();
    unregisterParagraph();
  };
}
