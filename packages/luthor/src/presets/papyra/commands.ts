/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Papyra's command surface (Sprint 1.4).
 *
 * PapyraEditor curates a small, note-taking command set out of the extensive
 * editor's built-in command catalogue. It does this declaratively: a heading
 * allowlist (`headingOptions`), a slash-menu allowlist (`slashCommandVisibility`),
 * and a markdown-friendly shortcut posture (`shortcutConfig`). The wrapper hard-
 * sets these, so the slash menu and command palette only ever offer commands
 * that round-trip cleanly to CommonMark plus the documented Papyra extension set.
 *
 * Scope note: the richer Papyra-specific slash entries the plan envisions
 * ("Link note", "Embed media", "Insert date") are not built here. The extensive
 * editor generates slash items from its built-in catalogue filtered by
 * `slashCommandVisibility`; there is no seam to *inject* custom slash items. That
 * needs an upstream `ExtensiveEditor` prop (e.g. `extraSlashCommands`) — flagged
 * as upstream work rather than patching the editor's internals from a preset.
 * Note-linking already has a first-class input path via the `[[` typeahead, and
 * media embedding via the drop/paste → `uploadMedia` pipeline (both Sprint 1.3).
 */

import type {
  BlockHeadingLevel,
  ShortcutConfig,
  SlashCommandVisibility,
} from "../../core";

/**
 * Headings Papyra offers as commands: H1–H3. Markdown still parses and renders
 * `####`–`######` from a loaded body (the source-of-truth invariant is untouched);
 * this only curates the heading *choices* surfaced in the slash menu, command
 * palette, and block-format controls.
 */
export const PAPYRA_HEADING_OPTIONS: readonly BlockHeadingLevel[] = [
  "h1",
  "h2",
  "h3",
];

/**
 * The curated slash-menu command ids. These map to the extensive editor's
 * built-in commands and cover Papyra's note-taking primitives: headings,
 * lists/checklist, quote, code block, table, horizontal rule, and image.
 */
export const PAPYRA_SLASH_COMMAND_IDS = [
  "block.heading1",
  "block.heading2",
  "block.heading3",
  "list.bullet",
  "list.numbered",
  "list.check",
  "block.quote",
  "block.codeblock",
  "insert.table",
  "insert.horizontal-rule",
  "insert.image",
] as const;

/**
 * The slash-command visibility contract: an allowlist of the curated ids. The
 * extensive editor filters its generated slash items through this, so only the
 * Papyra-approved commands appear.
 */
export const PAPYRA_SLASH_COMMAND_VISIBILITY: SlashCommandVisibility = {
  allowlist: PAPYRA_SLASH_COMMAND_IDS,
};

/**
 * Markdown-friendly shortcut posture. Native Lexical shortcuts (bold/italic/
 * underline/link) are left to the editor, and the preset keeps collision and
 * native-conflict prevention on so curated shortcuts never shadow a browser or
 * editor binding. The enforced feature policy already strips markdown-hostile
 * commands (underline, sub/superscript) before their shortcuts can register.
 */
export const PAPYRA_SHORTCUT_CONFIG: ShortcutConfig = {
  preventNativeConflicts: true,
  preventCollisions: true,
};
