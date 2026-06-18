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

import type { ToolbarItemType, ToolbarLayout, ToolbarVisibility } from "../../core";

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

/**
 * The persistent-toolbar layout PapyraEditor uses when the opt-in
 * {@link PapyraEditorProps.toolbar | `toolbar`} prop is set.
 *
 * It lists only Papyra's markdown-safe actions: history, block format
 * (paragraph/headings) + quote, the inline marks Papyra keeps (bold, italic,
 * strikethrough, inline code, link), lists + checklist with indent controls,
 * and the block inserts (code block, horizontal rule, table, image). The
 * typography pickers, text color/highlight, sub/superscript, alignment (no
 * lossless markdown form), the rich-embed inserter, and the theme toggle are
 * intentionally absent — they are also pinned off by
 * {@link PAPYRA_TOOLBAR_VISIBILITY} and the enforced feature policy, so the
 * restricted controls can never surface even if a host retunes the layout.
 */
export const PAPYRA_TOOLBAR_LAYOUT: ToolbarLayout = {
  sections: [
    { items: ["undo", "redo"] },
    { items: ["blockFormat", "quote"] },
    { items: ["bold", "italic", "strikethrough", "code", "link"] },
    { items: ["unorderedList", "orderedList", "checkList", "indentList", "outdentList"] },
    { items: ["codeBlock", "horizontalRule", "table", "image"] },
  ],
};
