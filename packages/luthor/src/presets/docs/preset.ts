import type { EditorPreset } from "..";

export const docsPreset: EditorPreset = {
  id: "docs",
  label: "Docs",
  description: "Documentation focused with code and callouts.",
  toolbar: ["heading", "bold", "italic", "code", "codeBlock", "link"],
  config: {
    placeholder: "Write documentation...",
  },
  css: "docs/styles.css",
};
