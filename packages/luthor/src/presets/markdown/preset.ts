import type { EditorPreset } from "..";

export const markdownPreset: EditorPreset = {
  id: "markdown",
  label: "Markdown",
  description: "Markdown first editing with predictable output.",
  toolbar: ["bold", "italic", "link", "code", "codeBlock"],
  config: {
    placeholder: "Write in markdown...",
  },
  css: "markdown/styles.css",
};
