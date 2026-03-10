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
import { mdEditorPreset, MDEditor } from "./md-editor";
import { mdFriendlyPreset, MDFriendlyEditor } from "./md-friendly";
import { htmlEditorPreset, HTMLEditor } from "./html-editor";
import { LegacyRichEditor } from "./legacy-rich";
import { slashEditorPreset, SlashEditor } from "./slash-editor";
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
import type { MDEditorProps, MDEditorMode } from "./md-editor";
import type { MDFriendlyEditorProps, MDFriendlyEditorMode } from "./md-friendly";
import type { HTMLEditorProps, HTMLEditorMode } from "./html-editor";
import type {
  LegacyRichEditorProps,
  LegacyRichEditorMode,
  LegacyRichSourceFormat,
} from "./legacy-rich";
import type { SlashEditorProps } from "./slash-editor";
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
  mdEditorPreset,
  MDEditor,
  mdFriendlyPreset,
  MDFriendlyEditor,
  htmlEditorPreset,
  HTMLEditor,
  LegacyRichEditor,
  slashEditorPreset,
  SlashEditor,
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
  MDEditorProps,
  MDEditorMode,
  MDFriendlyEditorProps,
  MDFriendlyEditorMode,
  HTMLEditorProps,
  HTMLEditorMode,
  LegacyRichEditorProps,
  LegacyRichEditorMode,
  LegacyRichSourceFormat,
  SlashEditorProps,
  NotionLikeEditorProps,
  HeadlessEditorPresetProps,
};

export const presetRegistry: Record<string, EditorPreset> = {
  extensive: extensivePreset,
  compose: composePreset,
  composer: composerPreset,
  "md-editor": mdEditorPreset,
  "md-friendly": mdFriendlyPreset,
  "html-editor": htmlEditorPreset,
  "slash-editor": slashEditorPreset,
  "notion-like": notionLikePreset,
  "headless-editor": headlessEditorPreset,
};
