/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/*
 * Papyra's navigation & analysis readers (Sprint 1.4).
 *
 * These are read-only derivations the host consumes through the imperative ref:
 * the document outline (for a table-of-contents scrollbar), scroll-to-heading,
 * `@username` mention detection, and trailing `^uuid` block-anchor extraction.
 *
 * They never mutate the document. The outline and scroll helpers inspect the
 * rendered editable DOM (headings carry layout/`top`, which only exists in the
 * DOM); the mention and block-anchor helpers parse the markdown body. Because
 * nothing here patches the live editor, the caret stays sacred — observation,
 * not mutation. Reading from the body upholds the markdown-source-of-truth
 * invariant: the host always gets exactly what the `.md` carries.
 */

import type { PapyraBlockAnchor, PapyraOutlineHeading } from "./PapyraEditor";

/** Debounce window (ms) for the `onOutlineChange` observer. */
export const PAPYRA_OUTLINE_DEBOUNCE_MS = 200;

/** Selector matching every heading level in the rendered editable surface. */
const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";

/**
 * `@username` detection. A mention is an `@` that starts a token (line start or
 * after a non-word, non-`@`, non-`/` character — so email locals like
 * `name@host` and paths are skipped), followed by a username that starts and
 * ends with an alphanumeric and may contain `_`/`-` between.
 */
const MENTION_PATTERN =
  /(?:^|[^A-Za-z0-9_@/])@([A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?)/g;

/**
 * Trailing block anchor: a space, a `^`, then the id, at end of line. Matches
 * the headless block-anchor transformer's serialization.
 */
const BLOCK_ANCHOR_PATTERN = / \^([A-Za-z0-9][A-Za-z0-9_-]*)$/;

/** The stable key for the heading at a given document position. */
export function outlineHeadingKey(index: number): string {
  return `papyra-heading-${index}`;
}

function getEditableRoot(host: HTMLElement | null): HTMLElement | null {
  return host?.querySelector<HTMLElement>('[contenteditable="true"]') ?? null;
}

/**
 * Read the current document outline from the rendered editable surface, in
 * document order. `top` is each heading's offset from the top of the editable
 * content (its bounding-rect top minus the root's), independent of the current
 * scroll position, so a host can map outline entries to scrollbar offsets.
 * Returns `[]` when no editable surface is present (e.g. the markdown source
 * view, or before mount).
 */
export function readOutline(host: HTMLElement | null): PapyraOutlineHeading[] {
  const root = getEditableRoot(host);
  if (!root) {
    return [];
  }

  const rootTop = root.getBoundingClientRect().top;
  const outline: PapyraOutlineHeading[] = [];

  root.querySelectorAll<HTMLElement>(HEADING_SELECTOR).forEach((element, index) => {
    const level = Number(element.tagName.slice(1));
    if (!Number.isFinite(level)) {
      return;
    }

    outline.push({
      level,
      text: (element.textContent ?? "").trim(),
      key: outlineHeadingKey(index),
      top: element.getBoundingClientRect().top - rootTop,
    });
  });

  return outline;
}

/**
 * Scroll the heading addressed by `key` into view. The key is resolved against
 * the current document order, so a host should pass a key from a fresh
 * {@link readOutline} call. Returns `true` when a matching heading was found and
 * scrolled, `false` otherwise.
 */
export function scrollToOutlineHeading(
  host: HTMLElement | null,
  key: string,
): boolean {
  const root = getEditableRoot(host);
  if (!root) {
    return false;
  }

  const headings = root.querySelectorAll<HTMLElement>(HEADING_SELECTOR);
  for (let index = 0; index < headings.length; index += 1) {
    if (outlineHeadingKey(index) === key) {
      headings[index]?.scrollIntoView({ block: "start", inline: "nearest" });
      return true;
    }
  }

  return false;
}

/**
 * Extract distinct `@username` mentions from the markdown body, in first-seen
 * order. The host routes these to its inbox via `adapter.onMentions` during its
 * save orchestration — never on every keystroke, per the adapter contract.
 */
export function extractMentions(markdown: string): string[] {
  const seen = new Set<string>();
  const mentions: string[] = [];

  for (const match of markdown.matchAll(MENTION_PATTERN)) {
    const username = match[1];
    if (username && !seen.has(username)) {
      seen.add(username);
      mentions.push(username);
    }
  }

  return mentions;
}

/**
 * Extract trailing `^uuid` block anchors from the markdown body, one per line
 * that ends with an anchor. Lets the host address a specific block for
 * transclusion.
 */
export function extractBlockAnchors(markdown: string): PapyraBlockAnchor[] {
  const blocks: PapyraBlockAnchor[] = [];

  for (const line of markdown.split("\n")) {
    const match = BLOCK_ANCHOR_PATTERN.exec(line);
    if (match?.[1]) {
      blocks.push({ blockId: match[1], key: match[1] });
    }
  }

  return blocks;
}
