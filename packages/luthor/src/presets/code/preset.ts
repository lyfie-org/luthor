import type { EditorPreset } from "..";

export const codePreset: EditorPreset = {
  id: "code",
  label: "Code",
  description: "Developer focused editing with code as a first class block.",
  toolbar: ["code", "codeBlock", "copy", "link"],
  config: {
    placeholder: "Paste or write code...",
  },
  css: "code/styles.css",
};
