/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/**
 * Console policy for the library.
 *
 * A library sits inside someone else's application, so the rules are:
 *
 *  - Never log a condition the host can already observe through a
 *    callback, a return value, or a thrown error. Reporting is the host's
 *    job; duplicating it spams their console and their error tracker.
 *  - Do log — once — for a developer mistake that is otherwise invisible
 *    and unrecoverable, so it is not silently swallowed.
 *  - Always prefix, so a host can tell whose message this is.
 *  - Never log from a hot path (render, selection, update listeners)
 *    without deduplication: a per-keystroke warning is unusable.
 *
 * `warnOnce` exists for the last case. Everything routed through here is
 * suppressible by the host with a single console filter on the prefix.
 */

const PREFIX = "[luthor-headless]";

const seenWarnings = new Set<string>();

/** Warn once per distinct message for the lifetime of the module. */
export function warnOnce(message: string, ...details: unknown[]): void {
  if (seenWarnings.has(message)) {
    return;
  }
  seenWarnings.add(message);
  console.warn(`${PREFIX} ${message}`, ...details);
}

/** Warn on every occurrence. Use only outside hot paths. */
export function warn(message: string, ...details: unknown[]): void {
  console.warn(`${PREFIX} ${message}`, ...details);
}

/**
 * Report an unrecoverable failure the host has no other way to see.
 * Prefer surfacing through a callback where one exists.
 */
export function reportError(message: string, error?: unknown): void {
  console.error(`${PREFIX} ${message}`, error);
}

/** Test-only: clears the warn-once memory between cases. */
export function __resetLoggerStateForTests(): void {
  seenWarnings.clear();
}
