/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

export { extensivePreset, extensiveToolbar, createExtensivePreset } from "./preset";
export {
  extensiveExtensions,
  createExtensiveExtensions,
  resolveFeatureFlags,
  DEFAULT_FEATURE_FLAGS,
  isFeatureEnabled,
} from "./extensions";
export { ExtensiveEditor } from "./ExtensiveEditor";
export type { 
    ExtensiveEditorRef, 
    ExtensiveEditorProps, 
    ExtensiveEditorMode } from "./ExtensiveEditor";
export type {
  ExtensiveExtensionsConfig,
  FeatureFlag,
  FeatureFlags,
  FeatureFlagOverrides,
} from "./extensions";
export type { ExtensivePresetConfig } from "./preset";
export type { FeatureShortcutSpec, ToolbarFeatureMap } from "../_shared";
