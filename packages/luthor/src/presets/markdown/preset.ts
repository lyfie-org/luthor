import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../shared/preset-config";

export const markdownPreset: EditorPreset = {
  id: "markdown",
  label: "Markdown",
  description: "Markdown first editing with predictable output.",
  toolbar: ["bold", "italic", "link", "code", "codeBlock"],
  config: createPresetEditorConfig("markdown", "Write in markdown..."),
  css: "markdown/styles.css",
};
