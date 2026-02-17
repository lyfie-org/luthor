import type { EditorPreset } from "..";

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
  config: {
    placeholder: "Start writing...",
  },
  css: "classic/styles.css",
};
