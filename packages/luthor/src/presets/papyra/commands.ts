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
 * On top of the curated built-ins, Papyra contributes three note-specific slash
 * commands through the upstream `ExtensiveEditor.extraSlashCommands` seam (see
 * {@link createPapyraSlashCommands}): "Link note" (drops the `[[` typeahead
 * trigger), "Embed media" (file picker → `adapter.uploadMedia` → `![[name]]`),
 * and "Insert date". Each writes markdown-native syntax via the slash context's
 * `insertText`, so the body stays the source of truth and round-trips cleanly.
 */

import type { ExtensiveSlashCommand } from "../extensive";
import type {
  BlockHeadingLevel,
  ShortcutConfig,
  SlashCommandVisibility,
} from "../../core";
import type { PapyraEditorAdapter } from "./adapter";

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

/** File types the "Embed media" picker accepts. */
const PAPYRA_MEDIA_PICKER_ACCEPT = "image/*,audio/*,video/*";

/**
 * Format a date as `YYYY-MM-DD` using the local calendar (not UTC), so the
 * inserted date matches the writer's day. Markdown-safe plain text.
 */
function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Open a transient file picker and resolve to the chosen file (or `null` if the
 * dialog is dismissed or there is no DOM). The input is detached from the
 * document once it settles. Used by the "Embed media" slash command.
 */
function pickMediaFile(accept: string): Promise<File | null> {
  if (typeof document === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";

    let settled = false;
    const settle = (file: File | null) => {
      if (settled) {
        return;
      }
      settled = true;
      input.remove();
      resolve(file);
    };

    input.addEventListener("change", () => settle(input.files?.[0] ?? null));
    // `cancel` fires when the dialog is dismissed in modern browsers; where it
    // is unsupported the promise simply stays pending until GC, which is fine
    // for a one-shot picker that never blocks the editor.
    input.addEventListener("cancel", () => settle(null));

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * The Papyra-specific slash commands layered on top of the curated built-ins
 * via {@link ExtensiveSlashCommand}. Bound to the active host
 * {@link PapyraEditorAdapter} so "Embed media" can upload through it; the other
 * two need no host services.
 *
 * Each command writes markdown-native syntax through the slash context's
 * `insertText`:
 * - **Link note** drops the `[[` trigger, which opens the wikilink typeahead
 *   (the typeahead then drives suggestions through `adapter.searchNotes`).
 * - **Embed media** uploads the picked file via `adapter.uploadMedia` and
 *   inserts the resulting `![[filename]]` reference.
 * - **Insert date** inserts today's date as `YYYY-MM-DD`.
 */
export function createPapyraSlashCommands(
  adapter: PapyraEditorAdapter,
): ExtensiveSlashCommand[] {
  return [
    {
      id: "papyra.link-note",
      label: "Link note",
      description: "Insert a [[wikilink]] to another note",
      category: "Insert",
      keywords: ["link", "note", "wikilink", "reference"],
      action: ({ insertText }) => {
        // Drop the `[[` trigger; the wikilink typeahead opens on it and resolves
        // candidates through the adapter from there.
        insertText("[[");
      },
    },
    {
      id: "papyra.embed-media",
      label: "Embed media",
      description: "Upload and embed an image, audio, or video file",
      category: "Insert",
      keywords: ["embed", "media", "image", "audio", "video", "upload", "attach"],
      action: async ({ insertText }) => {
        const file = await pickMediaFile(PAPYRA_MEDIA_PICKER_ACCEPT);
        if (!file) {
          return;
        }
        const { filename } = await adapter.uploadMedia(file);
        insertText(`![[${filename}]]`);
      },
    },
    {
      id: "papyra.insert-date",
      label: "Insert date",
      description: "Insert today's date (YYYY-MM-DD)",
      category: "Insert",
      keywords: ["date", "today", "calendar", "timestamp"],
      action: ({ insertText }) => {
        insertText(formatIsoDate(new Date()));
      },
    },
  ];
}
