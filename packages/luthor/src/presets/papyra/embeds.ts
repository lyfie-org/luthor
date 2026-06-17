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
  blockAnchorExtension,
  fileEmbedExtension,
  savedCardExtension,
  transclusionExtension,
  wikilinkExtension,
  wikilinkTypeaheadExtension,
  BlockAnchorNode,
  FileEmbedNode,
  SavedCardNode,
  TransclusionNode,
  WikilinkNode,
  BLOCK_ANCHOR_MARKDOWN_TRANSFORMER,
  FILE_EMBED_MARKDOWN_TRANSFORMER,
  SAVED_CARD_MARKDOWN_TRANSFORMER,
  TRANSCLUSION_MARKDOWN_TRANSFORMER,
  WIKILINK_MARKDOWN_TRANSFORMER,
  FileDropUploadExtension,
  type EmbedResolvers,
} from "@lyfie/luthor-headless";
import type { ExtensiveEditorProps } from "../extensive";
import type { PapyraEditorAdapter } from "./adapter";

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
  wikilinkExtension,
  transclusionExtension,
  blockAnchorExtension,
  wikilinkTypeaheadExtension,
];

/**
 * Build the full extra-extensions array, including the upload pipeline when an
 * adapter is provided. The upload extension is instantiated per-adapter since
 * the upload callback comes from the host.
 */
export function buildPapyraEmbedExtensions(
  adapter?: PapyraEditorAdapter,
): NonNullable<ExtensiveEditorProps["extraExtensions"]> {
  if (!adapter) {
    return PAPYRA_EMBED_EXTENSIONS;
  }

  const uploadExtension = new FileDropUploadExtension({
    uploadFile: (file) => adapter.uploadMedia(file),
  });

  return [...PAPYRA_EMBED_EXTENSIONS, uploadExtension];
}

/**
 * Custom node classes the markdown bridge must understand to parse and serialize
 * Papyra's embeds. Passed to the extensive editor's `markdownExtraNodes` seam.
 */
export const PAPYRA_EMBED_NODES: NonNullable<
  ExtensiveEditorProps["markdownExtraNodes"]
> = [FileEmbedNode, SavedCardNode, WikilinkNode, TransclusionNode, BlockAnchorNode];

/**
 * Lossless bidirectional transformers giving Papyra's embeds a byte-stable
 * markdown round-trip. Ordering matters — the more specific `![[…]]` variants
 * must match before the general file-embed pattern:
 *
 * 1. **Saved card** (`![[card:url]]`) — the `card:` prefix must be claimed before
 *    the general `![[…]]` file embed swallows it as a filename.
 * 2. **Transclusion** (`![[Note#^id]]`) — the `#^` pattern, also before file embed.
 * 3. **File embed** (`![[file.ext]]`) — block-level media.
 * 4. **Block anchor** (`^uuid`) — trailing inline marker.
 * 5. **Wikilink** (`[[Note]]`) — inline link.
 *
 * Passed to the extensive editor's `markdownExtraTransformers` seam (prepended
 * ahead of the built-in set).
 */
export const PAPYRA_EMBED_TRANSFORMERS: NonNullable<
  ExtensiveEditorProps["markdownExtraTransformers"]
> = [
  SAVED_CARD_MARKDOWN_TRANSFORMER,
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
