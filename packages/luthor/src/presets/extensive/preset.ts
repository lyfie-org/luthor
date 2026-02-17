import type { EditorPreset } from "..";
import { extensiveExtensions } from "./extensions";
import { ExtensiveEditor } from "./ExtensiveEditor";
import { createPresetEditorConfig } from "../shared/preset-config";

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
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "link",
    "image",
    "table",
    "blockquote",
    "code",
    "codeBlock",
    "bulletedList",
    "numberedList",
  ],
  config: createPresetEditorConfig("extensive", "Write anything..."),
  css: "extensive/styles.css",
};
