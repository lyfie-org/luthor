import type { EditorPreset } from "..";
import { createExtensiveExtensions, extensiveExtensions } from "./extensions";
import { ExtensiveEditor } from "./ExtensiveEditor";
import { createPresetEditorConfig } from "../../core/preset-config";
import type { FontFamilyOption } from "@lyfie/luthor-headless";

export const extensiveToolbar = [
  "undo",
  "redo",
  "heading",
  "fontFamily",
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
};

export function createExtensivePreset(
  config: ExtensivePresetConfig = {},
): EditorPreset {
  return {
    ...extensivePreset,
    extensions: [...createExtensiveExtensions({
      fontFamilyOptions: config.fontFamilyOptions,
    })],
  };
}
