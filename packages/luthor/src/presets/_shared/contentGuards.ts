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
import type { FeatureFlagsLike } from "./types";

/**
 * Inline style properties each style feature writes. When the feature is
 * disabled, these properties are kept out of the document entirely.
 */
const FEATURE_STYLE_PROPERTIES: Readonly<Record<string, readonly string[]>> = {
  fontFamily: ["font-family"],
  fontSize: ["font-size"],
  lineHeight: ["line-height"],
  textColor: ["color"],
  textHighlight: ["background-color", "background"],
};

/** Text format bits each format feature toggles. */
const FEATURE_TEXT_FORMATS: Readonly<Record<string, TextFormatType>> = {
  subscript: "subscript",
  superscript: "superscript",
};

/** Returns `style` without `properties`, or `null` when nothing was removed. */
function stripStyleProperties(style: string, properties: ReadonlySet<string>): string | null {
  if (!style) {
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
 * Keeps the content of disabled style features out of the document.
 *
 * Disabling a feature hides its toolbar control and turns its commands into
 * no-ops, but content can still arrive carrying it: a paste from another
 * Lexical editor brings node styles verbatim (`line-height: 3`, `font-size:
 * 30px`), and HTML paste keeps `<sub>`/`<sup>`. These node transforms strip
 * that formatting as it lands, so every line renders at the editor's own
 * default — no matter where the text was copied from.
 *
 * Returns an unregister function; a no-op when no guarded feature is off.
 */
export function registerDisabledFeatureContentGuards<TFeature extends string>(
  editor: LexicalEditor,
  featureFlags: FeatureFlagsLike<TFeature>,
): () => void {
  const isDisabled = (feature: string) => featureFlags[feature as TFeature] === false;

  const properties = new Set(
    Object.entries(FEATURE_STYLE_PROPERTIES)
      .filter(([feature]) => isDisabled(feature))
      .flatMap(([, featureProperties]) => featureProperties),
  );
  const formats = Object.entries(FEATURE_TEXT_FORMATS)
    .filter(([feature]) => isDisabled(feature))
    .map(([, format]) => format);

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
  // block style is where a line-height command would write.
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
