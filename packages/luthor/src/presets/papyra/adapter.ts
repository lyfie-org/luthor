/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * The host seam for the `papyra` preset (Sprint 1.3).
 *
 * PapyraEditor is deliberately host-agnostic: it knows how to render and
 * round-trip Papyra's embeds (`![[media]]`, `[[Note]]`, `![[Note#^id]]`), but it
 * does not know where media lives, how a note is searched, or where a wikilink
 * navigates. Every one of those decisions is delegated to an injected
 * {@link PapyraEditorAdapter}. The host (Papyra, or any note app reusing the
 * preset) implements the adapter against its own API, router, and auth; the
 * preset only declares the contract and threads it to the embed nodes through
 * {@link PapyraAdapterContext}.
 *
 * Security note: the adapter is the only data path out of the editor. Its
 * resolvers hit endpoints that enforce the host's server-side authorization
 * (Papyra's `PathGuard`/`401`). The editor's blur/lock states are UX affordances,
 * never the security boundary — a "locked" editor must never be handed plaintext
 * it should not show.
 */

import { createContext, useContext } from "react";

/** A reference to a note, by human title and/or stable id. */
export interface PapyraNoteRef {
  /** The note's display title, as written inside `[[Title]]`. */
  title?: string;
  /** The note's stable id, when the host already resolved one. */
  id?: string;
}

/** A single note returned by {@link PapyraEditorAdapter.searchNotes}. */
export interface PapyraNoteSearchResult {
  /** The note's stable id. */
  id: string;
  /** The note's display title. */
  title: string;
  /** Optional per-note tint, used to color the typeahead entry. */
  color?: string;
}

/** A reference to a specific block inside a note, for transclusion. */
export interface PapyraBlockRef {
  /** The target note (title or id), as written before `#^`. */
  note: string;
  /** The block anchor id, as written after `#^`. */
  blockId: string;
}

/**
 * The entire contract between the `papyra` preset and its host.
 *
 * Luthor declares this interface; the host implements it. Keeping the surface
 * small and data-only is what lets the preset stay reusable: a different note app
 * can adopt PapyraEditor by supplying a different adapter, with no fork. Optional
 * members (`resolveBlock`, `onMentions`) gate capabilities the host may not need;
 * when they are absent the preset degrades gracefully (see
 * {@link createFallbackPapyraAdapter}) rather than throwing.
 */
export interface PapyraEditorAdapter {
  /**
   * Resolve a media filename (the `file.ext` inside `![[file.ext]]`) to a URL the
   * browser can load. Synchronous so embeds can render their first frame without
   * a loading flash; the host typically returns a stable CDN/API URL.
   */
  resolveMediaUrl(filename: string): string;
  /**
   * Persist a dropped or pasted file and resolve to the stored filename the
   * editor should reference as `![[filename]]`. The host owns the upload endpoint
   * and its authorization.
   */
  uploadMedia(file: File): Promise<{ filename: string }>;
  /**
   * Navigate to a note. Invoked when the reader activates a `[[Note]]` wikilink.
   * The host owns routing; the editor only reports the intent.
   */
  openNote(ref: PapyraNoteRef): void;
  /**
   * Search notes for the `[[` typeahead. Resolves to the candidate notes for the
   * given query (already debounced by the host if needed).
   */
  searchNotes(query: string): Promise<PapyraNoteSearchResult[]>;
  /**
   * Resolve a transcluded block (`![[Note#^id]]`) to its rendered markdown, or
   * `null` when the host withholds it (missing, or denied by `PathGuard`/`401`).
   * Optional: hosts without transclusion omit it and the embed renders an
   * unresolved chip.
   */
  resolveBlock?(ref: PapyraBlockRef): Promise<string | null>;
  /**
   * Report `@username` mentions detected in the body, so the host can route an
   * inbox ping. Optional. Called by the host's save orchestration, never on
   * every keystroke.
   */
  onMentions?(usernames: string[]): void;
}

/**
 * A no-op adapter used when the host injects none. Every method degrades
 * gracefully instead of throwing, so `<PapyraEditor>` still renders, edits, and
 * round-trips its markdown without a host — embeds simply fall back to plain
 * references (media → its filename, wikilink → inert text, transclusion → an
 * unresolved chip). This keeps the preset usable in isolation (docs, tests,
 * Storybook) and upholds the markdown-source-of-truth invariant: the body is
 * never rewritten just because no adapter was supplied.
 */
export function createFallbackPapyraAdapter(): PapyraEditorAdapter {
  return {
    resolveMediaUrl: (filename) => filename,
    uploadMedia: (file) => Promise.resolve({ filename: file.name }),
    openNote: () => {},
    searchNotes: () => Promise.resolve([]),
    resolveBlock: () => Promise.resolve(null),
  };
}

/**
 * Context carrying the active {@link PapyraEditorAdapter} to the embed nodes
 * rendered inside a PapyraEditor. Defaults to {@link createFallbackPapyraAdapter}
 * so a node read outside an explicit provider still gets a valid, graceful
 * adapter rather than `null`.
 */
export const PapyraAdapterContext = createContext<PapyraEditorAdapter>(
  createFallbackPapyraAdapter(),
);

PapyraAdapterContext.displayName = "PapyraAdapterContext";

/**
 * Read the active {@link PapyraEditorAdapter}. Embed nodes and host glue call
 * this to reach the injected host services; it always returns a usable adapter
 * (the graceful fallback when none was provided).
 */
export function usePapyraAdapter(): PapyraEditorAdapter {
  return useContext(PapyraAdapterContext);
}
