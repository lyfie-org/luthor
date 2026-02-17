import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../shared/preset-config";

export const classicPreset: EditorPreset = {
  id: "classic",
  label: "Classic",
  description: "Full featured WYSIWYG default.",
  toolbar: [
    "undo",
    "redo",
    "bold",
    "italic",
    "underline",
    "link",
    "image",
    "table",
    "bulletedList",
    "numberedList",
  ],
  config: createPresetEditorConfig("classic", "Start writing..."),
  css: "classic/styles.css",
};
