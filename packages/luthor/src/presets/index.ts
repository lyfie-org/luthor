import type { EditorConfig, Extension, LuthorTheme } from "@lyfie/luthor-headless";
import {
  extensivePreset,
  createExtensivePreset,
  ExtensiveEditor,
  extensiveExtensions,
  createExtensiveExtensions,
} from "./extensive";
import { composePreset, ComposeEditor } from "./compose";
import { simpleEditorPreset, SimpleEditor } from "./simple-editor";
import { mdEditorPreset, MDEditor } from "./md-editor";
import { htmlEditorPreset, HTMLEditor } from "./html-editor";
import { legacyRichPreset, LegacyRichEditor } from "./legacy-rich";
import { slashEditorPreset, SlashEditor } from "./slash-editor";
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
  SimpleFormattingOptions,
  SimpleEditorProps,
  SimpleEditorSendPayload,
  SimpleEditorOutputFormat,
  SimpleToolbarButton,
} from "./simple-editor";
import type { MDEditorProps, MDEditorMode } from "./md-editor";
import type { HTMLEditorProps, HTMLEditorMode } from "./html-editor";
import type {
  LegacyRichEditorProps,
  LegacyRichEditorMode,
  LegacyRichSourceFormat,
} from "./legacy-rich";
import type { SlashEditorProps } from "./slash-editor";
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
  simpleEditorPreset,
  SimpleEditor,
  mdEditorPreset,
  MDEditor,
  htmlEditorPreset,
  HTMLEditor,
  legacyRichPreset,
  LegacyRichEditor,
  slashEditorPreset,
  SlashEditor,
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
  SimpleEditorProps,
  SimpleEditorSendPayload,
  SimpleEditorOutputFormat,
  SimpleFormattingOptions,
  SimpleToolbarButton,
  MDEditorProps,
  MDEditorMode,
  HTMLEditorProps,
  HTMLEditorMode,
  LegacyRichEditorProps,
  LegacyRichEditorMode,
  LegacyRichSourceFormat,
  SlashEditorProps,
  HeadlessEditorPresetProps,
};

export const presetRegistry: Record<string, EditorPreset> = {
  extensive: extensivePreset,
  compose: composePreset,
  "simple-editor": simpleEditorPreset,
  "legacy-rich": legacyRichPreset,
  "md-editor": mdEditorPreset,
  "html-editor": htmlEditorPreset,
  "slash-editor": slashEditorPreset,
  "headless-editor": headlessEditorPreset,
};
