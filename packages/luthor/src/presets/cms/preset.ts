import type { EditorPreset } from "..";

export const cmsPreset: EditorPreset = {
  id: "cms",
  label: "CMS",
  description: "Structured content with validation and schema rules.",
  toolbar: ["heading", "bold", "italic", "link", "image"],
  config: {
    placeholder: "Compose structured content...",
  },
  css: "cms/styles.css",
};
