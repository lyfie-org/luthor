/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { EditorThemeOverrides } from "../../core";

/**
 * The Papyra design-token contract.
 *
 * PapyraEditor never hardcodes a color or a font family. Every editorial
 * surface is bridged to one of the tokens below, and the host (Papyra, or any
 * note app reusing the preset) supplies the real values — typically light/dark
 * pairs, plus a per-note tint for {@link createPapyraThemeOverrides | colored}
 * notes. When a token is absent the preset falls back to Luthor's own
 * `--luthor-preset-*` base palette (defined in `core/preset-base.css`), so the
 * editor still renders a sensible light editorial default without a host.
 *
 * Because these tokens carry the active theme, they intentionally supersede
 * Luthor's built-in `data-editor-theme` light/dark palette: the host owns the
 * theme policy, the preset only exposes the seams.
 *
 * | Token | Drives |
 * | --- | --- |
 * | `--papyra-surface` | editor + floating-toolbar background |
 * | `--papyra-surface-muted` | table header, muted fills |
 * | `--papyra-text` | body ink, bold, list markers, quote ink |
 * | `--papyra-text-muted` | placeholder, muted captions, comments |
 * | `--papyra-text-heading` | heading ink (Marcellus) |
 * | `--papyra-border` | hairlines: table, horizontal rule, dividers |
 * | `--papyra-accent` | links accent base, checkboxes, quote border |
 * | `--papyra-accent-text` | link text |
 * | `--papyra-accent-contrast` | text on an accent fill |
 * | `--papyra-accent-surface` | tinted fills: quote background, selection |
 * | `--papyra-code-surface` | code-block background |
 * | `--papyra-font-body` | body type (Sora) |
 * | `--papyra-font-heading` | heading type (Marcellus) |
 * | `--papyra-font-mono` | inline + block code (Roboto Mono) |
 *
 * Font tokens are consumed in `papyra.css`; color tokens are bridged through
 * {@link PAPYRA_THEME_OVERRIDES}.
 */
export const PAPYRA_THEME_TOKEN_NAMES = [
  "--papyra-surface",
  "--papyra-surface-muted",
  "--papyra-text",
  "--papyra-text-muted",
  "--papyra-text-heading",
  "--papyra-border",
  "--papyra-accent",
  "--papyra-accent-text",
  "--papyra-accent-contrast",
  "--papyra-accent-surface",
  "--papyra-code-surface",
  "--papyra-font-body",
  "--papyra-font-heading",
  "--papyra-font-mono",
] as const;

/** A documented Papyra design token name. */
export type PapyraThemeTokenName = (typeof PAPYRA_THEME_TOKEN_NAMES)[number];

/**
 * Marker class the wrapper carries for {@link createPapyraThemeOverrides |
 * colored} notes. `papyra.css` uses it to keep ink readable on a tinted paper.
 */
export const PAPYRA_COLORED_VARIANT_CLASS = "luthor-preset-papyra--colored";

/**
 * The editorial token bridge: each Luthor theme override resolves to a Papyra
 * design token, falling back to a Luthor `--luthor-preset-*` base token so the
 * declaration is always valid and hex never lives in the preset. Syntax colors
 * default to a calm monochrome (ink / muted-ink); the host can paint a richer
 * palette through the `--papyra-syntax-*` hooks below.
 */
