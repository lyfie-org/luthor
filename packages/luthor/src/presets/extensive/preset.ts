import type { EditorPreset } from "..";
import { createExtensiveExtensions, extensiveExtensions } from "./extensions";
import { ExtensiveEditor } from "./ExtensiveEditor";
import { createPresetEditorConfig } from "../../core/preset-config";
import type {
  FontFamilyOption,
  FontSizeOption,
  LineHeightOption,
  CodeLanguageOptionsConfig,
} from "@lyfie/luthor-headless";

export const extensiveToolbar = [
  "undo",
  "redo",
  "fontFamily",
  "heading",
  "fontSize",
  "lineHeight",
  "textColor",
  "textHighlight",
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "subscript",
  "superscript",
  "link",
  "image",
  "table",
  "horizontalRule",
  "iframeEmbed",
  "youtubeEmbed",
  "blockquote",
  "code",
  "codeBlock",
  "bulletedList",
  "numberedList",
  "checkList",
  "commandPalette",
  "floatingToolbar",
  "contextMenu",
  "draggableBlock",
  "customNode",
  "sourceMode",
  "themeToggle",
] as const;

export const extensivePreset: EditorPreset = {
  id: "extensive",
  label: "Extensive",
  description: "All features enabled for power users.",
  extensions: [...extensiveExtensions],
  components: {
    Editor: ExtensiveEditor,
  },
  toolbar: [...extensiveToolbar],
  config: createPresetEditorConfig("extensive", "Write anything..."),
  css: "extensive/styles.css",
};

export type ExtensivePresetConfig = {
  fontFamilyOptions?: readonly FontFamilyOption[];
  fontSizeOptions?: readonly FontSizeOption[];
  lineHeightOptions?: readonly LineHeightOption[];
  minimumDefaultLineHeight?: string | number;
  isCopyAllowed?: boolean;
  languageOptions?: readonly string[] | CodeLanguageOptionsConfig;
};

export function createExtensivePreset(
  config: ExtensivePresetConfig = {},
): EditorPreset {
  return {
    ...extensivePreset,
    extensions: [...createExtensiveExtensions({
      fontFamilyOptions: config.fontFamilyOptions,
      fontSizeOptions: config.fontSizeOptions,
      lineHeightOptions: config.lineHeightOptions,
      minimumDefaultLineHeight: config.minimumDefaultLineHeight,
      isCopyAllowed: config.isCopyAllowed,
      languageOptions: config.languageOptions,
    })],
  };
}
