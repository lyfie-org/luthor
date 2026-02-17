import type { EditorPreset } from "..";
import { createPresetEditorConfig } from "../shared/preset-config";

export const codePreset: EditorPreset = {
  id: "code",
  label: "Code",
  description: "Developer focused editing with code as a first class block.",
  toolbar: ["code", "codeBlock", "copy", "link"],
  config: createPresetEditorConfig("code", "Paste or write code..."),
  css: "code/styles.css",
};
