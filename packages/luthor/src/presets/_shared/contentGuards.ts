/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  registerContentFormatGuard,
  type LexicalEditor,
  type TextFormatType,
} from "@lyfie/luthor-headless";
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

/** Every feature whose flag decides what the content guards strip. */
export const CONTENT_GUARD_FEATURES: readonly string[] = [
  ...Object.keys(FEATURE_STYLE_PROPERTIES),
  ...Object.keys(FEATURE_TEXT_FORMATS),
];

/**
 * Keeps the content of disabled style features out of the document.
 *
 * Disabling a feature hides its toolbar control and turns its commands into
 * no-ops, but content can still arrive carrying it: a paste from another
 * Lexical editor brings node styles verbatim (`line-height: 3`, `font-size:
 * 30px`), and HTML paste keeps `<sub>`/`<sup>`. Stripping that formatting as
 * it lands means every line renders at the editor's own default — no matter
 * where the text was copied from.
 *
 * Returns an unregister function; a no-op when no guarded feature is off.
 */
export function registerDisabledFeatureContentGuards<TFeature extends string>(
  editor: LexicalEditor,
  featureFlags: FeatureFlagsLike<TFeature>,
): () => void {
  const isDisabled = (feature: string) => featureFlags[feature as TFeature] === false;

  return registerContentFormatGuard(editor, {
    styleProperties: Object.entries(FEATURE_STYLE_PROPERTIES)
      .filter(([feature]) => isDisabled(feature))
      .flatMap(([, properties]) => properties),
    textFormats: Object.entries(FEATURE_TEXT_FORMATS)
      .filter(([feature]) => isDisabled(feature))
      .map(([, format]) => format),
  });
}
