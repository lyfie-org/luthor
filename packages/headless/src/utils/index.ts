/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

export {
  detectEditorDomDivergence,
  readEditorDomText,
  readEditorModelText,
  registerEditorDomWatchdog,
  type EditorDomDivergence,
  type EditorDomWatchdogOptions,
} from "./editorDomWatchdog";

export {
  DEFAULT_ALLOWED_URL_SCHEMES,
  EMBED_ALLOWED_URL_SCHEMES,
  isSafeUrl,
  sanitizeUrlForAttribute,
  type SafeUrlOptions,
} from "./urlSafety";
