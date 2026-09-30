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
 * What a host knows about an attachment before it loads — enough to reserve its
 * box (no layout shift), pick a thumbnail, and label a file card. Every field is
 * optional; a host that knows nothing returns `undefined` and the embed measures
 * itself on load instead.
 */
export interface MediaMeta {
  /** `image`, `gif`, `video`, `audio`, `document` or `file`. */
  kind?: string;
  /** The type the file is served as (`image/png`, `application/pdf`). */
  mime?: string;
  /** Size in bytes. */
  size?: number;
  /** A content version; changes whenever the bytes do. */
  version?: string;
  /** Intrinsic width in CSS pixels, as displayed (EXIF rotation applied). */
  width?: number | null;
  /** Intrinsic height in CSS pixels, as displayed. */
  height?: number | null;
  /** Running time of audio/video, in milliseconds. */
  durationMs?: number | null;
  /** An animated image (GIF/WebP): never swap it for a still thumbnail. */
  animated?: boolean;
  /** A poster frame exists for this video (`variant: "poster"`). */
  poster?: boolean;
  /** Smaller renditions exist (`variant: "thumb"`). */
  thumb?: boolean;
}

/** Which rendition of an attachment a URL should point at. */
export interface MediaUrlOptions {
  /**
   * `original` (default) — the file itself. `thumb` — a smaller still, at least
   * `width` wide when possible. `poster` — a video's poster frame.
   */
  variant?: "original" | "thumb" | "poster";
  /** Desired width in CSS pixels for `thumb` / `poster`. */
  width?: number;
}

/** What a host's file-card expansion renders from (see `renderFileExpansion`). */
export interface FileExpansionContext {
  target: string;
  /** Text after `#` in the embed (`page=3`), or empty. */
  fragment: string;
  url: string;
  kind: string;
  meta: MediaMeta | null | undefined;
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
  resolveMediaUrl?: (target: string, options?: MediaUrlOptions) => string;
  /**
   * Synchronous, cached metadata for a media target — `undefined` while unknown.
   * Must return the *same object* for the same target until it changes (it is
   * read through `useSyncExternalStore`). Pair with {@link subscribeMediaMeta}
   * to have embeds re-render when a lookup lands.
   */
  getMediaMeta?: (target: string) => MediaMeta | null | undefined;
  /** Subscribe to metadata arriving/changing. Returns an unsubscribe function. */
  subscribeMediaMeta?: (listener: () => void) => () => void;
  /**
   * Extra content under a non-image file card — e.g. an inline PDF viewer the
   * host renders on demand. Return `null` for files it has nothing to add to.
   */
  renderFileExpansion?: (context: FileExpansionContext) => ReactNode;
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
