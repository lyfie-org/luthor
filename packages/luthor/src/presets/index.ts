import type {
	EditorConfig,
	Extension,
	LuthorTheme,
} from "@lyfie/luthor-headless";
import {
	extensivePreset,
	createExtensivePreset,
	ExtensiveEditor,
	extensiveExtensions,
	createExtensiveExtensions,
} from "./extensive";
import { simpleTextPreset, SimpleTextEditor } from "./simple-text";
import { richTextBoxPreset, RichTextBoxEditor } from "./rich-text-box";
import { chatWindowPreset, ChatWindowEditor } from "./chat-window";
import { emailComposePreset, EmailComposeEditor } from "./email-compose";
import { mdTextPreset, MDTextEditor } from "./md-text";
import { notionLikePreset, NotionLikeEditor } from "./notion-like";
import { headlessEditorPreset, HeadlessEditorPreset } from "./headless-editor";
import { notesPreset, NotesEditor } from "./notes";
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
import type { SimpleTextEditorProps } from "./simple-text";
import type { RichTextBoxEditorProps } from "./rich-text-box";
import type {
	ChatWindowFormattingOptions,
	ChatWindowEditorProps,
	ChatWindowEditorSendPayload,
	ChatWindowOutputFormat,
	ChatWindowToolbarButton,
} from "./chat-window";
import type { EmailComposeEditorProps } from "./email-compose";
import type { MDTextEditorProps, MDTextEditorMode } from "./md-text";
import type { NotionLikeEditorProps } from "./notion-like";
import type { HeadlessEditorPresetProps } from "./headless-editor";
import type { NotesEditorProps } from "./notes";
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
	simpleTextPreset,
	SimpleTextEditor,
	richTextBoxPreset,
	RichTextBoxEditor,
	chatWindowPreset,
	ChatWindowEditor,
	emailComposePreset,
	EmailComposeEditor,
	mdTextPreset,
	MDTextEditor,
	notionLikePreset,
	NotionLikeEditor,
	headlessEditorPreset,
	HeadlessEditorPreset,
	notesPreset,
	NotesEditor,
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
	SimpleTextEditorProps,
	RichTextBoxEditorProps,
	ChatWindowEditorProps,
	ChatWindowEditorSendPayload,
	ChatWindowOutputFormat,
	ChatWindowFormattingOptions,
	ChatWindowToolbarButton,
	EmailComposeEditorProps,
	MDTextEditorProps,
	MDTextEditorMode,
	NotionLikeEditorProps,
	HeadlessEditorPresetProps,
	NotesEditorProps,
};

export const presetRegistry: Record<string, EditorPreset> = {
	extensive: extensivePreset,
	"simple-text": simpleTextPreset,
	"rich-text-box": richTextBoxPreset,
	"chat-window": chatWindowPreset,
	"email-compose": emailComposePreset,
	"md-text": mdTextPreset,
	"notion-like": notionLikePreset,
	"headless-editor": headlessEditorPreset,
	notes: notesPreset,
};
