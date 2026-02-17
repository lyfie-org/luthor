import type { EditorPreset } from "..";

export const defaultPreset: EditorPreset = {
  id: "default",
  label: "Default",
  description: "Balanced general purpose editor preset.",
  toolbar: ["heading", "bold", "italic", "link", "image", "table"],
  config: {
    placeholder: "Start writing...",
  },
  css: "default/styles.css",
};
