import type {
	EditorConfig,
	Extension,
	LuthorTheme,
} from "@lyfie/luthor-headless";
import { blogPreset } from "./blog";
import { chatPreset } from "./chat";
import { classicPreset } from "./classic";
import { cmsPreset } from "./cms";
import { codePreset } from "./code";
import { defaultPreset } from "./default";
import { docsPreset } from "./docs";
import { emailPreset } from "./email";
import { extensivePreset, ExtensiveEditor, extensiveExtensions } from "./extensive";
import { markdownPreset } from "./markdown";
import { minimalPreset } from "./minimal";

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
	minimalPreset,
	classicPreset,
	docsPreset,
	blogPreset,
	cmsPreset,
	chatPreset,
	emailPreset,
	markdownPreset,
	codePreset,
	defaultPreset,
	extensivePreset,
  ExtensiveEditor,
  extensiveExtensions,
};

export const presetRegistry: Record<string, EditorPreset> = {
	minimal: minimalPreset,
	classic: classicPreset,
	docs: docsPreset,
	blog: blogPreset,
	cms: cmsPreset,
	chat: chatPreset,
	email: emailPreset,
	markdown: markdownPreset,
	code: codePreset,
	default: defaultPreset,
	extensive: extensivePreset,
};
