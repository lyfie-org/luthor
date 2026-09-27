/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import {
  AppWindowIcon,
  AtSignIcon,
  BracketsIcon,
  CalendarIcon,
  GlobeIcon,
  PaperclipIcon,
  PlaySquareIcon,
} from "../../core";
import type { ExtensiveToolbarItem } from "../extensive";
import { formatIsoDate, pickMediaFile, PAPYRA_MEDIA_PICKER_ACCEPT } from "./commands";

/** Which host-backed items {@link createPapyraToolbarItems} includes. */
export interface PapyraToolbarItemOptions {
  /**
   * Offer "Mention someone". Only meaningful when the `@` typeahead is
   * registered — an adapter that can search people, trigger not disabled.
   */
  mention: boolean;
  /**
   * Offer "Attach file". Only meaningful when the host supplied an adapter, so
   * the upload extension is registered.
   */
  attach: boolean;
}

const ICON_SIZE = 16;

/**
 * Papyra's own inserts for the persistent toolbar, rendered after the
 * markdown-safe built-ins (see {@link PAPYRA_TOOLBAR_LAYOUT}'s trailing
 * `"customComponent"` section). Each one reaches the same place its slash
 * command or typing trigger does:
 *
 * - **Link a note** types `[[`, opening the note typeahead.
 * - **Mention someone** types `@` (after a space when needed), opening the
 *   people typeahead.
 * - **Attach file** uploads through the adapter and embeds `![[filename]]`.
 * - **Embed** asks for a link and inserts a YouTube (`![[youtube:url]]`) or web
 *   page (`![[iframe:url]]`) embed.
 * - **Insert today's date** types `YYYY-MM-DD`.
 *
 * Every insert round-trips through Papyra's markdown transformers.
 */
export function createPapyraToolbarItems(
  options: PapyraToolbarItemOptions,
): ExtensiveToolbarItem[] {
  const items: ExtensiveToolbarItem[] = [
    {
      id: "papyra.link-note",
      label: "Link a note",
      icon: <BracketsIcon size={ICON_SIZE} />,
      action: ({ insertText }) => insertText("[["),
    },
  ];

  if (options.mention) {
    items.push({
      id: "papyra.mention",
      label: "Mention someone",
      icon: <AtSignIcon size={ICON_SIZE} />,
      action: ({ runCommand }) => {
        runCommand("startMention");
      },
    });
  }

  if (options.attach) {
    items.push({
      id: "papyra.attach",
      label: "Attach file",
      icon: <PaperclipIcon size={ICON_SIZE} />,
      action: async ({ runCommand }) => {
        const file = await pickMediaFile(PAPYRA_MEDIA_PICKER_ACCEPT);
        if (!file) {
          return;
        }
        try {
          await runCommand("uploadAndEmbedFile", file);
        } catch {
          // The adapter owns error reporting (toasts, banners), exactly as it
          // does for a paste or drop that fails to upload.
        }
      },
    });
  }

  items.push(
    {
      id: "papyra.embed",
      label: "Embed",
      icon: <AppWindowIcon size={ICON_SIZE} />,
      items: [
        {
          id: "papyra.embed-youtube",
          label: "YouTube video",
          icon: <PlaySquareIcon size={ICON_SIZE} />,
          input: {
            title: "Embed a YouTube video",
            label: "Video link",
            placeholder: "https://www.youtube.com/watch?v=…",
            submitLabel: "Embed",
            type: "url",
          },
          action: ({ runCommand }, url) => {
            if (url) runCommand("insertYouTubeEmbed", url);
          },
        },
        {
          id: "papyra.embed-web",
          label: "Web page",
          icon: <GlobeIcon size={ICON_SIZE} />,
          input: {
            title: "Embed a web page",
            label: "Page link",
            placeholder: "https://…",
            submitLabel: "Embed",
            type: "url",
          },
          action: ({ runCommand }, url) => {
            if (url) runCommand("insertIframeEmbed", url);
          },
        },
      ],
    },
    {
      id: "papyra.insert-date",
      label: "Insert today's date",
      icon: <CalendarIcon size={ICON_SIZE} />,
      action: ({ insertText }) => insertText(formatIsoDate(new Date())),
    },
  );

  return items;
}
