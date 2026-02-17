import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../shared/preset-config";

export const docsPreset: EditorPreset = {
  id: "docs",
  label: "Docs",
  description: "Documentation focused with code and callouts.",
  toolbar: ["heading", "bold", "italic", "code", "codeBlock", "link"],
  config: createPresetEditorConfig("docs", "Write documentation..."),
  css: "docs/styles.css",
};
