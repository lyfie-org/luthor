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
