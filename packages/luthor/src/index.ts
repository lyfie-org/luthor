/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import "./styles.css";

export * from "./presets";
export * from "./core";
export * as headless from "@lyfie/luthor-headless";

// Model/DOM divergence watchdog (implemented in headless, re-exported for
// hosts wiring the editors' `onDesync` prop).
export {
  detectEditorDomDivergence,
  registerEditorDomWatchdog,
  type EditorDomDivergence,
  type EditorDomWatchdogOptions,
} from "@lyfie/luthor-headless";
