import type { EditorPreset } from "..";
import { extensiveExtensions } from "./extensions";
import { ExtensiveEditor } from "./ExtensiveEditor";
import { createPresetEditorConfig } from "../../core/preset-config";

export const extensivePreset: EditorPreset = {
  id: "extensive",
  label: "Extensive",
  description: "All features enabled for power users.",
  extensions: [...extensiveExtensions],
  components: {
    Editor: ExtensiveEditor,
  },
  toolbar: [
    "undo",
    "redo",
    "heading",
    "fontFamily",
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "link",
    "image",
    "table",
    "horizontalRule",
    "htmlEmbed",
    "blockquote",
    "code",
    "codeBlock",
    "bulletedList",
    "numberedList",
    "commandPalette",
    "floatingToolbar",
    "contextMenu",
    "draggableBlock",
    "customNode",
    "sourceMode",
    "themeToggle",
  ],
  config: createPresetEditorConfig("extensive", "Write anything..."),
  css: "extensive/styles.css",
};
