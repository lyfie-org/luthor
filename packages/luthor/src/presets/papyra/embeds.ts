/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Papyra's embed wiring (Sprint 1.3).
 *
 * The embed *capabilities* — the `[[wikilink]]`, `![[file.ext]]`, `![[Note#^id]]`
 * transclusion, and trailing `^uuid` block anchor nodes, their lossless markdown
 * transformers, and the host resolver seam — live in `@lyfie/luthor-headless` (per
 * the Two-Package Law: anything that derives from Lexical is authored in headless
 * and re-exported, never inside a preset). This module only *composes* those
 * primitives for the Papyra preset: it bundles the extensions/nodes/transformers
 * PapyraEditor feeds to the extensive editor, and adapts a
 * {@link PapyraEditorAdapter} onto the generic {@link EmbedResolvers} the nodes
 * read from context.
 */

import {
  BlockAnchorExtension,
  blockAnchorExtension,
  calloutExtension,
  fileEmbedExtension,
  iframeEmbedExtension,
  savedCardExtension,
  transclusionExtension,
  wikilinkExtension,
  mentionTypeaheadExtension,
  wikilinkTypeaheadExtension,
  youTubeEmbedExtension,
  BlockAnchorNode,
  CalloutNode,
  FileEmbedNode,
  IframeEmbedNode,
  SavedCardNode,
  TransclusionNode,
  WikilinkNode,
  YouTubeEmbedNode,
  BLOCK_ANCHOR_MARKDOWN_TRANSFORMER,
  CALLOUT_MARKDOWN_TRANSFORMER,
  FILE_EMBED_MARKDOWN_TRANSFORMER,
  IFRAME_EMBED_MARKDOWN_TRANSFORMER,
  SAVED_CARD_MARKDOWN_TRANSFORMER,
  TRANSCLUSION_MARKDOWN_TRANSFORMER,
  WIKILINK_MARKDOWN_TRANSFORMER,
  YOUTUBE_EMBED_MARKDOWN_TRANSFORMER,
  FileDropUploadExtension,
  MentionTypeaheadExtension,
  WikilinkTypeaheadExtension,
  type EmbedResolvers,
  type MentionTypeaheadConfig,
  type WikilinkTypeaheadConfig,
} from "@lyfie/luthor-headless";
import type { ExtensiveEditorProps } from "../extensive";
import type { PapyraEditorAdapter } from "./adapter";
import type {
  PapyraTypeaheadConfig,
  PapyraTypeaheadTriggerConfig,
} from "./typeahead";

/**
 * Headless extensions that register Papyra's embed nodes with the live editor.
 * Passed to the extensive editor's `extraExtensions` seam so the nodes render
 * without forking the editor.
 */
export const PAPYRA_EMBED_EXTENSIONS: NonNullable<
  ExtensiveEditorProps["extraExtensions"]
> = [
  fileEmbedExtension,
  savedCardExtension,
  calloutExtension,
  iframeEmbedExtension,
  youTubeEmbedExtension,
  wikilinkExtension,
  transclusionExtension,
  blockAnchorExtension,
  wikilinkTypeaheadExtension,
];

/** Options for {@link buildPapyraEmbedExtensions}. */
export interface PapyraEmbedExtensionOptions {
  /**
   * When `true`, the block-anchor extension is instantiated with automatic
   * stamping: every anchorable block gets a stable `^id` anchor on commit
   * (the preset's `blockAnchors: "auto"` mode).
   */
  autoStampBlockAnchors?: boolean;
  /**
   * Host tuning for the `@` and `[[` triggers. A trigger with its own config
   * is instantiated fresh (the shipped singletons are shared between editors,
   * so they can never carry per-host settings); a `disabled` trigger is not
   * registered at all. See {@link PapyraTypeaheadConfig}.
   */
  typeahead?: PapyraTypeaheadConfig;
}

/** Element type of the extensive editor's `extraExtensions` array. */
type PapyraExtraExtension = NonNullable<
  ExtensiveEditorProps["extraExtensions"]
>[number];

/**
 * The subset of a trigger's host config the headless extension consumes, or
 * `undefined` when the host tuned nothing and the shared singleton will do.
 */
function toExtensionConfig(
  config: PapyraTypeaheadTriggerConfig | undefined,
): (MentionTypeaheadConfig & WikilinkTypeaheadConfig) | undefined {
  if (config?.minQueryLength === undefined && config?.offset === undefined) {
    return undefined;
  }
  return {
    ...(config.minQueryLength === undefined
      ? {}
      : { minQueryLength: config.minQueryLength }),
    ...(config.offset === undefined ? {} : { offset: config.offset }),
  };
}

/**
 * Build the full extra-extensions array, including the upload pipeline when an
 * adapter is provided. The upload extension is instantiated per-adapter since
 * the upload callback comes from the host; the block-anchor and typeahead
 * extensions are instantiated per-options when the host tunes them.
 *
 * The `@` mention typeahead is host-gated twice over: without an adapter that
 * can search people there is nothing to suggest, so the trigger is not
 * registered at all rather than opening an empty menu — and a host that wants
 * the trigger gone regardless sets `typeahead.mention.disabled`.
 */
