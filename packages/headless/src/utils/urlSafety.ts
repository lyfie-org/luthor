/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/**
 * Scheme-allowlist URL validation shared by every place Luthor turns
 * user-supplied text into a navigable or embeddable URL: the link
 * extension's default validator, the media embeds' src handling, and the
 * HTML import path.
 *
 * The threat model is a document a user did not author — pasted HTML, a
 * synced markdown file, a serialized editor state from an untrusted store.
 * `javascript:`, `data:`, and `vbscript:` URLs all parse successfully with
 * `new URL(...)`, so "does it parse" is not a safety check. Safety here
 * means the scheme is on an explicit allowlist.
 */

/**
 * Schemes the default link validator accepts. Deliberately short: anything
 * a host wants beyond these (a custom app protocol like `obsidian://`) is
 * an explicit opt-in via `allowedSchemes` or a custom validator.
 */
export const DEFAULT_ALLOWED_URL_SCHEMES: readonly string[] = Object.freeze([
  "http",
  "https",
  "mailto",
  "tel",
]);

/**
 * Schemes that may appear in an embed frame's `src`. Stricter than links:
 * `mailto:`/`tel:` make no sense inside an iframe.
 */
export const EMBED_ALLOWED_URL_SCHEMES: readonly string[] = Object.freeze([
  "http",
  "https",
]);

/**
 * Options accepted by {@link isSafeUrl} and {@link sanitizeUrlForAttribute}.
 */
export interface SafeUrlOptions {
  /**
   * Schemes (without the trailing colon) treated as safe.
   * Default: {@link DEFAULT_ALLOWED_URL_SCHEMES}.
   */
  allowedSchemes?: readonly string[];
}

/**
 * Returns true when a URL is safe to make navigable or embeddable.
 *
 * Accepts:
 * - absolute URLs whose scheme is on the allowlist (compared after the URL
 *   parser normalizes case and strips the tab/newline characters attackers
 *   use to disguise `javascript:`),
 * - same-document references (`#section`),
 * - protocol-relative references (`//example.com/path`), which resolve to
 *   the page's own http(s) scheme.
 *
 * Everything else — unparseable input, relative paths, and any scheme not
 * on the allowlist — is rejected. Rejecting relative paths matches the
 * previous default validator's behavior, so no formerly-invalid input
 * becomes valid by accident.
 */
export function isSafeUrl(url: string, options?: SafeUrlOptions): boolean {
  const allowedSchemes = options?.allowedSchemes ?? DEFAULT_ALLOWED_URL_SCHEMES;
  const trimmed = url.trim();

  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("#")) {
    return true;
  }

  if (trimmed.startsWith("//")) {
    // Protocol-relative: borrow a base purely to check the reference parses
    // into a host. The base's own scheme never reaches the document.
    try {
      new URL(trimmed, "https://relative-url-check.invalid");
      return true;
    } catch {
      return false;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  // URL#protocol is already lowercased and has the parser's whitespace
  // stripping applied, so "JaVaScRiPt:" and "java\tscript:" both land here
  // as "javascript:" and fail the allowlist.
  const scheme = parsed.protocol.slice(0, -1);
  return allowedSchemes.includes(scheme);
}

/**
 * Sanitizes a URL destined for a live DOM attribute (`href`, `src`).
 * Returns the URL unchanged when {@link isSafeUrl} accepts it, and the
 * inert `about:blank` otherwise — the same convention Lexical's LinkNode
 * uses, so a hostile URL renders as a dead link/frame instead of being
 * silently deleted from the document model.
 */
export function sanitizeUrlForAttribute(
  url: string,
  options?: SafeUrlOptions,
): string {
  return isSafeUrl(url, options) ? url : "about:blank";
}
