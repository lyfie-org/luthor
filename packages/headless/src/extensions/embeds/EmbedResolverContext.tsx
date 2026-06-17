/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Host seam for the reusable embed nodes (`[[wikilink]]`, `![[file]]`).
 *
 * The embed nodes are deliberately host-agnostic: a {@link WikilinkNode} knows
 * how to render and round-trip its `[[Target]]` syntax, but it does not know
 * where the target navigates; a {@link FileEmbedNode} knows its `![[file.ext]]`
 * syntax, but not where the media lives. Both delegate those decisions to an
 * injected {@link EmbedResolvers} read from React context.
 *
 * Keeping the contract in the headless package (rather than a preset) is what
 * lets any preset reuse the nodes: the preset maps its own host adapter onto
 * these resolver callbacks and provides them through {@link EmbedResolverProvider}.
 * When no provider is mounted the resolvers are absent and the nodes degrade
 * gracefully (media → an inline reference chip, wikilink → inert styled text),
 * so the nodes still render and — crucially — still round-trip their markdown.
 */

import { createContext, useContext, type ReactNode } from "react";

/**
 * Open-graph-style metadata for a saved web card (`![[card:url]]`). Every field
 * is optional: a host returns whatever it has archived, and the card degrades to
 * its bare URL when a field (or the whole record) is missing.
 */
export interface SavedCardMetadata {
  /** The page title; falls back to the author-supplied title, then the URL. */
  title?: string;
  /** A short page summary, rendered under the title when present. */
  description?: string;
  /** A preview/hero image URL, rendered as the card thumbnail when present. */
  image?: string;
  /** A site favicon URL, rendered beside the source line when present. */
  favicon?: string;
  /** The human site name (e.g. "Wikipedia"), shown on the source line. */
  siteName?: string;
}

/**
 * Callbacks an embed node uses to reach host services. Every member is optional
 * so the nodes degrade gracefully when a host wires only part of the surface (or
 * none of it). A preset adapts its own richer adapter onto this small contract.
 */
export interface EmbedResolvers {
  /**
   * Resolve a media reference (the `file.ext` inside `![[file.ext]]`) to a URL
   * the browser can load. Synchronous so the embed can render its first frame
   * without a loading flash. When omitted, the file embed renders a reference
   * chip instead of loading media.
   */
  resolveMediaUrl?: (target: string) => string;
  /**
   * Navigate to a link target (the `Target` inside `[[Target]]`). Invoked when a
   * reader activates a wikilink. When omitted, the wikilink renders as inert
   * styled text.
   */
  openLink?: (target: string) => void;
  /**
   * Resolve a transcluded block (`![[Note#^blockId]]`) to its rendered content,
   * or `null` when the host withholds it (missing, or denied by authorization).
   * When omitted, transclusion embeds render an unresolved chip.
   */
  resolveBlock?: (note: string, blockId: string) => Promise<string | null>;
  /**
   * Resolve a saved web card (`![[card:url]]`) to its archived metadata, or
   * `null` when the host has none. When omitted, the card renders as a bare link
   * to the URL — still useful, and the markdown round-trips either way.
   */
  resolveCard?: (url: string) => Promise<SavedCardMetadata | null>;
}

const EMPTY_RESOLVERS: EmbedResolvers = {};

/**
 * Context carrying the active {@link EmbedResolvers} to embed nodes rendered
 * inside an editor. Defaults to an empty resolver set so a node read outside an
 * explicit provider still gets a valid (graceful) value rather than `null`.
 */
export const EmbedResolverContext =
  createContext<EmbedResolvers>(EMPTY_RESOLVERS);

EmbedResolverContext.displayName = "EmbedResolverContext";

/**
 * Read the active {@link EmbedResolvers}. Embed node components call this to
 * reach the injected host services; it always returns a usable object (the empty
 * graceful default when no provider is mounted).
 */
export function useEmbedResolvers(): EmbedResolvers {
  return useContext(EmbedResolverContext);
}

/**
 * Provide {@link EmbedResolvers} to the embed nodes rendered within `children`.
 * A preset mounts this around the editor and maps its host adapter onto the
 * resolver callbacks.
 */
export function EmbedResolverProvider({
  resolvers,
  children,
}: {
  resolvers: EmbedResolvers;
  children: ReactNode;
}): ReactNode {
  return (
    <EmbedResolverContext.Provider value={resolvers}>
      {children}
    </EmbedResolverContext.Provider>
  );
}