export function buildPapyraEmbedExtensions(
  adapter?: PapyraEditorAdapter,
  options?: PapyraEmbedExtensionOptions,
): NonNullable<ExtensiveEditorProps["extraExtensions"]> {
  const noteLink = options?.typeahead?.noteLink;
  const mention = options?.typeahead?.mention;

  const extensions: PapyraExtraExtension[] = [];
  for (const extension of PAPYRA_EMBED_EXTENSIONS) {
    if (extension === wikilinkTypeaheadExtension) {
      if (noteLink?.disabled) {
        continue;
      }
      const config = toExtensionConfig(noteLink);
      extensions.push(
        config ? new WikilinkTypeaheadExtension(config) : extension,
      );
      continue;
    }

    if (extension === blockAnchorExtension && options?.autoStampBlockAnchors) {
      extensions.push(new BlockAnchorExtension({ autoStamp: true }));
      continue;
    }

    extensions.push(extension);
  }

  if (!adapter) {
    return extensions;
  }

  extensions.push(
    new FileDropUploadExtension({
      uploadFile: (file) => adapter.uploadMedia(file),
    }),
  );

  if (adapter.searchUsers && !mention?.disabled) {
    const config = toExtensionConfig(mention);
    extensions.push(
      config ? new MentionTypeaheadExtension(config) : mentionTypeaheadExtension,
    );
  }

  return extensions;
}

/**
 * Custom node classes the markdown bridge must understand to parse and serialize
 * Papyra's embeds. Passed to the extensive editor's `markdownExtraNodes` seam.
 */
export const PAPYRA_EMBED_NODES: NonNullable<
  ExtensiveEditorProps["markdownExtraNodes"]
> = [
  FileEmbedNode,
  SavedCardNode,
  CalloutNode,
  IframeEmbedNode,
  YouTubeEmbedNode,
  WikilinkNode,
  TransclusionNode,
  BlockAnchorNode,
];

/**
 * Lossless bidirectional transformers giving Papyra's embeds a byte-stable
 * markdown round-trip. Ordering matters — the more specific `![[…]]` variants
 * must match before the general file-embed pattern:
 *
 * 1. **Saved card** (`![[card:url]]`) — the `card:` prefix must be claimed before
 *    the general `![[…]]` file embed swallows it as a filename.
 * 2. **YouTube** (`![[youtube:url]]`) — the `youtube:` prefix, before file embed.
 * 3. **Iframe** (`![[iframe:url]]`) — the `iframe:` prefix, before file embed.
 * 4. **Transclusion** (`![[Note#^id]]`) — the `#^` pattern, also before file embed.
 * 5. **File embed** (`![[file.ext]]`) — block-level media.
 * 6. **Block anchor** (`^uuid`) — trailing inline marker.
 * 7. **Wikilink** (`[[Note]]`) — inline link.
 *
 * The **callout** (`> [!transcript]`) is a multiline-element transformer with a
 * distinct opening pattern, so it is independent of the ordering above; it is
 * tried ahead of the built-in quote on import and claims the whole block.
 *
 * Passed to the extensive editor's `markdownExtraTransformers` seam (prepended
 * ahead of the built-in set).
 */
export const PAPYRA_EMBED_TRANSFORMERS: NonNullable<
  ExtensiveEditorProps["markdownExtraTransformers"]
> = [
  SAVED_CARD_MARKDOWN_TRANSFORMER,
  YOUTUBE_EMBED_MARKDOWN_TRANSFORMER,
  IFRAME_EMBED_MARKDOWN_TRANSFORMER,
  CALLOUT_MARKDOWN_TRANSFORMER,
  TRANSCLUSION_MARKDOWN_TRANSFORMER,
  FILE_EMBED_MARKDOWN_TRANSFORMER,
  BLOCK_ANCHOR_MARKDOWN_TRANSFORMER,
  WIKILINK_MARKDOWN_TRANSFORMER,
];

/**
 * Adapt a {@link PapyraEditorAdapter} onto the generic {@link EmbedResolvers}
 * the headless embed nodes read from context. Each resolver maps a single
 * adapter method; the adapter's own no-op fallback keeps every path safe when
 * the host wires nothing.
 */
export function createPapyraEmbedResolvers(
  adapter: PapyraEditorAdapter,
): EmbedResolvers {
  return {
    resolveMediaUrl: (target) => adapter.resolveMediaUrl(target),
    openLink: (target) => adapter.openNote({ title: target }),
    resolveBlock: adapter.resolveBlock
      ? (note, blockId) => adapter.resolveBlock!({ note, blockId })
      : undefined,
    resolveCard: adapter.resolveCard
      ? (url) => adapter.resolveCard!(url)
      : undefined,
  };
}
