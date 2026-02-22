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
import type {
	ExtensiveEditorMode,
	ExtensiveEditorProps,
	ExtensiveEditorRef,
	ExtensiveExtensionsConfig,
	ExtensivePresetConfig,
} from "./extensive";
export { createPresetEditorConfig } from "../core/preset-config";

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
};

export type {
	ExtensiveEditorMode,
	ExtensiveEditorProps,
	ExtensiveEditorRef,
	ExtensiveExtensionsConfig,
	ExtensivePresetConfig,
};

export const presetRegistry: Record<string, EditorPreset> = {
	extensive: extensivePreset,
};
