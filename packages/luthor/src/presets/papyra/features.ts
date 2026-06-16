/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import { PresetFeaturePolicy } from "../_shared";
import type { FeatureFlag, FeatureFlagOverrides } from "../extensive";

/**
 * Default feature flags for the Papyra note canvas.
 *
 * These describe Papyra's curated writing surface: the formatting and block
 * primitives that round-trip cleanly to CommonMark plus the small documented
 * Papyra extension set. A caller may switch any of these off (turn off tables on
 * a constrained surface, for example), but cannot turn the {@link
 * PAPYRA_FEATURE_ENFORCED} restrictions back on.
 *
 * Anything absent from this map keeps the underlying extensive default, except
 * the features explicitly disabled below because they have no lossless markdown
 * representation (underline) or arrive later as dedicated lossless nodes
 * (iframe/YouTube embeds land in Sprint 1.5).
 */
export const PAPYRA_FEATURE_DEFAULTS: FeatureFlagOverrides = {
  bold: true,
  italic: true,
  strikethrough: true,
  codeFormat: true,
  link: true,
  blockFormat: true,
  list: true,
  horizontalRule: true,
  table: true,
  image: true,
  code: true,
  codeIntelligence: true,
  history: true,
  floatingToolbar: true,
  contextMenu: true,
  commandPalette: true,
  slashCommand: true,
  emoji: true,
  customNode: true,
  tabIndent: true,
  enterKeyBehavior: true,
  underline: false,
  iframeEmbed: false,
  youTubeEmbed: false,
};

/**
 * Enforced-off feature flags — the markdown-breaking or explicitly restricted
 * controls the preset hard-locks. These win over both {@link
 * PAPYRA_FEATURE_DEFAULTS} and any caller override, so a stray `featureFlags`
 * prop can never re-enable a feature that would corrupt the `.md` body or break
 * the markdown-source-of-truth invariant.
 *
 * Mirrors the OFF column of the Restrictions table. View tabs, the pinned
 * toolbar, and the `json`/`html` modes are not flags — the wrapper locks those
 * through dedicated props (`availableModes`, `isEditorViewTabsVisible`,
 * `isToolbarPinned`).
 */
export const PAPYRA_FEATURE_ENFORCED: FeatureFlagOverrides = {
  fontFamily: false,
  fontSize: false,
  lineHeight: false,
  textColor: false,
  textHighlight: false,
  subscript: false,
  superscript: false,
  themeToggle: false,
  draggableBlock: false,
};

/**
 * The Papyra feature policy: curated defaults composed with an enforced set of
 * restrictions. Resolve caller overrides through {@link
 * PresetFeaturePolicy.resolve} so the enforced flags always have the final say.
 */
export const papyraFeaturePolicy = new PresetFeaturePolicy<FeatureFlag>(
  PAPYRA_FEATURE_DEFAULTS,
  PAPYRA_FEATURE_ENFORCED,
);
