/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

import type { EditorConfig, Extension, LuthorTheme } from "@lyfie/luthor-headless";
import {
  extensivePreset,
  createExtensivePreset,
  ExtensiveEditor,
  extensiveExtensions,
  createExtensiveExtensions,
} from "./extensive";
import { mdEditorPreset, MarkDownEditor } from "./md-editor";
import { htmlEditorPreset, HTMLEditor } from "./html-editor";
import { legacyRichPreset, LegacyRichEditor } from "./legacy-rich";
import { headlessEditorPreset, HeadlessEditorPreset } from "./headless-editor";
import {
  papyraPreset,
  createPapyraPreset,
  PapyraEditor,
  PAPYRA_AVAILABLE_MODES,
  papyraFeaturePolicy,
  PAPYRA_FEATURE_DEFAULTS,
  PAPYRA_FEATURE_ENFORCED,
} from "./papyra";
import type {
  ExtensiveEditorMode,
  ExtensiveEditorProps,
  ExtensiveEditorRef,
  ImageUploadHandler,
  GifUploadHandler,
  ExtensiveExtensionsConfig,
  FeatureFlag,
  FeatureFlags,
  FeatureFlagOverrides,
  ExtensivePresetConfig,
} from "./extensive";
import type { MarkDownEditorProps, MarkDownEditorMode } from "./md-editor";
import type { HTMLEditorProps, HTMLEditorMode } from "./html-editor";
import type {
  LegacyRichEditorProps,
  LegacyRichEditorMode,
  LegacyRichSourceFormat,
} from "./legacy-rich";
import type { HeadlessEditorPresetProps } from "./headless-editor";
import type {
  PapyraEditorProps,
  PapyraEditorRef,
  PapyraOutlineHeading,
  PapyraBlockAnchor,
  PapyraPresetConfig,
} from "./papyra";

export { createPresetEditorConfig } from "../core/preset-config";
export * from "./_shared";

export interface EditorPreset {
  id: string;
  label: string;
  description?: string;
  extensions?: Extension[];
  config?: EditorConfig;
  theme?: LuthorTheme;
  toolbar?: string[];
  components?: Record<string, unknown>;
  css?: string;
}

export {
  extensivePreset,
  createExtensivePreset,
  ExtensiveEditor,
  extensiveExtensions,
  createExtensiveExtensions,
  mdEditorPreset,
  MarkDownEditor,
  htmlEditorPreset,
  HTMLEditor,
  legacyRichPreset,
  LegacyRichEditor,
  headlessEditorPreset,
  HeadlessEditorPreset,
  papyraPreset,
  createPapyraPreset,
  PapyraEditor,
  PAPYRA_AVAILABLE_MODES,
  papyraFeaturePolicy,
  PAPYRA_FEATURE_DEFAULTS,
  PAPYRA_FEATURE_ENFORCED,
};

export type {
  ExtensiveEditorMode,
  ExtensiveEditorProps,
  ExtensiveEditorRef,
  ImageUploadHandler,
  GifUploadHandler,
  ExtensiveExtensionsConfig,
  FeatureFlag,
  FeatureFlags,
  FeatureFlagOverrides,
  ExtensivePresetConfig,
  MarkDownEditorProps,
  MarkDownEditorMode,
  HTMLEditorProps,
  HTMLEditorMode,
  LegacyRichEditorProps,
  LegacyRichEditorMode,
  LegacyRichSourceFormat,
  HeadlessEditorPresetProps,
  PapyraEditorProps,
  PapyraEditorRef,
  PapyraOutlineHeading,
  PapyraBlockAnchor,
  PapyraPresetConfig,
};

export const presetRegistry: Record<string, EditorPreset> = {
  extensive: extensivePreset,
  "legacy-rich": legacyRichPreset,
  "md-editor": mdEditorPreset,
  "html-editor": htmlEditorPreset,
  "headless-editor": headlessEditorPreset,
  papyra: papyraPreset,
};
