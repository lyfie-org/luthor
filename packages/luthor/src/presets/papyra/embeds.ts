/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Papyra's embed wiring (Sprint 1.3a).
 *
 * The embed *capabilities* — the `[[wikilink]]` and `![[file.ext]]` nodes, their
 * lossless markdown transformers, and the host resolver seam — live in
 * `@lyfie/luthor-headless` (per the Two-Package Law: anything that derives from
 * Lexical is authored in headless and re-exported, never inside a preset). This
 * module only *composes* those primitives for the Papyra preset: it bundles the
 * extensions/nodes/transformers PapyraEditor feeds to the extensive editor, and
 * adapts a {@link PapyraEditorAdapter} onto the generic {@link EmbedResolvers}
 * the nodes read from context.
 */

import {
  fileEmbedExtension,
  wikilinkExtension,
  FileEmbedNode,
  WikilinkNode,
  FILE_EMBED_MARKDOWN_TRANSFORMER,
  WIKILINK_MARKDOWN_TRANSFORMER,
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
> = [fileEmbedExtension, wikilinkExtension];

/**
 * Custom node classes the markdown bridge must understand to parse and serialize
 * Papyra's embeds. Passed to the extensive editor's `markdownExtraNodes` seam.
 */
export const PAPYRA_EMBED_NODES: NonNullable<
  ExtensiveEditorProps["markdownExtraNodes"]
> = [FileEmbedNode, WikilinkNode];

/**
 * Lossless bidirectional transformers giving Papyra's embeds a byte-stable
 * markdown round-trip. The block-level file embed is listed before the inline
 * wikilink so a standalone `![[file]]` line is matched as a media embed before
 * the wikilink rule sees its inner `[[…]]`. Passed to the extensive editor's
 * `markdownExtraTransformers` seam (prepended ahead of the built-in set).
 */
export const PAPYRA_EMBED_TRANSFORMERS: NonNullable<
  ExtensiveEditorProps["markdownExtraTransformers"]
> = [FILE_EMBED_MARKDOWN_TRANSFORMER, WIKILINK_MARKDOWN_TRANSFORMER];

/**
 * Adapt a {@link PapyraEditorAdapter} onto the generic {@link EmbedResolvers}
 * the headless embed nodes read from context. A media reference resolves through
 * the adapter's media URL resolver; activating a wikilink asks the adapter to
 * open the note by title. The adapter's own no-op fallback keeps both paths safe
 * when the host wires nothing.
 */
export function createPapyraEmbedResolvers(
  adapter: PapyraEditorAdapter,
): EmbedResolvers {
  return {
    resolveMediaUrl: (target) => adapter.resolveMediaUrl(target),
    openLink: (target) => adapter.openNote({ title: target }),
  };
}
