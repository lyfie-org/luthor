import type { EditorPreset } from "..";

export const minimalPreset: EditorPreset = {
  id: "minimal",
  label: "Minimal",
  description: "Lightweight editor for short text and embeds.",
  toolbar: ["bold", "italic", "link"],
  config: {
    placeholder: "Write something...",
  },
  css: "minimal/styles.css",
};
