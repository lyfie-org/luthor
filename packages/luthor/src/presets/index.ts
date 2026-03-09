import type { EditorConfig, Extension, LuthorTheme } from "@lyfie/luthor-headless";
import {
  extensivePreset,
  createExtensivePreset,
  ExtensiveEditor,
  extensiveExtensions,
  createExtensiveExtensions,
} from "./extensive";
import { composePreset, ComposeEditor } from "./compose";
import { composerPreset, ComposerEditor } from "./composer";
import { mdFriendlyPreset, MDFriendlyEditor } from "./md-friendly";
import { notionLikePreset, NotionLikeEditor } from "./notion-like";
import { headlessEditorPreset, HeadlessEditorPreset } from "./headless-editor";
import type {
  ExtensiveEditorMode,
  ExtensiveEditorProps,
  ExtensiveEditorRef,
  ExtensiveExtensionsConfig,
  FeatureFlag,
  FeatureFlags,
  FeatureFlagOverrides,
  ExtensivePresetConfig,
} from "./extensive";
import type { ComposeEditorProps } from "./compose";
import type {
  ComposerFormattingOptions,
  ComposerEditorProps,
  ComposerEditorSendPayload,
  ComposerOutputFormat,
  ComposerToolbarButton,
} from "./composer";
import type { MDFriendlyEditorProps, MDFriendlyEditorMode } from "./md-friendly";
import type { NotionLikeEditorProps } from "./notion-like";
import type { HeadlessEditorPresetProps } from "./headless-editor";

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
  composePreset,
  ComposeEditor,
  composerPreset,
  ComposerEditor,
  mdFriendlyPreset,
  MDFriendlyEditor,
  notionLikePreset,
  NotionLikeEditor,
  headlessEditorPreset,
  HeadlessEditorPreset,
};

export type {
  ExtensiveEditorMode,
  ExtensiveEditorProps,
  ExtensiveEditorRef,
  ExtensiveExtensionsConfig,
  FeatureFlag,
  FeatureFlags,
  FeatureFlagOverrides,
  ExtensivePresetConfig,
  ComposeEditorProps,
  ComposerEditorProps,
  ComposerEditorSendPayload,
  ComposerOutputFormat,
  ComposerFormattingOptions,
  ComposerToolbarButton,
  MDFriendlyEditorProps,
  MDFriendlyEditorMode,
  NotionLikeEditorProps,
  HeadlessEditorPresetProps,
};

export const presetRegistry: Record<string, EditorPreset> = {
  extensive: extensivePreset,
  compose: composePreset,
  composer: composerPreset,
  "md-friendly": mdFriendlyPreset,
  "notion-like": notionLikePreset,
  "headless-editor": headlessEditorPreset,
};
