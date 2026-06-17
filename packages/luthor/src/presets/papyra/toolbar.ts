/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Papyra's toolbar contract (Sprint 1.4).
 *
 * Papyra ships a floating-on-selection toolbar only — the persistent toolbar is
 * disabled in the wrapper (`isToolbarEnabled={false}`). The floating toolbar
 * already gates its buttons on the feature policy, so this module's job is to
 * declare the toolbar *visibility* contract: the items Papyra hard-hides
 * regardless of how a host tweaks the (disabled) persistent layout. It mirrors
 * the OFF column of the Restrictions table and the enforced feature policy, so
 * the toolbar surface can never re-expose a markdown-breaking control.
 *
 * The map only lists items turned OFF; everything absent stays visible by
 * default. `ExtensiveEditor` folds this together with the live feature flags via
 * `mergeToolbarVisibilityWithFeatures`, so a feature switched off still hides its
 * toolbar item even if this map omits it.
 */

import type { ToolbarItemType, ToolbarVisibility } from "../../core";

/**
 * Toolbar items Papyra hard-hides. These are the typography pickers, underline,
 * sub/superscript, the rich-embed inserter, and the in-editor theme toggle — the
 * controls the enforced feature policy turns off because they have no lossless
 * markdown representation or are explicitly restricted by the preset.
 */
const PAPYRA_HIDDEN_TOOLBAR_ITEMS: readonly ToolbarItemType[] = [
  "fontFamily",
  "fontSize",
  "lineHeight",
  "textColor",
  "textHighlight",
  "underline",
  "subscript",
  "superscript",
  "embed",
  "themeToggle",
];

/**
 * The Papyra toolbar visibility contract: every restricted item pinned to
 * `false`. Passed as the wrapper's `toolbarVisibility` so the restriction holds
 * at the toolbar layer too, independent of the feature flags.
 */
export const PAPYRA_TOOLBAR_VISIBILITY: ToolbarVisibility = Object.freeze(
  PAPYRA_HIDDEN_TOOLBAR_ITEMS.reduce<ToolbarVisibility>((visibility, item) => {
    visibility[item] = false;
    return visibility;
  }, {}),
);