export const PAPYRA_THEME_OVERRIDES: EditorThemeOverrides = {
  // Surfaces
  "--luthor-bg": "var(--papyra-surface, var(--luthor-preset-bg))",
  "--luthor-muted": "var(--papyra-surface-muted, var(--luthor-preset-muted))",

  // Text
  "--luthor-fg": "var(--papyra-text, var(--luthor-preset-fg))",
  "--luthor-text-bold-color": "var(--papyra-text, var(--luthor-preset-fg))",
  "--luthor-muted-fg": "var(--papyra-text-muted, var(--luthor-preset-muted-fg))",
  "--luthor-placeholder-color":
    "var(--papyra-text-muted, var(--luthor-preset-muted-fg))",

  // Links, lists, accents
  "--luthor-accent": "var(--papyra-accent, var(--luthor-preset-accent))",
  "--luthor-link-color": "var(--papyra-accent-text, var(--luthor-preset-accent))",
  "--luthor-list-marker-color": "var(--papyra-text, var(--luthor-preset-fg))",
  "--luthor-list-checkbox-color":
    "var(--papyra-accent, var(--luthor-preset-accent))",

  // Borders
  "--luthor-border": "var(--papyra-border, var(--luthor-preset-border))",
  "--luthor-table-border-color":
    "var(--papyra-border, var(--luthor-preset-border))",
  "--luthor-hr-color": "var(--papyra-border, var(--luthor-preset-border))",
  "--luthor-table-header-bg":
    "var(--papyra-surface-muted, var(--luthor-preset-muted))",

  // Quote (accent-tinted)
  "--luthor-quote-bg": "var(--papyra-accent-surface, var(--luthor-preset-muted))",
  "--luthor-quote-fg": "var(--papyra-text, var(--luthor-preset-fg))",
  "--luthor-quote-border": "var(--papyra-accent, var(--luthor-preset-accent))",

  // Code block
  "--luthor-codeblock-bg":
    "var(--papyra-code-surface, var(--luthor-preset-muted))",

  // Syntax — calm monochrome default; host may override per token
  "--luthor-syntax-comment":
    "var(--papyra-syntax-comment, var(--papyra-text-muted, var(--luthor-preset-muted-fg)))",
  "--luthor-syntax-keyword":
    "var(--papyra-syntax-keyword, var(--papyra-text, var(--luthor-preset-fg)))",
  "--luthor-syntax-string":
    "var(--papyra-syntax-string, var(--papyra-text, var(--luthor-preset-fg)))",
  "--luthor-syntax-number":
    "var(--papyra-syntax-number, var(--papyra-text, var(--luthor-preset-fg)))",
  "--luthor-syntax-function":
    "var(--papyra-syntax-function, var(--papyra-text, var(--luthor-preset-fg)))",
  "--luthor-syntax-variable":
    "var(--papyra-syntax-variable, var(--papyra-text, var(--luthor-preset-fg)))",

  // Floating toolbar (the only chrome Papyra keeps)
  "--luthor-floating-bg": "var(--papyra-surface, var(--luthor-preset-bg))",
  "--luthor-floating-fg": "var(--papyra-text, var(--luthor-preset-fg))",
  "--luthor-floating-border": "var(--papyra-border, var(--luthor-preset-border))",
  "--luthor-floating-muted":
    "var(--papyra-surface-muted, var(--luthor-preset-muted))",
  "--luthor-floating-accent": "var(--papyra-accent, var(--luthor-preset-accent))",
  "--luthor-floating-accent-fg":
    "var(--papyra-accent-contrast, var(--luthor-preset-bg))",
};

/**
 * Resolve the editor theme overrides for a PapyraEditor instance. The caller's
 * `editorThemeOverrides` are layered on top of {@link PAPYRA_THEME_OVERRIDES},
 * so a host can retune an individual token (or point one at a different design
 * token) without losing the rest of the bridge.
 *
 * @param callerOverrides - Per-instance overrides from the host.
 * @returns The merged, token-driven override map passed to the extensive editor.
 */
export function resolvePapyraThemeOverrides(
  callerOverrides?: EditorThemeOverrides,
): EditorThemeOverrides {
  if (!callerOverrides) {
    return PAPYRA_THEME_OVERRIDES;
  }

  return { ...PAPYRA_THEME_OVERRIDES, ...callerOverrides };
}

/** Options accepted by {@link createPapyraThemeOverrides}. */
export interface PapyraThemeOptions {
  /**
   * Light-lock for tinted ("colored") notes. When the host paints the paper
   * with a per-note tint, the editor must stay on its light editorial palette
   * regardless of the ambient app theme, or ink can wash out on the tint. The
   * wrapper forces `initialTheme="light"` and carries
   * {@link PAPYRA_COLORED_VARIANT_CLASS} so `papyra.css` can pin the ink.
   */
  colored?: boolean;
  /** Per-instance overrides layered on top of the bridge. */
  overrides?: EditorThemeOverrides;
}

/**
 * Build the resolved theme bundle for a PapyraEditor instance: the merged
 * override map plus the `initialTheme` the wrapper should hard-set. `colored`
 * notes are light-locked.
 */
export function createPapyraThemeOverrides(options: PapyraThemeOptions = {}): {
  editorThemeOverrides: EditorThemeOverrides;
  initialTheme?: "light";
} {
  return {
    editorThemeOverrides: resolvePapyraThemeOverrides(options.overrides),
    ...(options.colored ? { initialTheme: "light" } : {}),
  };
}
